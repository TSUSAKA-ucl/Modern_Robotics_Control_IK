"use client";
import 'aframe'
const THREE = window.AFRAME.THREE;
import * as React from 'react'
import RobotScene from './RobotScene';
import registerAframeComponents from './registerAframeComponents'; 
import useMqtt from './useMqtt';
import { mqttclient,idtopic, publishMQTT, codeType } from '../lib/MetaworkMQTT'
import { three2worldMatGen, world2threeMatGen } from './constTransformGen';

// const mr = require('../modern_robotics/modern_robotics_core.js');
// // const RobotKinematics = require('../modern_robotics/modern_robotics_Kinematics.js');
// const RobotDynamcis = require('../modern_robotics/modern_robotics_Dynamics.js');
// const Euler_order = 'ZYX'; // Euler angle order


// MQTT Topics
const MQTT_REQUEST_TOPIC = "mgr/request";
const MQTT_DEVICE_TOPIC = "dev/" + idtopic;
const MQTT_CTRL_TOPIC = "control/"; 
const MQTT_ROBOT_STATE_TOPIC = "robot/";

export default function DynamicHome(props) {
  // State variables
  // Generate constant transformation matrices (THREE.Matrix4)
  const [three2worldMat] = React.useState(()=> three2worldMatGen());
  const [world2threeMat] = React.useState(()=> world2threeMatGen());
  console.debug("three2worldMat: ", three2worldMat.elements);
  console.debug("world2threeMat: ", world2threeMat.elements);

  const [now, setNow] = React.useState(new Date())
  const [rendered,set_rendered] = React.useState(false)
  const robotNameList = ["jaka_zu_5", "agilex_piper"]
  const [robotName,set_robotName] = React.useState(robotNameList[0])

  // initilize Modern Robotics parameters
  // Load Robot Model
  const [robot_model,set_robot_model] = React.useState(robotName); // Change this to your robot model
  const [toolLimit] = React.useState({ min: -1, max: 89 });


  const vrModeRef = React.useRef(false); 
  const [trigger_on,set_trigger_on] = React.useState(false)
  const [grip_on, set_grip_on] = React.useState(false)
  const [button_a_on, set_button_a_on] = React.useState(false)
  const [button_b_on, set_button_b_on] = React.useState(false)
  const [controller_object, set_controller_object] = React.useState(() => {
    const controller_object = new THREE.Matrix4();
    return controller_object;
  });

  const [selectedMode, setSelectedMode] = React.useState('control'); 
  const robotIDRef = React.useRef(idtopic); 

  // VR camera pose
  const [c_pos_x,set_c_pos_x] = React.useState(0.23)
  const [c_pos_y,set_c_pos_y] = React.useState(0.3)
  const [c_pos_z,set_c_pos_z] = React.useState(-0.6)
  const [c_deg_x,set_c_deg_x] = React.useState(0)
  const [c_deg_y,set_c_deg_y] = React.useState(150)
  const [c_deg_z,set_c_deg_z] = React.useState(0)

  const [updateRobot, setUpdateRobot] = React.useState(0)
  const [dsp_message,set_dsp_message] = React.useState("XXX")

  const green_color = 'lime';
  const red_color = 'red';
  const dsp_color = React.useRef(green_color); // Default color for DSP message

  // Robot Tool
  const toolNameList = ["No tool"]
  const [toolName,set_toolName] = React.useState(toolNameList[0])

  // Frame ID
  const reqIdRef = React.useRef()
  // The pose of the end link
  const endLinkPose = React.useRef(new THREE.Matrix4());
  const endLinkPoseStart = React.useRef(null);
  const baseLinkPoseInv = React.useRef(null);
  const controllerStartInv = React.useRef(null);
  React.useEffect(()=>{
    // endLinkPose.current =
    endLinkPoseStart.current = null;
    baseLinkPoseInv.current = null;
    controllerStartInv.current = null;
  }, [robot_model]);

  //*** controller mode change functions
  const [controllerModeChange] = React.useState(() => {
    let modeNumber = 0;
    const controllerMode = ['Normal', 'ToolPoint'];
    return (incr) => {
      modeNumber += incr;
      if (modeNumber < 0) {
	modeNumber = controllerMode.length - 1;
      } else if (modeNumber >= controllerMode.length) {
	modeNumber = 0;
      }
      console.debug("Controller Mode changed to: ", controllerMode[modeNumber]);
      return controllerMode[modeNumber];
    };
  });
  // *** function that sets the end effector point in the worker thread
  const [toolPointMover] = React.useState(() => {
    let toolPoint = new THREE.Vector3(0, 0, 0);
    return (delta) => {
      if (typeof delta === 'number') {
	toolPoint.z += delta;
	workerRef.current
	  .postMessage({type: 'set_end_effector_point',
			endEffectorPoint: toolPoint.toArray()});
	console.debug("Tool Point moved to: ", toolPoint.x.toFixed(3),
		      toolPoint.y.toFixed(3), toolPoint.z.toFixed(3));
      } else if (delta === null) {
	// reset
	toolPoint.x = 0; toolPoint.y = 0; toolPoint.z = 0;
      }
      return toolPoint;
    };});
  // *** updater of the start poses of the end link and controller
  const [controllerUpdate, setControllerUpdate] = React.useState(0);
  const [controllerUpdater] = React.useState(() => {
    return () => { setControllerUpdate(controllerUpdate + 1); };
  });
  // ****************
  // Animation loop
  const loop = (timestamp)=>{
    reqIdRef.current = window.requestAnimationFrame(loop) 
  }
  React.useEffect(() => {
    loop()
    return () => window.cancelAnimationFrame(reqIdRef.current) 
  },[])


  // *** Robot initial joint angles ***
  function piperMr2urdf(udJoints) {
    const j2UrdfZero = 1.46984632679; // Pi/2.0 - 0.10095
    const j3UrdfZero = -2.95319327649; // - (Pi/2 - 0.10095) - Pi/2 + ArcTan[0.25075,0.021984]
    const mr = [...udJoints];
    mr[1] += j2UrdfZero;
    mr[2] += j3UrdfZero;
    return mr;
  }
  const theta_body_initial_map = {
    'jaka_zu_5': [0,110,90,70,-90,90].map(x=>x*Math.PI/180),
    'agilex_piper': piperMr2urdf([0, -15, 82.6, 0, 70, 0].map(x=>x*Math.PI/180)),
  };
  const [theta_body, setThetaBody] = React.useState(()=>{
    return theta_body_initial_map[robot_model] || [0, 0, 0, 0, 0, 0];
  });
  const [theta_tool, setThetaTool] = React.useState(()=>{
    const theta_tool_inital = 0;
    return theta_tool_inital});
  React.useEffect(() => {
    setThetaBody(theta_body_initial_map[robot_model] || [0, 0, 0, 0, 0, 0]);
    setThetaTool(0);
    toolPointMover(null);
    setUpdateRobot(updateRobot+1);
  }, [robot_model]);


  // ****************
  // Worker thread generation
  const workerRef = React.useRef(null);
  const workerLastJoints = React.useRef(null);
  const workerLastStatus = React.useRef(null);
  const workerLastPose = React.useRef(null);
  // const useWorkerRef = React.useRef(true); // Flag to indicate if the worker is ready
  React.useEffect(() => {
    if (workerRef.current === null) {
      console.log("******** Creating new worker ********");
      workerRef.current = new Worker('/worker.js', { type: 'module'});
      console.log("workerRef.current: ", workerRef.current);
      workerRef.current.onmessage = (event) => {
	switch (event.data.type) {
	case 'ready':
	  workerRef.current
	    .postMessage({ type: 'init',
			   filename: robot_model +'/'+'urdf.json', //robot_model
			   linkShapes: robot_model +'/'+'shapes.json'
			 });
	  break;
	case 'generator_ready':
	  workerRef.current
	    .postMessage({ type: 'set_exact_solution',
			   exactSolution: false });
	  workerRef.current
	    .postMessage({ type: 'set_initial_joints',
			   // joints: theta_body});
			   joints: theta_body_initial_map[robot_model]
			 });
	  break;
	case 'joints':
	  if (event.data.joints) {
	    console.debug("Worker joint message:",
			  event.data.joints.map(x => x.toFixed(3)).join(', '));
	    // Always skip to the latest data
	    workerLastJoints.current = event.data.joints;
	  }
	  break;
	case 'status':
	  workerLastStatus.current = event.data;
	  break;
	case 'pose':
	  workerLastPose.current = event.data;
	  break;
	}
      };
    }
    // **** set status text to "dsp_message" ****
    const intervalId = setInterval(() => {
      const controllerMode = controllerModeChange(0); // Get current controller mode
      const messageText = ['MODE: ' + controllerMode];
      switch (controllerMode) {
      case 'Normal':
	messageText
	  .push('status: ' + workerLastStatus.current?.status +
		'  magnification: ' + controllerMagnificationUsed.current.toFixed(2),
		'cond:' + workerLastStatus.current?.condition_number.toFixed(2) +
		'  manip:'  + workerLastStatus.current?.manipulability.toFixed(3) +
		'  k:'  + workerLastStatus.current?.sensitivity_scale.toFixed(3),
		'  limit flags: ' +
		(workerLastStatus.current?.limit_flag || []).join(', '));
	break;
      case 'ToolPoint':
	messageText.push('Tool Point: ' + toolPointMover(0).toArray().
			 map(x => x.toFixed(3)).join(', '));
	break;
      } 
      set_dsp_message(messageText.join('\n'));
      if (workerLastStatus.current?.sensitivity_scale > 0.001) {
	dsp_color.current = 'orange'; // Orange color for singularity warning
      } else if (workerLastStatus.current?.limit_flag.map(x=>x*x).reduce((sum,x)=>sum+x,0) > 0) {
	dsp_color.current = red_color; // Red color for touching the joint limits
      } else {
	dsp_color.current = green_color; // Green color for normal status
      }
    }, 200); // Update every 200ms
    //
    return () => {
      if (workerRef.current) {
	workerRef.current.terminate();
	workerRef.current = null;
      }
      clearInterval(intervalId);
    };
  }, [updateRobot]);

  // ****************
  // Change Robot
  const robotChange = ()=>{
    const get = (robotName)=>{
      let changeIdx = robotNameList.findIndex((e)=>e===robotName) + 1
      if(changeIdx >= robotNameList.length){
        changeIdx = 0
      }
      return robotNameList[changeIdx]
    }
    set_robotName(get)
    set_robot_model(get)
  }

  // *** function that set endLinkPose from worker thread
  const [endLinkPoseUpdater] = React.useState(()=>{
    return ()=>{
      if (workerLastPose.current) {
	const ppw = workerLastPose.current.position;
	const qqw = workerLastPose.current.quaternion;
	if (ppw && qqw) {
	  const ppt = new THREE.Vector3(ppw[0], ppw[1], ppw[2]);
	  const qqt = new THREE.Quaternion(qqw[1], qqw[2], qqw[3], qqw[0]);
	  const poseEE = new THREE.Matrix4();
	  poseEE.compose(ppt, qqt, new THREE.Vector3(1, 1, 1));
	  endLinkPose.current = poseEE;
	}
      }
    };});

  //*** Robot Controller ***/

  const [slowRewindMode, setSlowRewindMode] = React.useState(null);

  const controllerMagnification = React.useRef(1.0);
  const controllerMagnificationPrev = React.useRef(controllerMagnification.current);
  const controllerMagnificationUsed = React.useRef(controllerMagnification.current);
  // *** a function that runs when the controller pose changes
  React.useEffect(() => {
    // VR input period
    if (endLinkPoseStart.current !== null &&
	baseLinkPoseInv.current !== null &&
	rendered && vrModeRef.current && trigger_on ) {
      // base_B^{-1}: start^-1: controllerStartInv.current
      // base_E: goal: controllerCurrentWorld
      // base_S: begin: endLinkPoseStart.current
      // base_S': 原点はB, 向きはS
      // base_G: end: to be calculated
      const controllerCurrentWorld = three2worldMat.clone().multiply(controller_object);
      const controllerDiff = controllerStartInv.current.clone().multiply(controllerCurrentWorld);
      const controllerTend = controllerStartInv.current.clone().multiply(endLinkPoseStart.current);
      controllerTend.extractRotation(controllerTend);
      const endTcontroller = controllerTend.clone().transpose();
      //
      // reduce controller movement by 0.25 -- 1.00
      const magnification = controllerMagnificationUsed.current;
      const posDiff = new THREE.Vector3();
      const quatDiff = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      controllerDiff.decompose(posDiff, quatDiff, scale);
      const quaterPosDiff = posDiff.clone().multiplyScalar(magnification);
      // console.debug('quaterPosDiff: ' + quaterPosDiff.x.toFixed(3)
      // 		  + ', ' + quaterPosDiff.y.toFixed(3)
      // 		  + ', ' + quaterPosDiff.z.toFixed(3));
      const quaterQuatDiff = quatDiff.clone(); // .multiplyScalar(0.25);
      quaterQuatDiff.x *= magnification;
      quaterQuatDiff.y *= magnification;
      quaterQuatDiff.z *= magnification;
      const wAbs = Math.sqrt(1.0 - (quaterQuatDiff.x**2
				    + quaterQuatDiff.y**2
				    + quaterQuatDiff.z**2));
      quaterQuatDiff.w = quaterQuatDiff.w >= 0 ? wAbs : -wAbs;
      const scale1 = new THREE.Vector3(1, 1, 1);
      const matrixDiff = new THREE.Matrix4();
      matrixDiff.compose(quaterPosDiff, quaterQuatDiff, scale1);
      //
      //
      const newEndLinkPose = endLinkPoseStart.current.clone()
	    .multiply(endTcontroller).multiply(matrixDiff)
	    .multiply(controllerTend);
      console.debug("matrixDiff: ", matrixDiff.elements[12].toFixed(3),
      		    matrixDiff.elements[13].toFixed(3),
      		    matrixDiff.elements[14].toFixed(3));
      console.debug("newEndLinkPose: ", newEndLinkPose.elements[12].toFixed(3),
      		    newEndLinkPose.elements[13].toFixed(3),
      		    newEndLinkPose.elements[14].toFixed(3));
      // **** send to worker thread ****
      workerRef.current.postMessage({ type: 'destination',
				      endLinkPose: newEndLinkPose.elements });
      // KinematicsControl(newEndLinkPose);
      // if (workerLastJoints.current) {
      // 	setThetaBody(workerLastJoints.current);
      // }
    }
    // ** update the controller and end link pose at the trigger_on change
    console.debug("controllerUpdate: ", controllerUpdate);
    let updateStartPose = false;
    if (baseLinkPoseInv.current !== null) {
      if (!trigger_on) {
	// When the trigger off, 
	//  rewind mode is done if slowRewindMode is true. 
	workerRef.current.postMessage({ type: 'slow_rewind',
					slowRewind: slowRewindMode });
	updateStartPose = true;
	controllerMagnificationUsed.current = controllerMagnification.current;
      }
      if (updateStartPose || endLinkPoseStart.current === null){
	// do update start pose of end link
	console.log("update start pose of end link");
	if (workerLastPose.current) {
          endLinkPoseStart.current = endLinkPose.current.clone();
          // endLinkPoseStart.current = three2worldMat.clone()
	  //   .multiply(endLinkPose.current);
          console.debug("endLinkPoseStart: ",
			endLinkPoseStart.current.elements[12].toFixed(3),
			endLinkPoseStart.current.elements[13].toFixed(3),
			endLinkPoseStart.current.elements[14].toFixed(3));
	}
      }
      if (updateStartPose || controllerStartInv.current === null) {
	// do update start pose of controller
        controllerStartInv.current = three2worldMat.clone()
	  .multiply(controller_object).invert();
        console.debug("controllerStartInv: ",
		      controllerStartInv.current.elements[12].toFixed(3),
		      controllerStartInv.current.elements[13].toFixed(3),
		      controllerStartInv.current.elements[14].toFixed(3));
      }
    }
    controllerMagnificationPrev.current = controllerMagnification.current;
  }, [...controller_object.elements,
      controllerUpdate, rendered, trigger_on, slowRewindMode  
     ]);

  // Gripper Control 
  function clampTool(value) {
    return Math.max(toolLimit.min, Math.min(toolLimit.max, value));
  }
  React.useEffect(() => {
    let intervalId = null;
    if (grip_on && button_a_on) {
      intervalId = setInterval(() => {
        setThetaTool(prev => clampTool(prev + 0.5));
      }, 16.5); 
    }
    else if (grip_on && button_b_on) {
      intervalId = setInterval(() => {
        setThetaTool(prev => clampTool(prev - 0.5));
      }, 16.5); 
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [ button_a_on, button_b_on, grip_on]);

  // webController Inputs
  const controllerProps = React.useMemo(() => ({
    robotName, robotNameList, set_robotName,
    toolName, toolNameList, set_toolName,
    c_pos_x,set_c_pos_x,c_pos_y,set_c_pos_y,c_pos_z,set_c_pos_z,
    c_deg_x,set_c_deg_x,c_deg_y,set_c_deg_y,c_deg_z,set_c_deg_z,
    vr_mode:vrModeRef.current,
    selectedMode, setSelectedMode,
    theta_body, setThetaBody,
    theta_tool, setThetaTool,
    // pose_ee, setPoseEE,
    // onTargetChange: KinamaticsControl,
    // onTargetChange: DynamicsControl
  }), [
    robotName, robotNameList, set_robotName,
    toolName, toolNameList, set_toolName,
    c_pos_x,set_c_pos_x,c_pos_y,set_c_pos_y,c_pos_z,set_c_pos_z,
    c_deg_x,set_c_deg_x,c_deg_y,set_c_deg_y,c_deg_z,set_c_deg_z,
    vrModeRef.current,
    selectedMode, setSelectedMode,
    theta_body, setThetaBody,
    theta_tool, setThetaTool,
    // pose_ee, setPoseEE,
    // KinamaticsControl,
    // DynamicsControl
  ]);

  // VRController Inputs (Aframe Components)
  React.useEffect(() => {
    registerAframeComponents({
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
      // Euler_order,
      props,
      onXRFrameMQTT,
      workerLastJoints,
      setThetaBody,
      endLinkPose,
      endLinkPoseUpdater,
      baseLinkPoseInv,
      controllerMagnification,
      controllerStartInv,
      setSlowRewindMode,
      controllerModeChange,
      toolPointMover,
      controllerUpdater
    });
    // set rendered state after a short delay to ensure the scene is ready
    // setTimeout(() => set_rendered(true), 16.5);
    set_rendered(true);
  }, []);

  /* 
  * MQTT 
  */
  const thetaBodyMQTT = React.useRef(theta_body);
  React.useEffect(() => {
    thetaBodyMQTT.current = theta_body;
  }, [theta_body]);

  const thetaToolMQTT = React.useRef(theta_tool);
  React.useEffect(() => {
    thetaToolMQTT.current = theta_tool;
  }, [theta_tool]);

  React.useEffect(() => {
    window.requestAnimationFrame(onAnimationMQTT);
  }, []);
  
  // web MQTT
  const onAnimationMQTT = (time) =>{
    const robot_state_json = JSON.stringify({
      time: time,
      joints: thetaBodyMQTT.current,
      // grip: gripRef.current      
    });
    publishMQTT(MQTT_ROBOT_STATE_TOPIC + robotIDRef.current , robot_state_json); 
    // console.log("onAnimationMQTT published:", robot_state_json);
    window.requestAnimationFrame(onAnimationMQTT); 
  }

  // VR MQTT
  const receiveStateRef = React.useRef(true); // VR MQTT switch
  const onXRFrameMQTT = (time, frame) => {
    if (vrModeRef.current){
      frame.session.requestAnimationFrame(onXRFrameMQTT);
      setNow(performance.now()); 
    }
    if ((mqttclient != null) && receiveStateRef.current) {
      const ctl_json = JSON.stringify({
        time: time,
        joints: thetaBodyMQTT.current,
        tool: thetaToolMQTT.current
      });
      publishMQTT(MQTT_CTRL_TOPIC + robotIDRef.current, ctl_json);
    }
  }
  const requestRobot = (mqclient) => {
    const requestInfo = {
      devId: idtopic,
      type: codeType,
    }
    publishMQTT(MQTT_REQUEST_TOPIC, JSON.stringify(requestInfo));
  }

  useMqtt({
    props,
    requestRobot,
    thetaBodyMQTT: setThetaBody,
    thetaToolMQTT: setThetaTool,
    robotIDRef,
    MQTT_DEVICE_TOPIC, 
    MQTT_CTRL_TOPIC, 
    MQTT_ROBOT_STATE_TOPIC,
  });

  // Robot State Update Props
  const robotProps = React.useMemo(() => ({
    updateRobot, robotNameList, robotName, theta_body, theta_tool
  }), [updateRobot, robotNameList, robotName, theta_body, theta_tool]);
  
  // Robot Secene Render
  return (
    <RobotScene
      robot_model={robot_model}
      rendered={rendered}
      robotProps={robotProps}
      controllerProps={controllerProps}
      dsp_message={dsp_message}
      dsp_color={dsp_color.current}
      c_pos_x={c_pos_x}
      c_pos_y={c_pos_y}
      c_pos_z={c_pos_z}
      c_deg_x={c_deg_x}
      c_deg_y={c_deg_y}
      c_deg_z={c_deg_z}
      viewer={props.viewer}
      monitor={props.monitor}
      // position_ee={pose_ee_Three.position}
      // euler_ee={pose_ee_Three.euler}
      // vr_controller_pos={vr_controller_pos}
      // vr_controller_euler={vr_controller_euler}
    />
  );
}
