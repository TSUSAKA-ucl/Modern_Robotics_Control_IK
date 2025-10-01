import * as MessagePack from '@msgpack/msgpack';
import { three2worldMatGen, world2threeMatGen } from './constTransformGen';

let registered = false;
let lastUpdate = 0;

let endLinkPosition = new THREE.Vector3();
let endLinkOrientation = new THREE.Quaternion();
let baseLinkPose = null;


// express an isometry as [position Vector3, orientation Quaternion]
function isometry_mul(a1, a2) {
  return [a2[0].applyQuaternion(a1[1]).add(a1[0]),
	  a1[1].clone().multiply(a2[1])];
}
function isometry_inv(a) {
  let q_inv = a[1].clone().conjugate();
  let p_inv = a[0].clone().applyQuaternion(q_inv).negate();
  return [p_inv, q_inv];
}

export default function registerAframeComponents(options) {
  const three2worldMat = three2worldMatGen();
  const world2threeMat = world2threeMatGen();
  if (registered) return;
  registered = true;

  const {
    robotChange,
    set_controller_object,
    set_trigger_on,
    set_grip_on,
    set_button_a_on,
    set_button_b_on,
    set_c_pos_x, set_c_pos_y, set_c_pos_z,
    set_c_deg_x, set_c_deg_y, set_c_deg_z,
    vrModeRef,
    // controller_object,
    props,
    onXRFrameMQTT,
    workerData,
    setThetaBody,
    endLinkPose,
    endLinkPoseUpdater,
    baseLinkPoseInv,
    controllerMagnification,
    controllerStartInv,
    setSlowRewindMode,
    controllerModeChange,
    toolPointMover,
    controllerUpdater,
    topicBridgeWebSocketURL,
  } = options;
  
  AFRAME.registerComponent('robot-click', {
    init: function () {
      if (this.el.object3D?.matrixWorld) {
	baseLinkPose = this.el.object3D.matrixWorld.clone();
	const pBase = this.el.object3D.getWorldPosition(new THREE.Vector3());
	const qBase = this.el.object3D.getWorldQuaternion(new THREE.Quaternion());
	baseLinkPoseInv.current = isometry_inv([pBase, qBase]);
	console.log('00 baseLinkPose diagonal: ',
		    baseLinkPose.elements[0].toFixed(3), ', ',
		    baseLinkPose.elements[5].toFixed(3), ', ',
		    baseLinkPose.elements[10].toFixed(3));
	console.log('00 baseLinkPoseInv: ', baseLinkPoseInv.current);
      }
      this.el.addEventListener('click', () => {
        robotChange();
        console.log('robot-click');
      });
    },
    tick: function () {
      if (this.el.object3D) {
	if (this.el.object3D.matrixWorld) {
	  if (!baseLinkPose.equals(this.el.object3D.matrixWorld)) {
	    baseLinkPose = this.el.object3D.matrixWorld.clone();
	    const pBase = this.el.object3D.getWorldPosition(new THREE.Vector3());
	    const qBase = this.el.object3D.getWorldQuaternion(new THREE.Quaternion());
	    baseLinkPoseInv.current = isometry_inv([pBase, qBase]);
	  }
	}
      }
    }
  });

  AFRAME.registerComponent('vr-controller-right', {
    schema: { type: 'string', default: '' },
    init: function () {
      // set_controller_object(this.el.object3D.MatrixWorld);
      // Trigger 
      this.el.addEventListener('triggerdown', () => set_trigger_on(true));
      this.el.addEventListener('triggerup', () => set_trigger_on(false));

      // Gripper
      this.el.addEventListener('gripdown', () => set_grip_on(true));
      this.el.addEventListener('gripup', () => set_grip_on(false));

      // A/B
      this.el.addEventListener('abuttondown', () => set_button_a_on(true));
      this.el.addEventListener('abuttonup', () => set_button_a_on(false));
      this.el.addEventListener('bbuttondown', () => set_button_b_on(true));
      this.el.addEventListener('bbuttonup', () => set_button_b_on(false));

      this.el.addEventListener('thumbstickmoved', this.logThumbstick);
      this.lastPose = [new THREE.Vector3(), new THREE.Quaternion()];
      this.count = 0;
      this.detail_x_prev = 0;
      this.detail_y_prev = 0;
    },
    logThumbstick: function (evt) {
      if (this.detail_x_prev <= 0.35 && evt.detail.x > 0.35) {
	controllerModeChange(1);
	console.log("RIGHT", controllerModeChange(0));
      }
      const controllerMode = controllerModeChange(0);
      switch (controllerMode) {
      case 'Normal':
	if (evt.detail.y < 0.5 &&
	    this.detail_y_prev >= 0.5) {
	  controllerMagnification.current *= 1.41421356237; // sqrt(2)
	  if (controllerMagnification.current > 1)
	    controllerMagnification.current = 1;
	  console.debug("MAGNIFICATION UP", controllerMagnification.current);
	}
	if (evt.detail.y < -0.35 &&
	    this.detail_y_prev >= -0.35) {
	  controllerMagnification.current *= 0.70710678118; // 1/sqrt(2)
	  console.debug("MAGNIFICATION RESET", controllerMagnification.current);
	}
	if (evt.detail.x < -0.35) {
	  console.log("LEFT", evt.detail.x);
	  setSlowRewindMode(true);
	} else {
	  setSlowRewindMode(false);
	}
	break;
      case 'ToolPoint':
	if (evt.detail.y < -0.35) {
	  toolPointMover(-0.001);
	}
	if (evt.detail.y > 0.35) {
	  toolPointMover(0.001);
	}
	controllerUpdater();
	break;
      }
      this.detail_x_prev = evt.detail.x;
      this.detail_y_prev = evt.detail.y;
    },
    tick: function () {
      const obj = this.el.object3D;
      if (!obj.matrixWorld) return; // not yet initialized
      let controllerPosition = new THREE.Vector3();
      let controllerOrientation = new THREE.Quaternion();
      obj.getWorldPosition(controllerPosition);
      obj.getWorldQuaternion(controllerOrientation);
      const sharedData = this.el.sceneEl.systems['sharedData'];
      const newControllerPose = [controllerPosition, controllerOrientation];
      if (sharedData.controllerPositionOffset &&
	  sharedData.controllerOrientationOffset) {
	const worldCameraQuaternion = new THREE.Quaternion();
	this.el.sceneEl.camera.getWorldQuaternion(worldCameraQuaternion);
	const worldOffset = sharedData.controllerPositionOffset.clone()
	      .applyQuaternion(worldCameraQuaternion);
	newControllerPose[0] = controllerPosition.clone().add(worldOffset);
	//
	const cameraWorldQuaternion = worldCameraQuaternion.clone().conjugate();
	worldCameraQuaternion.multiply(sharedData.controllerOrientationOffset)
	  .multiply(cameraWorldQuaternion);
	newControllerPose[1] = controllerOrientation.clone().
	  multiply(worldCameraQuaternion);
      }
      // copy to sharedData for use in axes1 components
      sharedData.controllerPosition = newControllerPose[0];
      sharedData.controllerOrientation = newControllerPose[1];
      // 
      const controllerBase = isometry_mul(baseLinkPoseInv.current,
					  newControllerPose);
      const controllerBaseMat = new THREE.Matrix4();
      controllerBaseMat.compose(controllerBase[0],
				controllerBase[1],
				new THREE.Vector3(1,1,1));
      set_controller_object(controllerBaseMat);
      if (this._my_init_flag) {
	// if (!pose.equals(this.lastPose)) {
	  //
	  // // **** debugging output ****
	  // const position = new THREE.Vector3();
	  // position.setFromMatrixPosition(this.el.object3D.matrixWorld);
	  // position.applyMatrix4(three2worldMat); // convert to world coord.
	  // console.debug("controller position: " + position.x.toFixed(3)
	  // 	      + ", " + position.y.toFixed(3)
	  // 	      + ", " + position.z.toFixed(3));
	  // controllerUpdater();
	//}
      } else {
	this._my_init_flag = true;
      }
      ++this.count;
      this.lastPose = newControllerPose;
    }
  });

  AFRAME.registerComponent('jtext', {
    schema: {
      text: { type: 'string', default: '' },
      width: { type: 'number', default: 1 },
      height: { type: 'number', default: 0.12 },
      color: { type: 'string', default: 'black' },
      background: { type: 'string', default: 'white' },
      border: { type: 'string', default: 'black' }
    },
    init: function () {
      const el = this.el;
      const data = this.data;
      const bg = document.createElement('a-plane');
      bg.setAttribute('width', data.width);
      bg.setAttribute('height', data.height);
      bg.setAttribute('color', data.background);
      bg.setAttribute('position', '0 0 0.01');
      bg.setAttribute('opacity', '0.8');
      const text = document.createElement('a-entity');
      text.setAttribute('troika-text', {
        value: data.text,
        align: 'center',
        color: data.color,
        fontSize: 0.05,
        maxWidth: data.width * 0.9,
        font: "BIZUDPGothic-Bold.ttf",
      });
      text.setAttribute('position', '0 0 0.01');
      this.text = text;
      el.appendChild(bg);
      el.appendChild(text);
    },
    update: function (oldData) {
      const data = this.data;
      this.text.setAttribute('troika-text', {
        value: data.text,
        align: 'center',
        color: data.color,
        fontSize: 0.05,
        maxWidth: data.width * 0.95,
        font: "BIZUDPGothic-Bold.ttf",
      });
      this.text.setAttribute('position', '0 0 0.01');
    }
  });

  // Start animation in VR scene
  AFRAME.registerComponent('scene', {
    init: function () {
      this.el.addEventListener('enter-vr', () => {
        vrModeRef.current = true;
        console.log('enter-vr');
        if (!props.viewer) {
          let xrSession = this.el.renderer.xr.getSession();
          xrSession.requestAnimationFrame(onXRFrameMQTT);
        }
        set_c_pos_x(0);
        set_c_pos_y(-0.6);
        set_c_pos_z(0.90);
        set_c_deg_x(0);
        set_c_deg_y(0);
        set_c_deg_z(0);
      });
      this.el.addEventListener('exit-vr', () => {
        vrModeRef.current = false;
        console.log('exit-vr');
      });
    },
    tick: function (time, timeDelta) {
      if (workerData.current.joints) {
	if (time - lastUpdate > 16) {
	  lastUpdate = time;
	  setThetaBody(workerData.current.joints);
	}
	console.debug('workerLastJoints: '
		      + workerData.current.joints[0].toFixed(3) + ', '
		      + workerData.current.joints[1].toFixed(3) + ', '
		      + workerData.current.joints[2].toFixed(3));
      }
    }
  });

  // ****************
  // 'axes1' represents the modified pose of the right-hand controller
  // ****************
  AFRAME.registerComponent('axes1', {
    init() {
      // this webSocket is used to receive data for modifying the vr-controller,
      // so its event handlers are defined in this axes1 component.
      // We recomment not putting this handler definition in the vr-controller component because
      // it tends to be LONG and tis INITIALIZATION BEHAVIOR is DIFFICULT to control.
      //
      const sharedPosition = new THREE.Vector3(0, 0, 0);
      const sharedOrientation = new THREE.Quaternion(0, 0, 0, 1);
      const sharedJoyAxes = new Array(6).fill(0);
      const sharedJoyButtons = new Array(17).fill(0);
      this.sharedPosition = sharedPosition;
      this.sharedOrientation = sharedOrientation;
      this.sharedJoyAxes = sharedJoyAxes;
      this.sharedJoyButtons = sharedJoyButtons;
      this.usePose = true;
      this.socket = new WebSocket(topicBridgeWebSocketURL);
      this.socket.binaryType = "arraybuffer";
      this.socket.onopen = () => {
	console.log('WebSocket for main thread connected');
      };
      this.socket.onclose = (e) => {
	console.log('webSocket closed. code,reason: ', e.code,e.reason);
      };
      this.socket.onerror = (err) => {
	console.warn('WebSocket encountered error: ', err.message, 'Closing socket');
	this.socket.close();	// the socket must be closed to reconnect
      };
      if (this.usePose) {
	this.socket.onmessage = function(event) {
	  // console.debug('WebSocket message received: ', event.data);
	  // event.data は ArrayBufferで来るはずだが Blobで来たら変換する
	  let arrayBufferData = event.data;
	  if (event.data instanceof Blob) {
	    // Blob なら ArrayBuffer に変換(非同期メソッド) ほとんどの場合ここは通らないので対応しない
	    // arrayBufferData = await event.data.arrayBuffer();
	    console.error('WebSocket data is Blob, not ArrayBuffer');
	  }
	  const recvData = MessagePack.decode(new Uint8Array(arrayBufferData));
	  switch (recvData.topic) {
	  case 'input_pose':
	    // console.debug('recvData: ', recvData);
	    this.pose = true;
	    const pos = new THREE.Vector3(recvData.pose.position.x,
					  recvData.pose.position.y,
					  recvData.pose.position.z);
	    const ori = new THREE.Quaternion(recvData.pose.orientation.x,
					     recvData.pose.orientation.y,
					     recvData.pose.orientation.z,
					     recvData.pose.orientation.w);
	    sharedPosition.copy(pos);
	    sharedOrientation.copy(ori);
	    break;
	  case 'joy':
	    sharedJoyAxes.splice(0, sharedJoyAxes.length, recvData.axes);
	    sharedJoyButtons.splice(0, sharedJoyButtons.length, recvData.buttons);
	    break;
	  }
	};
      }
    },
    remove() {
      this.socket.close();
    },
    tick() {
      const sharedData = this.el.sceneEl.systems['sharedData'];
      if (!sharedData.controllerPositionOffset)
	sharedData.controllerPositionOffset = new THREE.Vector3(0, 0, 0);
      if (!sharedData.controllerOrientationOffset)
	sharedData.controllerOrientationOffset = new THREE.Quaternion(0, 0, 0, 1);
      sharedData.controllerPositionOffset.copy(this.sharedPosition);
      sharedData.controllerOrientationOffset.copy(this.sharedOrientation);
      sharedData.joyAxes = this.sharedJoyAxes;
      sharedData.joyButtons = this.sharedJoyButtons;
      //
      // Set the modified controller position and orientation to the axes1 entity
      // modified position and orientation are
      // calculated in vr-controller-right component
      if (sharedData.controllerPosition) {
	this.el.object3D.position.copy(sharedData.controllerPosition);
      }
      if (sharedData.controllerOrientation) {
	this.el.object3D.quaternion.copy(sharedData.controllerOrientation);
      }
    }
  });

  // ****************
  // Dedicated component for "end-link"
  // ****************
  // tick function calls the endLinkPoseUpdater function
  // which reads the end-link pose from the worker and
  // updates the end-link pose useRef variable,
  // and updates the end-link component's position and orientation
  //
  AFRAME.registerComponent('end-link', {
    init() {
      // this.lastPose = new THREE.Matrix4();
    },
    tick() {
      endLinkPoseUpdater();
      const obj = this.el.object3D;
      if (!obj.matrixWorld ||
	  !baseLinkPoseInv.current ||
	  !baseLinkPose
	 ) return; // not yet initialized
      const endLinkTHREE = baseLinkPose.clone().
	    multiply(world2threeMat).multiply(endLinkPose.current);
      endLinkPosition.setFromMatrixPosition(endLinkTHREE);
      endLinkOrientation.setFromRotationMatrix(endLinkTHREE);
      this.el.object3D.position.copy(endLinkPosition);
      this.el.object3D.quaternion.copy(endLinkOrientation);
    }
  });

}
