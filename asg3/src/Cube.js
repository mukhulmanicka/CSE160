class Cube {
   constructor() {
       this.color = [1.0, 1.0, 1.0, 1.0];
       this.matrix = new Matrix4();
       this.textureNum = -2;
       this.positionVBO = null;
       this.uvVBO = null;
       this.vertexCount = 36;

       this.buffersInitialized = false;
   }

   initBuffers() {
       if (this.buffersInitialized || !gl) return;

       const geom = Cube.getUnitCubeGeometry();

       this.positionVBO = gl.createBuffer();
       if (!this.positionVBO) {
           console.error("Failed to create position VBO for Cube");
           return;
       }
       gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
       gl.bufferData(gl.ARRAY_BUFFER, geom.positions, gl.STATIC_DRAW);

       this.uvVBO = gl.createBuffer();
       if (!this.uvVBO) {
           console.error("Failed to create UV VBO for Cube");
       }
       gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
       gl.bufferData(gl.ARRAY_BUFFER, geom.uvs, gl.STATIC_DRAW);

       this.buffersInitialized = true;
       // console.log("Cube buffers initialized.");
   }

   render() {
       if (!this.buffersInitialized) {
           this.initBuffers();
           if (!this.buffersInitialized) {
               console.error("Cube.render() called but buffers not initialized.");
               return; 
           }
       }

       gl.uniform1i(u_whichTexture, this.textureNum);
       if (this.textureNum === -2) {
            gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
       }
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

       // Positions
       gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
       gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
       gl.enableVertexAttribArray(a_Position);

       // UVs
       if (this.textureNum >= -1 && this.uvVBO && a_UV >= 0) {
           gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
           gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
           gl.enableVertexAttribArray(a_UV);
       } else if (a_UV >= 0) {
           gl.disableVertexAttribArray(a_UV);
       }

       gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
   }

   renderfast() {
       if (!this.buffersInitialized) {
           this.initBuffers();
           if(!this.buffersInitialized) {
               console.error("Cube.renderfast() called but buffers not initialized.");
               return;
           }
       }

       gl.uniform1i(u_whichTexture, -2);
       gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

       // Positions
       gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
       gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
       gl.enableVertexAttribArray(a_Position);

       if (a_UV >= 0) {
           gl.disableVertexAttribArray(a_UV);
       }

       gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);
   }

   static getUnitCubeGeometry() {
       // 36 vertices, 6 per face (2 triangles * 3 vertices)
       const positions = new Float32Array([
           // Front face (z=0)
           0,0,0,  1,0,0,  1,1,0,    0,0,0,  1,1,0,  0,1,0,
           // Back face (z=1)
           0,0,1,  1,1,1,  1,0,1,    0,0,1,  0,1,1,  1,1,1,
           // Top face (y=1)
           0,1,0,  0,1,1,  1,1,1,    0,1,0,  1,1,1,  1,1,0,
           // Bottom face (y=0)
           0,0,0,  1,0,0,  1,0,1,    0,0,0,  1,0,1,  0,0,1,
           // Right face (x=1)
           1,0,0,  1,0,1,  1,1,1,    1,0,0,  1,1,1,  1,1,0,
           // Left face (x=0)
           0,0,0,  0,1,1,  0,0,1,    0,0,0,  0,1,0,  0,1,1,
       ]);
       
       // Standard UVs for each face (0,0 to 1,1), 6 vertices per face
       const uvs = new Float32Array(36 * 2);
       let uvPtr = 0;
       for (let i = 0; i < 6; i++) {
           uvs[uvPtr++] = 0; uvs[uvPtr++] = 0;
           uvs[uvPtr++] = 1; uvs[uvPtr++] = 0;
           uvs[uvPtr++] = 1; uvs[uvPtr++] = 1;

           uvs[uvPtr++] = 0; uvs[uvPtr++] = 0;
           uvs[uvPtr++] = 1; uvs[uvPtr++] = 1;
           uvs[uvPtr++] = 0; uvs[uvPtr++] = 1;
       }
       return { positions: positions, uvs: uvs };
   }
}