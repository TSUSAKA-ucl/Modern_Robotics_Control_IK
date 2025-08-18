'use strict';
// Worker script for handling messages and performing calculations
// import * as THREE from 'three' // THREE.jsを使わなければNext.jsやViteでのビルドが不要
// worker state definition
import {TrapVelocGenerator} from './TrapVelocGenerator.js'

const st = Object.freeze({
  initializing: 1,
  waitingRobotType: 2,
  generatorMaking: 3,
  generatorReady: 4,
  slrmReady: 5,
})
const sst = Object.freeze({
  dormant: 1,
  converged: 2,
  moving: 3,
  rewinding: 4,
})
let workerState = st.initializing; // worker state
let subState = sst.dormant;  // slrm & jointRewinder state
console.log('Now intended to import ModuleFactory');
// import ModuleFactory from '/wasm/slrm_module.js';
const ModuleFactory = await import('/wasm/slrm_module.js');
console.log('ModuleFactory: ', ModuleFactory);
console.log('ModuleFactory.default type:', typeof ModuleFactory.default);
if (typeof ModuleFactory.default !== 'function') {
  console.error('ModuleFactory.default is not a function:', ModuleFactory.default);
  throw new Error('ModuleFactory.default is not a valid function');
}
const SlrmModule = await ModuleFactory.default();
if (!SlrmModule) {
  console.error('Failed to load SlrmModule');
  throw new Error('SlrmModule could not be loaded');
}
const statusName = {
  [SlrmModule.CmdVelGeneratorStatus.OK.value]: 'OK',
  [SlrmModule.CmdVelGeneratorStatus.ERROR.value]: 'ERROR',
  [SlrmModule.CmdVelGeneratorStatus.END.value]: 'END',
  [SlrmModule.CmdVelGeneratorStatus.SINGULARITY.value]: 'SINGULARITY',
  [SlrmModule.CmdVelGeneratorStatus.REWIND.value]: 'REWIND',
};

// ******** definitions of global variables ********
const timeInterval = 4; // time step for simulation in milliseconds
const logInterval = 0n/BigInt(timeInterval); // log interval in BigInt
let controllerTfVec = null; // endLinkPoseの値を受け取るベクトル
let counter = 0n;
let initialJoints = null;
let jointRewinder = null;
let joints = null; // joint position vector. size is 6,7 or 8
let prevJoints = null; // 前回のジョイントポジション
let velocities = null;
let logPrevJoints = null; // ログ出力用の前回ジョイントポジション
const jointUpperLimits = [];
const jointLowerLimits = [];
let cmdVelGen = null; // コマンド速度生成器WASMオブジェクト
let makeDoubleVectorG = null; // helper function for DoubleVector
// let newDestinationFlag = false; // 新しいdestinationが来たかどうか
let exactSolution = false; // singularity通過のための設定

// ******** helper functions ********
// SlrmModuleを閉じ込めて、その関連オブジェクトを生成するhelper関数群
function createHelpers(module) {
  function makeDoubleVector(jsArray) {
    const vec = new module.DoubleVector();
    for (let i = 0; i < jsArray.length; ++i) {
      vec.push_back(jsArray[i]);
    }
    return vec;
  }
  function makeJointModelVector(jsArray) {
    const vec = new module.JointModelFlatStructVector();
    for (let i = 0; i < jsArray.length; ++i) {
      vec.push_back(jsArray[i]);
    }
    return vec;
  }
  // 他のヘルパー関数もここに追加できる
  // }

  // 他にも必要な関数を追加できる
  return {
    makeDoubleVector,
    makeJointModelVector,
    // ... more helpers
  };
}

let socket = null; // WebSocketオブジェクト
let shutdownFlag = false; // workerの終了フラグ

// ******** worker message handler ********
console.log('now setting onmessage')
self.onmessage = function(event) {
  const data = event.data;
  switch (data.type) {
  case 'shutdown': // workerを終了する
    if (socket) {
      socket.close();
      socket = null;
    }
    if (SlrmModule) {
      SlrmModule.delete(); // WASMモジュールを解放
    }
    self.postMessage({type: 'shutdown_complete'});
    shutdownFlag = true; // workerを終了するフラグを立てる
    break;
  case 'wsURL': // WebSocket URLを受け取ったとき
    socket = new WebSocket(data.wsURL);
    break;
  case 'init': if (workerState === st.waitingRobotType) {
    workerState = st.generatorMaking;
    console.log('constructing CmdVelGenerator with :', data.filename);
    // 初期化処理
    const { makeDoubleVector, makeJointModelVector } = createHelpers(SlrmModule);
    makeDoubleVectorG = makeDoubleVector; // グローバルにヘルパー関数を保存
    SlrmModule.setJsLogLevel(3); // 3: info level, 4: debug level
    fetch(data.filename)
      .then(response => response.json())
      .then(jsonData => {
	const revolutes = jsonData.filter(obj => obj.$.type === 'revolute');
	// 各行をJointModelFlatStructに変換
	const jointModels = revolutes.map(obj => {
	  const xyz_in = obj.origin.$.xyz ?? [NaN, NaN, NaN];
	  const xyz = makeDoubleVector(Array.isArray(xyz_in) && xyz_in.length === 3
				       ? xyz_in : [NaN, NaN, NaN]);
	  const rpy_in = obj.origin.$.rpy ?? [NaN, NaN, NaN];
	  const rpy = makeDoubleVector(Array.isArray(rpy_in) && rpy_in.length === 3
				       ? rpy_in : [NaN, NaN, NaN]);
	  const axis_in = obj.axis.$.xyz ?? [NaN, NaN, NaN];
	  const axis = makeDoubleVector(Array.isArray(axis_in) && axis_in.length === 3
					? axis_in : [NaN, NaN, NaN]);
	  const jointModel = new SlrmModule.JointModelFlatStruct(axis, xyz, rpy);
	  axis.delete();
	  xyz.delete();
	  rpy.delete();
	  return jointModel;
	});
	const jointModelVector = makeJointModelVector(jointModels);
	console.log('type of SlrmModule.CmdVelGen: '
		    + typeof SlrmModule.CmdVelGenerator);
	cmdVelGen = new SlrmModule.CmdVelGenerator(jointModelVector);
	jointModels.forEach(model => model.delete());
	if (cmdVelGen === null || cmdVelGen === undefined) {
	  console.error('generation of CmdVelGen instance failed');
	  cmdVelGen = null;
	  return;
	}
	if (cmdVelGen !== null && cmdVelGen !== undefined) {
	  console.log('CmdVelGen instance created:', cmdVelGen);
	}
	// joint limitsの設定
	revolutes.forEach(obj => {
	  jointUpperLimits.push(obj.limit.$.upper);
	  jointLowerLimits.push(obj.limit.$.lower);
	});
	console.log('jointLimits: ', jointUpperLimits, jointLowerLimits);
	console.log('Status Definitions: ' +
		    "OK:" + SlrmModule.CmdVelGeneratorStatus.OK.value + ", " +
		    "ERROR:" + SlrmModule.CmdVelGeneratorStatus.ERROR.value + ", " +
		    "END:" + SlrmModule.CmdVelGeneratorStatus.END.value);
	cmdVelGen.setExactSolution(exactSolution); // 特異点通過のための設定
	cmdVelGen.setLinearVelocityLimit(10.0); // 10 m/s
	cmdVelGen.setAngularVelocityLimit(2*Math.PI); // 2Pi rad/s
	cmdVelGen.setAngularGain(20.0); // 20 s^-1
	cmdVelGen.setLinearGain(20.0); // 20 s^-1
	const jointVelocityLimit
	  = makeDoubleVector(Array(revolutes.length).fill(Math.PI*2.0)); // 2.0Pi/s // 20Pi rad/s
	cmdVelGen.setJointVelocityLimit(jointVelocityLimit); // ジョイント速度制限を設定
	jointVelocityLimit.delete();
	// なにかの加減でオブジェクト生成に失敗した場合はここでエラーがthrownされる
	workerState = st.generatorReady;
	self.postMessage({type: 'generator_ready'});
      })
      .catch(error => {
	console.error('Error fetching or parsing JSON file:', error);
      });
  } break;
  case 'set_initial_joints': if (workerState === st.generatorReady ||
				 workerState === st.slrmReady) {
    if (data.joints) {
      // 初期ジョイントの設定処理
      joints = new Float64Array(data.joints.length);
      joints.set(data.joints);
      initialJoints = joints.slice();
      prevJoints = joints.slice();
      velocities = new Float64Array(joints.length);
      console.log('Setting initial joints:'
		  +joints.map(v => (v*57.2958).toFixed(1)).join(', '));
      if (!jointRewinder ||
	  joints.length !== jointRewinder.length) {
	// 面倒なので、ジョイント数が変わった場合はjointRewinderを全部再生成
	// jointRewinder = Array.from({length: joints.length}, ()=>new TrapVelocGenerator(5,1,1,0.0625));
	jointRewinder = Array(joints.length).fill(null).map((_, i) => {
	  if (i<=1) { // joint 1, 2は特に遅くする
	    return new TrapVelocGenerator(5, 1, 0.2, 0.02);
	  } else {
	    return new TrapVelocGenerator(5, 1, 1, 0.0625); // 5s, 1m/s, 1rad/s, 0.0625s
	  }
	});
      }
      jointRewinder.map((der,ix)=>{der.reset(); der.setX0(initialJoints[ix])});
      workerState = st.slrmReady;
      controllerTfVec = []; // 現在値をゴールにしてcalcVelocityPQを1回実行する
      subState = sst.moving; // 目標位置に移動中
      // subState = sst.converged;
      console.log('Worker state changed to slrmReady');
    }
  } break;
  case 'destination': if (workerState === st.slrmReady &&
			  data.endLinkPose ) {
    // データの受信処理
    //newDestinationFlag = true; // 新しいdestinationが来た
    controllerTfVec = [...data.endLinkPose];
    // console.log('Received destination: '
    // 		+ controllerTfVec[12].toFixed(3) + ', '
    // 		+ controllerTfVec[13].toFixed(3) + ', '
    // 		+ controllerTfVec[14].toFixed(3));
    subState = sst.moving;
  } break;
  case 'slow_rewind':
    if (workerState === st.slrmReady &&
	joints && initialJoints && jointRewinder) {
      if (data.slowRewind == true) {
	subState = sst.rewinding;
      } else {
	subState = sst.converged;
      }
    }
    break;
  case 'set_end_effector_point':
    // workerStateとsubStateが何のときに可能とするかは未定
    if (data.endEffectorPoint && makeDoubleVectorG) {
      // if (data.endEffectorPoint === null) {
      // 	const ee = cmdVelGen.getEndEffectorPosition();
      // 	const endEffectorPoint = [ee.get(0), ee.get(1), ee.get(2)];
      // 	ee.delete();
      // 	self.postMessage({type: 'end_effector_point',
      // 			  endEffectorPoint: endEffectorPoint});
      // }
      if (data.endEffectorPoint.length === 3 &&
	  typeof data.endEffectorPoint[0] === 'number' &&
	  typeof data.endEffectorPoint[1] === 'number' &&
	  typeof data.endEffectorPoint[2] === 'number') {
	console.debug('Setting end effector point: ', data.endEffectorPoint);
	const endEffectorPosition = makeDoubleVectorG(data.endEffectorPoint);
	cmdVelGen.setEndEffectorPosition(endEffectorPosition);
	endEffectorPosition.delete();
	const tmp = subState;
	subState = sst.moving; // アームをee移動分だけ動かすために一回呼ぶ
	controllerTfVec = []; // 現在値をゴールにしてcalcVelocityPQを1回実行する
	mainFunc(0); // ここでeeの位置を更新
	subState = tmp; // 元の状態に戻す
      }
    }
    break;
  case 'set_exact_solution':
    if (workerState === st.generatorReady || workerState === st.slrmReady) {
      if (data.exactSolution !== undefined) {
	if (data.exactSolution === true) {
	  exactSolution = true;
	} else {
	  exactSolution = false;
	}
	cmdVelGen.setExactSolution(exactSolution);
	console.log('Exact solution for singularity set to: ', exactSolution);
      }
    }
    break;
  default:
    break;
  }
};

// ******** main function ********
function mainFunc(timeStep) {
  let result_status = null;
  let result_other = null;
  let position = null;
  let quaternion = null;
  // if (!result_status)
  //   result_status = {value: SlrmModule.CmdVelGeneratorStatus.OK.value};
  // if (!result_othre)
  //   result_other = {condition_number: 0,
  // 		    manipulability: 0,
  // 		    sensitivity_scale: 0};
  if (!cmdVelGen || !joints) return;
  if (workerState === st.slrmReady &&
      (subState === sst.moving || subState === sst.rewinding)) {
    if (subState === sst.rewinding) {
      const res = jointRewinder.map((der,i)=>
	der.calcNext(joints[i], velocities[i], timeStep));
      for (let i=0; i<joints.length; i++) {
	joints[i] = res[i].x;
	velocities[i] = res[i].v;
      }
      controllerTfVec = []; // 現在値をゴールにしてcalcVelocityPQを1回実行する
    } else if (subState === sst.converged) {
      velocities.fill(0); // sst.rewindingから出た時に必要
    }
    if (controllerTfVec === null) {
      // console.warn('controllerTfVec is not ready yet.');
      return;
    }
    const jointVec = makeDoubleVectorG(joints);
    const endLinkPose = makeDoubleVectorG(controllerTfVec);
    const result = cmdVelGen.calcVelocityPQ(jointVec, endLinkPose);
    jointVec.delete();
    endLinkPose.delete();
    // velocities = new Float64Array(result.joint_velocities.size());
    // velocities = velocities.map((_, idx) => result.joint_velocities.get(idx));
    if (subState !== sst.rewinding) {
      for (let i=0; i<velocities.length; i++) {
	velocities[i] = result.joint_velocities.get(i);
      }
    }
    result.joint_velocities.delete();
    result_status = result.status;
    result_other = result.other;
    if (!position || !quaternion) {
      position = new Float64Array(3);
      quaternion = new Float64Array(4);
    }
    position[0] = result.position.get(0);
    position[1] = result.position.get(1);
    position[2] = result.position.get(2);
    quaternion[0] = result.quaternion.get(0);
    quaternion[1] = result.quaternion.get(1);
    quaternion[2] = result.quaternion.get(2);
    quaternion[3] = result.quaternion.get(3);
    result.position.delete();
    result.quaternion.delete();
    // console.log('status: ', result.status.value);
    if (subState === sst.rewinding &&
	result.status.value !== SlrmModule.CmdVelGeneratorStatus.END.value &&
	result.status.value !== SlrmModule.CmdVelGeneratorStatus.OK.value) {
      console.warn('CmdVelGenerator returned status other than END or OK during rewinding:', statusName[result.status.value]);
    }
    if (subState === sst.moving) {
      switch (result.status.value) {
      case SlrmModule.CmdVelGeneratorStatus.OK.value:
	prevJoints.set(joints);
	for (let i=0; i<joints.length; i++) {
	  joints[i] = joints[i] + velocities[i]* timeStep;
	}
	break;
      case SlrmModule.CmdVelGeneratorStatus.END.value:
	// 目標位置に到達した場合の処理
	// cmdPoseExists = false; 
	subState = sst.converged;
	break;
      case SlrmModule.CmdVelGeneratorStatus.SINGULARITY.value:
	// 現状のCmdVelGeneratorではこの状態は発生せずREWINDに変わる
	// cmdPoseExists = false; // cmdPoseが存在しない
	console.error('CmdVelGenerator returned SINGULARITY status');
	break;
      case SlrmModule.CmdVelGeneratorStatus.REWIND.value:
	joints.set(prevJoints); // 前の状態に戻す. 特異点に入る直前の状態になる
	// cmdPoseExists = false; // cmdPoseが存在しない
	break;
      case SlrmModule.CmdVelGeneratorStatus.ERROR.value:
	console.error('CmdVelGenerator returned ERROR status');
	break;
      default:
	console.error('Unknown status from CmdVelGenerator:', result.status.value);
	break;
      }
    }
  }
  if (result_status !== null && result_other !== null) {
    let limitFlag = Array(joints.length).fill(0);
    for (let i=0; i<joints.length; i++) {
      if (joints[i] > jointUpperLimits[i]) {
	limitFlag[i] = 1;
	joints[i] = jointUpperLimits[i] - 0.001; // 
      }
      if (joints[i] < jointLowerLimits[i]) {
	limitFlag[i] = -1;
	joints[i] = jointLowerLimits[i] + 0.001; //
      }
    }
    self.postMessage({type: 'joints', joints: [...joints]});
    self.postMessage({type: 'status', status: statusName[result_status.value],
		      exact_solution: exactSolution,
		      condition_number: result_other.condition_number,
		      manipulability: result_other.manipulability,
		      sensitivity_scale: result_other.sensitivity_scale,
		      limit_flag: limitFlag});
    self.postMessage({type: 'pose',
		      position: position,
		      quaternion: quaternion,
		     });
    counter ++;
    // if (counter <= 1n) {
    //   console.log('type of logInterval: ', typeof logInterval,
    // 		  ' type of counter: ', typeof counter);
    // }
    if (logInterval !== 0n && counter % logInterval === 0n) {
      if (logPrevJoints !== null && joints !== null &&
	  logPrevJoints.length === joints.length) {
	if (Math.max(...logPrevJoints.map((v, i) => Math.abs(v - joints[i]))) > 0.005) {
	  // ログ出力
	  console.log('counter:', counter,
		      'status: ', statusName[result_status.value] ,
		      ' condition:' , result_other.condition_number.toFixed(2) ,
		      ' m:' , result_other.manipulability.toFixed(3) ,
		      ' k:' , result_other.sensitivity_scale.toFixed(3)
		      + '\n' +
		      'limit flags: ' + limitFlag.join(', '));
	  //   console.log('Worker: joints at ' + (counter / (60n*100n / BigInt(timeInterval))).toString() + ' minutes: ' + joints.map(v => (v*57.2958).toFixed(1)).join(', '));
	}
      }
      if (!logPrevJoints) logPrevJoints = joints.slice();
      logPrevJoints.set(joints); // ログ出力用の前回ジョイントポジションを更新 配列の複製不要
    }
  }
}


// ******** worker main loop ********
function mainLoop(prevTime = performance.now()-timeInterval) {
  const now = performance.now();
  const deltaTime = now - prevTime;
  mainFunc(deltaTime / 1000); // time step in seconds
  if (shutdownFlag === true) {
    self.postMessage({type: 'shutdown_complete'});
    console.log('main loop was finished')
    self.close()
    return
  }
  setTimeout(() => mainLoop(now), 0); // 次のループをスケジュール
}

// ******** worker start ********
workerState = st.waitingRobotType;
self.postMessage({type: 'ready'});
mainLoop(); // メインループを開始
// event loop
