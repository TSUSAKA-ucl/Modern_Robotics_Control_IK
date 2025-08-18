import React from 'react';
import Assets from './Assets';
import { Select_Robot } from './Model';
import Controller from './webcontroller.js';

const Line = (props) => {
  const { pos1={x:0,y:0,z:0}, pos2={x:0,y:0,z:0}, color="magenta", opa=1, visible=false, ...otherprops } = props;

  const line_para = `start: ${pos1.x} ${pos1.y} ${pos1.z}; end: ${pos2.x} ${pos2.y} ${pos2.z}; color: ${color}; opacity: ${opa};`

  return <a-entity
      {...otherprops}
      line={line_para}
      position={`0 0 0`}
      visible={`${visible}`}
    ></a-entity>
}

export default function RobotScene(props) {
  const {
    robot_model, rendered, robotProps, controllerProps,
    theta_tool,
    dsp_message, dsp_color,
    c_pos_x, c_pos_y, c_pos_z, c_deg_x, c_deg_y, c_deg_z, 
  } = props;

  const rad2deg = rad => rad * 180 / Math.PI;

  if (!rendered) {
    return (
      <a-scene xr-mode-ui="XRMode: ar">
        <Assets robot_model={robot_model} viewer={props.viewer}/>
      </a-scene>
    );
    }

  // definition of the end link axes marker
  const axis_length = 0.210;
  const cyl_length = (axis_length/2).toString();
  const cyl_hight = (axis_length).toString();
  const cyl_radius = '0.0035';
  const origin_marker_radius = '0.012';
  const origin_marker_size = `${origin_marker_radius} ${origin_marker_radius} ${origin_marker_radius}`;
  const origin_marker_color = 'blue';
  const end_link = (
    <a-entity end-link position={`0 0 0`} rotation={`0 0 0`}>
      <a-sphere 
	scale={origin_marker_size}
	color={origin_marker_color}
	visible={true}>
      </a-sphere>
      <a-cylinder position={`${cyl_length} 0 0`} rotation={`0 0 -90`}
        	  height={cyl_hight} radius={cyl_radius} color="red" />
      <a-cylinder position={`0 ${cyl_length} 0`} rotation={`0 0 0`}
		  height={cyl_hight} radius={cyl_radius} material='color: #00ff00' />
      <a-cylinder position={`0 0 ${cyl_length}`} rotation={`90 0 0`}
        	  height={cyl_hight} radius={cyl_radius} color="blue" />
    </a-entity>
  );
  // definition of the end link axes marker
  const con_axis_length = 0.100;
  const con_length = (con_axis_length/2).toString();
  const con_hight = (con_axis_length).toString();
  const con_radius = '0.0035';
  const controller_axes = (
    <a-entity axes1 position={'0 1 0'} >
      <a-sphere
        scale="0.012 0.012 0.012"
        color="white"
        visible={true}>
      </a-sphere>
      <a-cylinder position={`${con_length} 0 0`} rotation={`0 0 -90`}
        	  height={con_hight} radius={con_radius} color="red" />
      <a-cylinder position={`0 ${con_length} 0`} rotation={`0 0 0`}
		  height={con_hight} radius={con_radius} material='color: #00ff00' />
      <a-cylinder position={`0 0 ${con_length}`} rotation={`90 0 0`}
        	  height={con_hight} radius={con_radius} color="blue" />
    </a-entity>
  );
  // console.log("dsp_message: ", dsp_message);
  return (
    <>
      <a-scene scene xr-mode-ui="XRMode: ar">
        {/* VR Controller */}
        <a-entity oculus-touch-controls="hand: right" vr-controller-right visible={true}></a-entity>

        <Assets robot_model={robot_model} viewer={props.viewer} monitor={props.monitor}/>

        {/* Robot */}
        <Select_Robot {...robotProps}/>
        {/* Light */}
        <a-entity light="type: directional; color: #FFF; intensity: 0.25" position="1 1 1"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.25" position="-1 1 1"></a-entity>
        <a-entity light="type: directional; color: #EEE; intensity: 0.25" position="-1 1 -1"></a-entity>
        <a-entity light="type: directional; color: #FFF; intensity: 0.25" position="1 1 -1"></a-entity>
        <a-entity light="type: directional; color: #EFE; intensity: 0.1" position="0 -1 0"></a-entity>
        <a-entity id="rig" position={`${c_pos_x} ${c_pos_y} ${c_pos_z}`} rotation={`${c_deg_x} ${c_deg_y} ${c_deg_z}`}>

          {/* Camera */}
          <a-camera id="camera" cursor="rayOrigin: mouse;" position="0 0 0">
            <a-entity
              text={`value: ${dsp_message}; color: ${dsp_color}; backgroundColor: rgb(31, 219, 131); border: #000000; whiteSpace: pre`}
              position="0 0.35 -1.4"
            />
          </a-camera>
        </a-entity>
         
        {/* End Link */}
        {end_link}
	{/* End Link Axes */}
        {controller_axes}
      </a-scene>
      <Controller {...controllerProps}/>
      <div className="footer">
        <div>{`add information here`}</div>
      </div>
    </>
  );
}
