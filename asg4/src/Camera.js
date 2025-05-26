class Camera {
   constructor() {
      this.fov = 60;
      this.eye = new Vector3([0, 1, 5]); // Start a bit further back
      this.at  = new Vector3([0, 0, 0]); // Look at origin
      this.up  = new Vector3([0, 1, 0]);
      this.viewMat = new Matrix4();
      this.projMat = new Matrix4();

      this.speed = 1.0; // Movement speed
      this.alpha = 5.0; // Rotation speed

      this.updateViewMatrix();
      if (typeof canvas !== 'undefined' && canvas) {
           this.projMat.setPerspective(50, canvas.width/canvas.height, 0.1, 1000);
      } else {
           this.projMat.setPerspective(50, 1, 0.1, 1000);
      }
   }

   updateViewMatrix() {
       this.viewMat.setLookAt(
           this.eye.elements[0], this.eye.elements[1],  this.eye.elements[2],
           this.at.elements[0],  this.at.elements[1],   this.at.elements[2],
           this.up.elements[0],  this.up.elements[1],   this.up.elements[2]);
   }

   getForwardVector() {
       let f = new Vector3();
       f.set(this.at);
       f.sub(this.eye);
       f.normalize();
       return f;
   }

    getRightVector() {
        let f = this.getForwardVector();
        let r = Vector3.cross(f, this.up);
        r.normalize();
        return r;
    }

   moveForward(amount) {
       let f = this.getForwardVector();
       f.mul(amount * this.speed);
       this.eye.add(f);
       this.at.add(f);
       this.updateViewMatrix();
   }

   moveRight(amount) {
       let r = this.getRightVector();
       r.mul(amount * this.speed);
       this.eye.add(r);
       this.at.add(r);
       this.updateViewMatrix();
   }

   panHorizontal(degrees) {
       let f = new Vector3();
       f.set(this.at);
       f.sub(this.eye); // f = at - eye

       let rotationMatrix = new Matrix4();
       rotationMatrix.setRotate(degrees * this.alpha * 0.1, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

       let f_prime = rotationMatrix.multiplyVector3(f);
       this.at.set(this.eye);
       this.at.add(f_prime);

       this.updateViewMatrix();
   }

    panVertical(degrees) {
        let f = new Vector3();
        f.set(this.at);
        f.sub(this.eye); // f = at - eye

        let r = this.getRightVector(); // Get the right vector for rotation axis

        let rotationMatrix = new Matrix4();
        rotationMatrix.setRotate(degrees * this.alpha * 0.1, r.elements[0], r.elements[1], r.elements[2]);

        let f_prime = rotationMatrix.multiplyVector3(f);

        // Check to avoid flipping over (optional but good)
        let new_at = new Vector3();
        new_at.set(this.eye);
        new_at.add(f_prime);
        let check_up = Vector3.cross(this.getRightVector(), f_prime);
        if (check_up.elements[1] < 0.1) return; // Prevent looking too far up/down


        this.at.set(this.eye);
        this.at.add(f_prime);

        this.updateViewMatrix();
    }
}