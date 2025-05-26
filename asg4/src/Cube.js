class Cube {
   constructor() {
       this.color = [1.0, 1.0, 1.0, 1.0];
       this.matrix = new Matrix4();
       this.textureNum = -2;
       this.positionVBO = null;
       this.uvVBO = null;
       this.normalVBO = null; // Added
       this.vertexCount = 36;
       this.buffersInitialized = false;
   }

   initBuffers() {
       if (this.buffersInitialized || !gl) return;

       const geom = Cube.getUnitCubeGeometry();

       // Position Buffer
       this.positionVBO = gl.createBuffer();
       if (!this.positionVBO) { console.error("Failed to create position VBO for Cube"); return; }
       gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
       gl.bufferData(gl.ARRAY_BUFFER, geom.positions, gl.STATIC_DRAW);

       // UV Buffer
       this.uvVBO = gl.createBuffer();
       if (!this.uvVBO) { console.error("Failed to create UV VBO for Cube"); }
       gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
       gl.bufferData(gl.ARRAY_BUFFER, geom.uvs, gl.STATIC_DRAW);

       // Normal Buffer
       this.normalVBO = gl.createBuffer();
       if (!this.normalVBO) { console.error("Failed to create Normal VBO for Cube"); }
       gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVBO);
       gl.bufferData(gl.ARRAY_BUFFER, geom.normals, gl.STATIC_DRAW); // Added

       this.buffersInitialized = true;
   }

   render() {
       if (!this.buffersInitialized) {
           this.initBuffers();
           if (!this.buffersInitialized) { console.error("Cube.render() failed: Buffers not initialized."); return; }
       }

       gl.uniform1i(u_whichTexture, this.textureNum);
       gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
       gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

       // Calculate and pass Normal Matrix
       var normalMatrix = new Matrix4();
       normalMatrix.setInverseOf(this.matrix);
       normalMatrix.transpose();
       gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

       // Positions
       gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
       gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
       gl.enableVertexAttribArray(a_Position);

       // UVs
       if (a_UV >= 0) {
           gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
           gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
           gl.enableVertexAttribArray(a_UV);
       }

       // Normals
       if (a_Normal >= 0) { // Added
           gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVBO);
           gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
           gl.enableVertexAttribArray(a_Normal);
       }

       gl.drawArrays(gl.TRIANGLES, 0, this.vertexCount);

       // Disable arrays (good practice, though may not be strictly necessary here)
       gl.disableVertexAttribArray(a_Position);
       if (a_UV >= 0) gl.disableVertexAttribArray(a_UV);
       if (a_Normal >= 0) gl.disableVertexAttribArray(a_Normal);
   }

   // Optional: renderfast can be simplified or removed if not needed
   renderfast() {
       this.render(); // Just use the full render for now
   }

   static getUnitCubeGeometry() {
       // Unit cube centered at (0.5, 0.5, 0.5) - adjusted for easier use
       const p = [
           // Front face
           0,0,1,  1,0,1,  1,1,1,    0,0,1,  1,1,1,  0,1,1, // v0,v1,v2, v0,v2,v3
           // Back face
           1,0,0,  0,0,0,  0,1,0,    1,0,0,  0,1,0,  1,1,0, // v5,v4,v7, v5,v7,v6
           // Top face
           0,1,1,  1,1,1,  1,1,0,    0,1,1,  1,1,0,  0,1,0, // v3,v2,v6, v3,v6,v7
           // Bottom face
           0,0,0,  1,0,0,  1,0,1,    0,0,0,  1,0,1,  0,0,1, // v4,v5,v1, v4,v1,v0
           // Right face
           1,0,1,  1,0,0,  1,1,0,    1,0,1,  1,1,0,  1,1,1, // v1,v5,v6, v1,v6,v2
           // Left face
           0,0,0,  0,0,1,  0,1,1,    0,0,0,  0,1,1,  0,1,0  // v4,v0,v3, v4,v3,v7
       ];
       const positions = new Float32Array(p.map(val => val - 0.5)); // Center around origin

       const n = [
           // Front face
           0,0,1,  0,0,1,  0,0,1,    0,0,1,  0,0,1,  0,0,1,
           // Back face
           0,0,-1, 0,0,-1, 0,0,-1,   0,0,-1, 0,0,-1, 0,0,-1,
           // Top face
           0,1,0,  0,1,0,  0,1,0,    0,1,0,  0,1,0,  0,1,0,
           // Bottom face
           0,-1,0, 0,-1,0, 0,-1,0,   0,-1,0, 0,-1,0, 0,-1,0,
           // Right face
           1,0,0,  1,0,0,  1,0,0,    1,0,0,  1,0,0,  1,0,0,
           // Left face
           -1,0,0, -1,0,0, -1,0,0,   -1,0,0, -1,0,0, -1,0,0,
       ];
       const normals = new Float32Array(n);

       const uvs = new Float32Array([
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Front
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Back
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Top
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Bottom
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Right
           0,0, 1,0, 1,1,  0,0, 1,1, 0,1, // Left
       ]);

       return { positions: positions, uvs: uvs, normals: normals };
   }
}