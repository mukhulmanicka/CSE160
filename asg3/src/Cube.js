class Cube{
   constructor(){
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.matrix = new Matrix4();
      this.textureNum = -2; // Default to debug color
   }

   render() {
      var rgba = this.color;

      // Set which texture to use or if to use solid color
      gl.uniform1i(u_whichTexture, this.textureNum);

      // Pass the base color (used if textureNum is -2, or for modulation if shader supported it)
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

      // Pass the model matrix for this cube
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      // Define vertices and UVs for a standard cube face (0,0 to 1,1)
      // UVs: (0,1) --- (1,1)
      //       |         |
      //      (0,0) --- (1,0)
      // Standard UV mapping for a quad split into two triangles
      const uvTri1 = [0,0, 1,1, 1,0]; // Corresponds to v1, v3, v2
      const uvTri2 = [0,0, 0,1, 1,1]; // Corresponds to v1, v4, v3
      // More common UV for quad (v0,v1,v2; v0,v2,v3)
      // (0,0) (1,0) (1,1) ; (0,0) (1,1) (0,1) if vertices are ordered bottom-left, top-left, top-right etc.
      // The original UVs were a bit mixed, let's use a consistent set for faces that get textured.
      // For example, for a face with vertices (0,0), (1,0), (1,1), (0,1) (bottom-left, bottom-right, top-right, top-left)
      // Tri1: (0,0,0), (1,0,0), (1,1,0) -> UVs: [0,0, 1,0, 1,1]
      // Tri2: (0,0,0), (1,1,0), (0,1,0) -> UVs: [0,0, 1,1, 0,1]

      // Front face: z=0
      drawTriangle3DUV([0,0,0, 1,0,0, 1,1,0], [0,0, 1,0, 1,1]);
      drawTriangle3DUV([0,0,0, 1,1,0, 0,1,0], [0,0, 1,1, 0,1]);

      // Back face: z=1
      drawTriangle3DUV([0,0,1, 1,1,1, 1,0,1], [0,0, 1,1, 1,0]); // Order for UVs might need adjustment based on winding
      drawTriangle3DUV([0,0,1, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);

      // Top face: y=1 (Solid color, or use UVs if textured)
      // If solid color (textureNum = -2 or -1 often implies this for specific faces)
      // For simplicity, let's assume if a cube is textured, all faces that can be are.
      // If top/bottom are not meant to be textured by u_Sampler0/1, this part needs to change.
      // The original used drawTriangle3D, implying no specific UVs for these.
      // If textureNum != -2 and != -1, these will try to use texture with potentially stale/no UVs.
      // Let's make them use drawTriangle3DUV as well if the cube is textured.
      if (this.textureNum >= 0) {
        drawTriangle3DUV([0,1,0, 1,1,1, 1,1,0], [0,0, 1,1, 1,0]); // Example UVs
        drawTriangle3DUV([0,1,0, 0,1,1, 1,1,1], [0,0, 0,1, 1,1]);

        // Bottom face: y=0
        drawTriangle3DUV([0,0,0, 1,0,1, 0,0,1], [0,0, 1,1, 0,1]); // Example UVs
        drawTriangle3DUV([0,0,0, 1,0,0, 1,0,1], [0,0, 1,0, 1,1]);

        // Left face: x=0
        drawTriangle3DUV([0,0,0, 0,1,1, 0,1,0], [0,0, 1,1, 1,0]); // Example UVs
        drawTriangle3DUV([0,0,0, 0,0,1, 0,1,1], [0,0, 0,1, 1,1]);

        // Right face: x=1
        drawTriangle3DUV([1,0,0, 1,1,1, 1,0,1], [0,0, 1,1, 0,1]); // Example UVs
        drawTriangle3DUV([1,0,0, 1,1,0, 1,1,1], [0,0, 1,0, 1,1]);
      } else {
        // If not textured, use drawTriangle3D (which now correctly disables a_UV)
        // Top
        drawTriangle3D([0.0,1.0,0.0, 1.0,1.0,0.0, 1.0,1.0,1.0 ]);
        drawTriangle3D([0.0,1.0,1.0, 0.0,1.0,0.0, 1.0,1.0,1.0 ]);
        // Bottom
        drawTriangle3D([0.0,0.0,0.0, 0.0,0.0,1.0, 1.0,0.0,0.0 ]);
        drawTriangle3D([1.0,0.0,0.0, 1.0,0.0,1.0, 0.0,0.0,1.0 ]);
        // Left
        drawTriangle3D([0.0,0.0,0.0, 0.0,1.0,0.0, 0.0,1.0,1.0 ]);
        drawTriangle3D([0.0,1.0,1.0, 0.0,0.0,0.0, 0.0,0.0,1.0 ]);
        // Right
        drawTriangle3D([1.0,0.0,0.0, 1.0,1.0,0.0, 1.0,1.0,1.0 ]);
        drawTriangle3D([1.0,1.0,1.0, 1.0,0.0,0.0, 1.0,0.0,1.0 ]);
      }
   }

   renderfast() {
      var rgba = this.color;

      // Pass the color (used if textureNum is -2)
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      // Set texture mode
      gl.uniform1i(u_whichTexture, this.textureNum);

      // Pass the model matrix
      gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

      // Consolidate all vertices for the cube
      // Each face is 2 triangles = 6 vertices
      // 6 faces * 6 vertices/face = 36 vertices
      // Each vertex is 3 floats (x,y,z)
      // Total floats = 36 * 3 = 108
      var allverts = [
        // Front Face
        0.0,0.0,0.0,  1.0,0.0,0.0,  1.0,1.0,0.0,
        0.0,0.0,0.0,  1.0,1.0,0.0,  0.0,1.0,0.0,
        // Back Face
        0.0,0.0,1.0,  1.0,1.0,1.0,  1.0,0.0,1.0,
        0.0,0.0,1.0,  0.0,1.0,1.0,  1.0,1.0,1.0,
        // Top Face
        0.0,1.0,0.0,  1.0,1.0,0.0,  1.0,1.0,1.0,
        0.0,1.0,0.0,  1.0,1.0,1.0,  0.0,1.0,1.0,
        // Bottom Face
        0.0,0.0,0.0,  1.0,0.0,1.0,  1.0,0.0,0.0,
        0.0,0.0,0.0,  0.0,0.0,1.0,  1.0,0.0,1.0,
        // Left Face
        0.0,0.0,0.0,  0.0,1.0,0.0,  0.0,1.0,1.0,
        0.0,0.0,0.0,  0.0,1.0,1.0,  0.0,0.0,1.0,
        // Right Face
        1.0,0.0,0.0,  1.0,1.0,1.0,  1.0,1.0,0.0,
        1.0,0.0,0.0,  1.0,0.0,1.0,  1.0,1.0,1.0
      ];

      // UV coordinates for the whole cube if renderfast is to be textured
      // This requires drawTriangle3DUV or a similar function that takes a large batch.
      // The current drawTriangle3D will only use positions.
      // If renderfast cubes (map walls) are textured, they need UVs.
      // If they are textureNum = -2 (solid color), then drawTriangle3D is fine as is.
      // The map cubes in DrawAllShapes.js set textureNum = -2, so this is okay.
      drawTriangle3D(allverts);
   }
}