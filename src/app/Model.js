import React from 'react';

const deg90 = Math.PI / 2.0;
const deg180 = Math.PI;
const rad2deg = rad => rad * 180 / Math.PI;

// Agilex Piper Model
const agilex_piper_Model = (props) => {
  const j2UrdfZero = 1.46984632679; // Pi/2.0 - 0.10095
  const j3UrdfZero = -2.95319327649; // - (Pi/2 - 0.10095) - Pi/2 + ArcTan[0.25075,0.021984]
  function urdf2mrJoints(udJoints) {
    const mr = [...udJoints];
    mr[1] -= j2UrdfZero;
    mr[2] -= j3UrdfZero;
    return mr;
  }
  const { theta_body = [0,0,0,0,0,0], theta_tool = 24 } = props;
  const [theta1, theta2, theta3, theta4, theta5, theta6] =
        urdf2mrJoints(theta_body).map(rad2deg);

  // Robot Params
  const L_01 = 0.123, L_23 = 0.28503, L_34 = 0.25075, L_56 = 0.091, L_ee = 0.1358;
  const W_34 = 0.0219;

  const finger_pos = (((theta_tool)*0.4) / 1000)+0.0004;

  return (
    <>
      {/* Plane */}
      <a-plane
        position="0 0 0"
        rotation="-90 0 0"
        width="1.2"
        height="1.2"
        color="#e0e0e0"
        opacity="0.5"
      ></a-plane>

      {/* Robot Base */}
      <a-entity robot-click="" gltf-model="#base" position={'0 0 0'} visible="true">
        {/* J1 */}
        <a-entity j_id="1" gltf-model="#j1" position={'0 0 0'} rotation={`0 ${theta1-180} 0`}>
          {/* J2 */}
          <a-entity j_id="2" gltf-model="#j2" position={`0 ${L_01} 0`} rotation={`${theta2} 0 0`}>
            {/* J3 */}
            <a-entity j_id="3" gltf-model="#j3" position={`0 ${L_23} 0`} rotation={`${theta3} 0 0`}>
              {/* J4 */}
              <a-entity j_id="4" gltf-model="#j4" position={`0 ${L_34} -${W_34}`} rotation={`0 ${theta4} 0`}>
                {/* J5 */}
                <a-entity j_id="5" gltf-model="#j5" position={`0 0 0`} rotation={`${theta5-90} 0 0`}>
                  {/* J6 */}
                  <a-entity j_id="6" gltf-model="#j6" position={`0 0 0`} rotation={`0 0 ${theta6}`}>
                    {/* Tool */}
                    <a-entity gltf-model="#j6_1" position={`${finger_pos} 0 ${L_56+L_ee}`}></a-entity>
                    <a-entity gltf-model="#j6_2" position={`${-finger_pos} 0 ${L_56+L_ee}`}></a-entity>
                    <a-entity end-link position={`0 0 ${L_56+L_ee}`} rotation={`0 0 -90`}>
                      <a-sphere 
                        scale="0.012 0.012 0.012" 
                        color="yellow"
                        visible={true}>
                      </a-sphere>
                      <a-cylinder position="0      0 -0.015" rotation="90 0  0 "
                                  height="0.0250" radius="0.0015" color="red" /> 
                      <a-cylinder position="-0.015 0      0" rotation="0  0 90"
                                  height="0.0250" radius="0.0015" material="color: #00ff00" />
                      <a-cylinder position="0      0.025  0" rotation="0  90 0 "
                                  height="0.0550" radius="0.0015" color="blue" />
                    </a-entity>
                  </a-entity>
                </a-entity>
              </a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      </a-entity>
    </>
  );
}

// Jaka_ZU_5 Robot Params
const jaka_zu_5_Model = (props) => {
  function urdf2mrJoints(udJoints) {
    const mr = [
      udJoints[0],
      udJoints[1] - deg90,
      udJoints[2],
      udJoints[3] - deg90,
      udJoints[4],
      udJoints[5] - deg90
    ];
    return mr;
  }
  const { theta_body = [0,0,0,0,0,0], theta_tool = 24 ,controllerQuat} = props;
  const [theta1, theta2, theta3, theta4, theta5, theta6] =
        urdf2mrJoints(theta_body).map(rad2deg);
  const L_01 = 0.12015, L_23 = 0.43, L_34 = 0.3685, W_45 = 0.114, L_56 = 0.1135, L_ee = -0.0065
  const thetaF=-20 + theta_tool;
  const thetaF2a=thetaF+180;
  const thetaF2b=-thetaF-180;
  const thetaF3a=-thetaF-0;
  const thetaF3b=thetaF+180;

  return (
    <React.Fragment>
      {/* Plane */}
      <a-plane
        position="0 0 0"
        rotation="-90 0 0"
        width="1.2"
        height="1.2"
        color="#e0e0e0"
        opacity="0.0"
        visible="False"
      ></a-plane>

      <a-entity axes1 position={'0 1 0'} >
        <a-sphere
          scale="0.012 0.012 0.012"
          color="white"
          visible={true}>
        </a-sphere>
        <a-cylinder position="0.05      0  0" rotation="0 0  -90 "
                    height="0.10" radius="0.0035" color="red" />
        <a-cylinder position="0 0.05      0" rotation="0  0 0"
                    height="0.10" radius="0.0035" material="color: #00ff00" />
        <a-cylinder position="0      0.0  0.05" rotation="90  0 0 "
                    height="0.10" radius="0.0035" color="blue" />
      </a-entity>

      {/* Robot Base */}
      <a-entity robot-click="" gltf-model="#base" position={'0 0 0'} rotation={`0 -180 0`} visible="true">
        {/* J1 */}
        <a-entity j_id="1" gltf-model="#j1" position={'0 0 0'} rotation={`0 ${theta1-180} 0`}>
          {/* J2 */}
          <a-entity j_id="2" gltf-model="#j2" position={`0 ${L_01} 0`} rotation={`${-theta2} 0 0`}>
            {/* J3 */}
            <a-entity j_id="3" gltf-model="#j3" position={`0 ${L_23} 0`} rotation={`${-theta3} 0 0`}>
              {/* J4 */}
              <a-entity j_id="4" gltf-model="#j4" position={`0 ${L_34} 0`} rotation={`${-theta4} 0 0`}>
                {/* J5 */}
                <a-entity j_id="5" gltf-model="#j5" position={`${W_45} ${L_56} 0.0`} rotation={`0 ${theta5-90} 0 `}>
                  {/* J6 */}
                  <a-entity j_id="6" gltf-model="#j6" position={`0 0 0`} rotation={`0 0 ${theta6}`}>
                    <a-entity end-link position={`0 0 ${L_56+L_ee}`} rotation={`0 0 -90`}>
                      <a-sphere 
                        scale="0.012 0.012 0.012" 
                        color="yellow"
                        visible={true}>
                      </a-sphere>
                      <a-cylinder position="0.035      0  0" rotation="0 0  -90 "
                                  height="0.070" radius="0.0035" color="red" /> 
                      <a-cylinder position="0 0.035      0" rotation="0  0 0"
                                  height="0.0700" radius="0.0035" material="color: #00ff00" />
                      <a-cylinder position="0      0.0  0.035" rotation="90  0 0 "
                                  height="0.070" radius="0.0035" color="blue" />
                    </a-entity>
                    {/* Tool */}
                    <a-entity gltf-model="#j6_1" position='0.01 0 0.15' rotation='0 180 0'> 
                      {/* <a-entity position={`0 0 0`} rotation={`0 0 0`}> */}
                      {/*   <a-cylinder position="0.035      0  0" rotation="0 0  -90 " */}
                      {/*               height="0.070" radius="0.0035" color="red" />  */}
                      {/*   <a-cylinder position="0 0.035      0" rotation="0  0 0" */}
                      {/*               height="0.0700" radius="0.0035" material="color: #00ff00" /> */}
                      {/*   <a-cylinder position="0      0.0  0.035" rotation="90  0 0 " */}
                      {/*               height="0.070" radius="0.0035" color="blue" /> */}
                      {/* </a-entity> */}
                      <a-entity gltf-model='#j6_2a' position='-0.02 0 -0.06' rotation={`0 ${thetaF2a}  0` }>
                        <a-entity gltf-model='#j6_4a' position='0.0 0 0.055' rotation={`180 ${thetaF3a}  0` }>
                          <a-entity gltf-model='#j6_3b' position='-0.0 0 -0.02' rotation={`0 180 -90` }>
                        </a-entity>
                        </a-entity>
                      </a-entity>
                      <a-entity gltf-model='#j6_2b' position='0.04 0 -0.06' rotation={`0 ${thetaF2b} 0` }>
                        <a-entity gltf-model='#j6_4b' position='-0.0 0 0.055' rotation={`0 ${thetaF3b} 0` }>
                          <a-entity gltf-model='#j6_3b' position='-0.0 0 -0.02' rotation={`0 180 -90` }>
                          </a-entity>
                        </a-entity>
                      </a-entity>
                    </a-entity>
                    {/* end of  Tool */}
                  </a-entity>
                </a-entity>
              </a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      </a-entity>
    </React.Fragment>
  );
}

const robotModelMap = {'jaka_zu_5': jaka_zu_5_Model,
                       'agilex_piper': agilex_piper_Model};

const Select_Robot = (props)=>{
  const {updateRobot, robotNameList, robotName, ...rotateProps} = props;
  const visibletable = robotNameList.map(()=>false);
  const findindex = robotNameList.findIndex((e)=>e===robotName);
  if(findindex >= 0){
    visibletable[findindex] = true;
  }
  const Model = React.useRef(robotModelMap[robotName]);
  React.useEffect(() => {
    Model.current = robotModelMap[robotName];
  }, [updateRobot]);
  return (<>
    <Model.current visible={visibletable[0]} {...rotateProps}/>
  </>);
}

export { Select_Robot };
