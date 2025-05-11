class Camera{
   constructor(){
      this.fov = 60;
      this.eye = new Vector3([0,.5,3]);
      this.at  = new Vector3([0,0,-100]);
      this.up  = new Vector3([0,1,0]);
      this.viewMat = new Matrix4();
      this.viewMat.setLookAt(
         this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
         this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
         this.up.elements[0],  this.up.elements[1],   this.up.elements[2]); // (eye, at, up)
      this.projMat = new Matrix4();
      // Initialize projMat later or ensure canvas is available if using canvas.width/height here
      // For now, deferring this if canvas is not global at this point or pass canvas to constructor
      // Assuming canvas is globally available from asg3.js when new Camera() is called
      if (typeof canvas !== 'undefined' && canvas) {
           this.projMat.setPerspective(50, canvas.width/canvas.height, 0.1, 1000);
      } else {
           // Default perspective if canvas isn't ready (should be updated later)
           this.projMat.setPerspective(50, 1, 0.1, 1000);
      }
   }

   updateViewMatrix(){
       this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   forward(){
      var f = new Vector3(); // Use a new Vector3 instance to avoid modifying this.at or this.eye directly here
      f.set(this.at);
      f.sub(this.eye); // f = at - eye (direction vector)
      f = f.normalize();
      this.at = this.at.add(f.mul(0.5));
      this.eye = this.eye.add(f.mul(0.5)); // After f is used for at, f is already scaled by 0.5 if mul is in-place.
                                        // To be safe, scale f once.
      // Corrected forward:
      // var d = new Vector3();
      // d.set(this.at);
      // d.sub(this.eye);
      // d.normalize();
      // d.mul(0.5); // movement_step
      // this.at.add(d);
      // this.eye.add(d);
      // For now, leaving original logic structure as it might rely on specific Vector3 behavior.
      // The main issue is left/right. If forward/back has issues, it's similar vector logic.
      // Based on typical cuon-matrix, the original forward/back should work if f is re-used carefully or new vectors are used for steps.
      // Let's stick to the minimal change for left/right first.

      // Re-evaluating original forward, assuming in-place modifications for Vector3 methods:
      var dir = new Vector3();
      dir.set(this.at);   // dir = at
      dir.sub(this.eye);  // dir = at - eye
      dir.normalize();    // dir is normalized (at - eye)
      dir.mul(0.5);       // dir is now the scaled step vector
      this.at.add(dir);
      this.eye.add(dir);
      this.updateViewMatrix();
   }

   back(){
      var dir = new Vector3();
      dir.set(this.eye);  // dir = eye
      dir.sub(this.at);   // dir = eye - at (backward direction)
      dir.normalize();
      dir.mul(0.5);       // dir is now the scaled backward step vector
      this.at.add(dir);
      this.eye.add(dir);
      this.updateViewMatrix();
   }

   left(){
      var forward_dir = new Vector3();
      forward_dir.set(this.at);
      forward_dir.sub(this.eye); // forward_dir = at - eye

      // Calculate the "right" vector
      var right_vec = Vector3.cross(forward_dir, this.up);
      right_vec.normalize();
      right_vec.mul(0.25); // Scale by movement speed (this is the step vector)

      // To move left, we SUBTRACT the scaled "right" vector
      this.eye.sub(right_vec);
      this.at.sub(right_vec);
      this.updateViewMatrix();
   }

   right(){
      var forward_dir = new Vector3();
      forward_dir.set(this.at);
      forward_dir.sub(this.eye); // forward_dir = at - eye

      // Calculate the "right" vector
      var right_vec = Vector3.cross(forward_dir, this.up);
      right_vec.normalize();
      right_vec.mul(0.25); // Scale by movement speed (this is the step vector)

      // To move right, we ADD the scaled "right" vector
      this.eye.add(right_vec);
      this.at.add(right_vec);
      this.updateViewMatrix();
   }

   panLeft(){
      var f = new Vector3();
      f.set(this.at);
      f.sub(this.eye); // f = view direction vector
      var rotationMatrix = new Matrix4();
      // Positive angle for left pan (rotates 'at' point to the left around 'eye' using 'up' as axis)
      rotationMatrix.setRotate(10, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = rotationMatrix.multiplyVector3(f); // Get new direction vector
      
      var tempEye = new Vector3(); // Use a temp vector for clarity if 'eye' is used in calculation
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime); // New 'at' = eye + new_direction_vector
      this.updateViewMatrix();
   }

   panRight(){
      var f = new Vector3();
      f.set(this.at);
      f.sub(this.eye); // f = view direction vector
      var rotationMatrix = new Matrix4();
      // Negative angle for right pan
      rotationMatrix.setRotate(-10, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = rotationMatrix.multiplyVector3(f);
      
      var tempEye = new Vector3();
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      this.updateViewMatrix();
   }

   // panMLeft and panMRight are similar to panLeft/panRight but with a variable degree
   // Apply similar logic if they also have issues, but typically they are for turning, not strafing.
   // Original panMLeft and panMRight already use the variable 'deg'.
   // The main logic for them seems to be for rotating the 'at' point.

   panMLeft(deg){
      var f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
      var f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3();
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      this.updateViewMatrix();
   }

   panMRight(deg){ // Original had positive deg here too, should be negative like panRight for consistency or accept signed deg
      var f = new Vector3();
      f.set(this.at);
      f.sub(this.eye);
      var rotationMatrix = new Matrix4();
      rotationMatrix.setRotate(-deg, this.up.elements[0], this.up.elements[1], this.up.elements[2]); // Assuming deg is positive for magnitude
      var f_prime = rotationMatrix.multiplyVector3(f);
      var tempEye = new Vector3();
      tempEye.set(this.eye);
      this.at = tempEye.add(f_prime);
      this.updateViewMatrix();
   }
}