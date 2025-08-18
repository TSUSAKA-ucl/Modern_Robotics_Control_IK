import { three2worldMatGen, world2threeMatGen } from './constTransformGen';

let registered = false;
let lastUpdate = 0;

let controllerCoord = new THREE.Object3D();
let controllerPosition = new THREE.Vector3();
let endLinkPosition = new THREE.Vector3();
let endLinkOrientation = new THREE.Quaternion();
let baseLinkPose = null;

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
    controllerUpdater,
  } = options;
  
  AFRAME.registerComponent('robot-click', {
    init: function () {
      if (this.el.object3D?.matrixWorld) {
	baseLinkPose = this.el.object3D.matrixWorld.clone();
	baseLinkPoseInv.current = this.el.object3D.matrixWorld.clone().invert();
	console.log('00 baseLinkPose diagonal: ',
		    baseLinkPose.elements[0].toFixed(3), ', ',
		    baseLinkPose.elements[5].toFixed(3), ', ',
		    baseLinkPose.elements[10].toFixed(3));
	console.log('00 baseLinkPoseInv: ', baseLinkPoseInv.current.elements[0].toFixed(3), ', ',
		    baseLinkPoseInv.current.elements[5].toFixed(3), ', ',
		    baseLinkPoseInv.current.elements[10].toFixed(3));
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
	    baseLinkPoseInv.current = this.el.object3D.matrixWorld.clone().invert();
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
      this.lastPose = new THREE.Matrix4();
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
      controllerCoord = obj;
      obj.getWorldPosition(controllerPosition);
      const pose = obj.matrixWorld;
      if (this._my_init_flag) {
	if (!pose.equals(this.lastPose)) {
	  const controllerBase = baseLinkPoseInv.current.clone().multiply(pose);
          set_controller_object(controllerBase);
	  //
	  // // **** debugging output ****
	  // const position = new THREE.Vector3();
	  // position.setFromMatrixPosition(this.el.object3D.matrixWorld);
	  // position.applyMatrix4(three2worldMat); // convert to world coord.
	  // console.debug("controller position: " + position.x.toFixed(3)
	  // 	      + ", " + position.y.toFixed(3)
	  // 	      + ", " + position.z.toFixed(3));
	  // controllerUpdater();
	}
      } else {
	const controllerBase = baseLinkPoseInv.current.clone().multiply(pose);
	set_controller_object(controllerBase);
	this._my_init_flag = true;
      }
      ++this.count;
      this.lastPose.copy(pose);
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
      if (workerLastJoints.current) {
	if (time - lastUpdate > 16) {
	  lastUpdate = time;
	  setThetaBody(workerLastJoints.current);
	}
	console.debug('workerLastJoints: '
		      + workerLastJoints.current[0].toFixed(3) + ', '
		      + workerLastJoints.current[1].toFixed(3) + ', '
		      + workerLastJoints.current[2].toFixed(3));
      }
    }
  });

  AFRAME.registerComponent('axes1', {
    init() {
    },
    tick() {
      this.el.object3D.position.copy(controllerPosition);
      this.el.object3D.quaternion.copy(endLinkOrientation);
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
