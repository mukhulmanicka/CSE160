function drawAllShapes(){
   // Sky
   var sky = new Cube();
   sky.color = [.8, .8, .8, 1]; // Sky is less affected by light, but we'll apply it
   sky.textureNum = 1;
   sky.matrix = new Matrix4();
   sky.matrix.scale(10, 10, 10); // Make skybox much larger
   sky.matrix.translate(0, 0.2, 0); // Raise the skybox
   sky.render();

   // Floor
   var floor = new Cube();
   floor.textureNum = 0; // Grass texture
   floor.matrix = new Matrix4();
   floor.matrix.translate(0, -2.5, 0); // Lower the floor
   floor.matrix.scale(10, 0.01, 10);
   floor.render();

   // Central Sphere
   var sphere = new Sphere();
   sphere.color = [0.6, 0.6, 1.0, 1.0]; // Bluish sphere
   sphere.textureNum = -2; // Use color
   sphere.matrix = new Matrix4();
   sphere.matrix.scale(0.8, 0.8, 0.8); // Make it slightly smaller than 1 unit
   sphere.matrix.translate(0, 0, -1); // Lower the sphere
   sphere.render();

   // A Cube
   var a_cube = new Cube();
   a_cube.color = [1.0, 0.6, 0.2, 1.0]; // Orange cube
   a_cube.textureNum = -2;
   a_cube.matrix = new Matrix4();
   a_cube.matrix.translate(-2, -0.25, -1);
   a_cube.render();

   // Light Source Cube (rendered without lighting)
   var lightCube = new Cube();
   lightCube.color = [g_lightColor[0], g_lightColor[1], g_lightColor[2], 1.0];
   lightCube.textureNum = -2; // Use color
   lightCube.matrix = new Matrix4();
   lightCube.matrix.translate(g_lightPos.elements[0], g_lightPos.elements[1], g_lightPos.elements[2]);
   lightCube.matrix.scale(0.1, 0.1, 0.1); // Make it small

   // Trunk
   var trunk = new Cube();
   trunk.color = [0.5, 0.35, 0.2, 1.0];
   trunk.textureNum = -2;
   var trunkMatrix = new Matrix4();
   trunkMatrix.translate(-0.1, -2, -0.1);
   trunkMatrix.scale(0.2, 1.0, 0.2);
   trunk.matrix = trunkMatrix;
   trunk.renderfast();

   // Leaves
   var leaves = new Cube();
   leaves.color = [0.2, 0.6, 0.1, 1.0];
   leaves.textureNum = -2;
   var leavesMatrix = new Matrix4();
   leavesMatrix.translate(-0.1, -1.5, -0.1);
   leavesMatrix.scale(0.6, 0.6, 0.6);
   leaves.matrix = leavesMatrix;
   leaves.renderfast();

   // Temporarily disable lighting for the light cube itself
   let currentLightingState = g_lightingOn;
   g_lightingOn = false; // Turn off lighting
   gl.uniform1i(u_LightingOn, g_lightingOn); // Update uniform
   lightCube.render();
   g_lightingOn = currentLightingState; // Restore lighting state
   gl.uniform1i(u_LightingOn, g_lightingOn); // Update uniform back

}