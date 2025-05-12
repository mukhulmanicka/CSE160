class Camera {
   constructor(){
      this.fov = 60;
      this.eye = new Vector3([0, 0.5, 3]); // Adjusted initial eye height slightly for better view
      this.at  = new Vector3([0, 0, -100]);
      this.up  = new Vector3([0, 1, 0]);
      this.viewMat = new Matrix4();
      this.projMat = new Matrix4();

      this.pitch = 0; // Current vertical angle in degrees (0 = looking straight forward)
      this.maxPitch = 85.0; // Max degrees to look up
      this.minPitch = -85.0; // Max degrees to look down

      // Initialize matrices (projMat might need canvas dimensions later)
      this.updateViewMatrix();
      if (typeof canvas !== 'undefined' && canvas) { // Check if canvas is available
           this.projMat.setPerspective(50, canvas.width/canvas.height, 0.1, 1000);
      } else {
           this.projMat.setPerspective(50, 1, 0.1, 1000); // Default if canvas not ready
      }
   }

   updateViewMatrix(){
       this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   forward(){
      var dir = new Vector3();
      dir.set(this.at);
      dir.sub(this.eye);
      dir.normalize();
      dir.mul(0.5);
      this.at.add(dir);
      this.eye.add(dir);
      this.updateViewMatrix();
   }

   back(){
      var dir = new Vector3();
      dir.set(this.eye);
      dir.sub(this.at);
      dir.normalize();
      dir.mul(0.5);
      this.at.add(dir);
      this.eye.add(dir);
      this.updateViewMatrix();
   }

   left(){
      var forward_dir = new Vector3();
      forward_dir.set(this.at);
      forward_dir.sub(this.eye);
      var right_vec = Vector3.cross(forward_dir, this.up);
      right_vec.normalize();
      right_vec.mul(0.25);
      this.eye.sub(right_vec);
      this.at.sub(right_vec);
      this.updateViewMatrix();
   }

   right(){
      var forward_dir = new Vector3();
      forward_dir.set(this.at);
      forward_dir.sub(this.eye);
      var right_vec = Vector3.cross(forward_dir, this.up);
      right_vec.normalize();
      right_vec.mul(0.25);
      this.eye.add(right_vec);
      this.at.add(right_vec);
      this.updateViewMatrix();
   }

   // Renamed panMLeft to panHorizontal for clarity with mouse input
   // Positive angle rotates view to the right, negative to the left
   panHorizontal(angle) {
       var f = new Vector3();
       f.set(this.at);
       f.sub(this.eye); // f = view direction vector

       var rotationMatrix = new Matrix4();
       // Rotate around the world UP vector (this.up)
       rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
       
       var f_prime = rotationMatrix.multiplyVector3(f); // Get new direction vector
       
       var tempEye = new Vector3();
       tempEye.set(this.eye);
       this.at = tempEye.add(f_prime); // New 'at' = eye + new_direction_vector
       this.updateViewMatrix();
   }
   
   // New method for vertical panning (looking up/down)
   // Positive angle looks up, negative looks down
   panVertical(angle) {
       let newPitch = this.pitch + angle;

       // Clamp pitch to avoid flipping over
       if (newPitch > this.maxPitch) {
           newPitch = this.maxPitch;
       } else if (newPitch < this.minPitch) {
           newPitch = this.minPitch;
       }

       // Only apply rotation if there's an actual change in pitch allowed
       const actualAngleToRotate = newPitch - this.pitch;
       if (Math.abs(actualAngleToRotate) < 0.001) { // Epsilon check
           return;
       }
       this.pitch = newPitch;

       let viewDirection = new Vector3();
       viewDirection.set(this.at);
       viewDirection.sub(this.eye); // Current view direction: at - eye

       // Calculate the camera's right vector (axis of rotation for pitch)
       let rightVector = Vector3.cross(viewDirection, this.up);
       rightVector.normalize();

       let rotationMatrix = new Matrix4();
       rotationMatrix.setRotate(actualAngleToRotate, rightVector.elements[0], rightVector.elements[1], rightVector.elements[2]);

       let newViewDirection = rotationMatrix.multiplyVector3(viewDirection);
       
       let tempEye = new Vector3();
       tempEye.set(this.eye);
       this.at = tempEye.add(newViewDirection); // New 'at' = eye + rotated_view_direction

       this.updateViewMatrix();
   }

   panLeft(){ // Q key
      this.panHorizontal(2);
   }

   panRight(){ // E key
      this.panHorizontal(-2);
   }
}