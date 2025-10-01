## 💡 Tips for PiPER Robot Control

- **Real robots behave differently from VR**  
  In VR, the controller moves instantly. But in reality, the robot has mass and inertia, so it needs time and smooth acceleration to reach the target. Sudden changes can cause unstable motion.

- **PD control is used to limit acceleration**  
  Since the PiPER robot does not include a low-level controller internally, directly commanding target poses should be avoided.  
  Adding impedance control (PD control) helps suppress vibrations caused by aggressive or abrupt movements.

- **Joint trajectory planning ensures smooth motion**  
  **5th-order polynomial (quintic) interpolation** is applied for joint trajectory planning.  
  This guarantees that **position, velocity, and acceleration are all continuous and differentiable**, which reduces jerk and improves motion smoothness.  
  Furthermore, the joint trajectory is discretized into **2 ms steps** to match PiPER’s control cycle, minimizing mismatch with VR controller input rates (15–20 ms).

- **A small amount of feedback error is acceptable**  
  Although the desired joint accuracy is around `1e-3` radians per axis and the MSE target is set below `1e-6`, the PiPER robot cannot consistently achieve this precision at certain poses due to mechanical limitations.  
  As a result, even when the robot reaches the target, slight vibrations or jitters may still occur.  
  To balance control accuracy and inherent hardware imperfections, the acceptable MSE threshold has been relaxed to `5e-6`.

