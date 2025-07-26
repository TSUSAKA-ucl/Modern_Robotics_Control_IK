### ロボットの切り替えについて

1. クリックするとロボット名(state変数)が切り替わる (以前から実装済)
2. ロボット名が切り替わったeffectで、thetaBody(関節角(劉))が初期化される
   thetaTool
   endLinkPoseStart(3変数)もnullに変更
   updateWorker(state変数)変化させる
3. updateWorker変化のeffectで、workerが作り変えられる
4. updateWorker変化のeffectで、その時のrobotName(またはrobot_model)に従いModel関数が入れ替えられる
5. (本当は)worker作り替えとModel入れ替えが完了したら、次のクリック(ロボット変更)を受け付ける




* home.js:  
  ```
  theta_body(useState)
  theta_body => robotProps(useMemo)
  ```
  `setThetaBody`は、`function KinamaticsControlAux(T_sd)`内で呼ばれる
  また`ontrollerProps(useMemo)`に入れられる
  
* RobotScene.js:  
  robotPropsは、RobotSceneに渡される。そこから`Select_Robot`(Model.js)に渡される。
  `Select_Robot`では、robotNameListとrobotNameが取り除かれ、`Model`に渡される
  Modelで引数オブジェから`theta_body`が取り出される
  その値を使って、AFrameのa-entity内部で使われるtheta1, theta2などに分解される
  
* `KinamaticsControl`関数  
  内部でuseStateの、`setThetaBody`, `setThetaBodyGuess`, `set_target_error`を呼んでいる。
  `setThetaBodyGuess`は、home.jsでしか使用していない(UI描画に関係ない)ため無視する。
  `set_target_error`は、多分色を変えているだけなので、これも無視する
  
