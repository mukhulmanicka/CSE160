// Global variables
var gl;
var canvas;
var a_Position;
var a_UV;
var u_FragColor;
var u_ModelMatrix;
var u_ProjectionMatrix;
var u_ViewMatrix;
var u_GlobalRotateMatrix;
var u_Sampler0;
var u_Sampler1;
var u_Sampler2;
var u_whichTexture;
var u_Clicked;
var g_camera;
let isDragging = false;
var g_rotation = 0; // Camera
var g_placedBlocks = []; // Array to store the blocks you place
const PLACEMENT_DISTANCE = 3.0; // How far in front of the camera to place a block
const PLACED_BLOCK_SCALE = 0.3;  // The size of the placed blocks
const GROUND_Y_LEVEL = -0.25;   // Assuming your floor is at y = -0.25
var g_lastMouseX = 0;
var g_lastMouseY = 0;
const MOUSE_SENSITIVITY_X = 0.15; // Adjust as needed
const MOUSE_SENSITIVITY_Y = 0.15; // Adjust as needed
const KEY_PITCH_ANGLE = 2.0;    // Degrees to pitch per Z/X key press

// Performance variables
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var g_lastFrameTime = 0;        // Timestamp of the last frame processed
var g_frameCount = 0;           // How many frames we've counted for the current FPS calculation
var g_fpsAccumulator = 0;       // Accumulates time for FPS calculation
var g_fpsDisplayInterval = 0.5; // How often to update the FPS display (e.g., every 0.5 seconds)

// --- Game State Variables for Grove Guardian ---
var g_gameState = "IDLE"; // Possible states: "IDLE", "ROUND_STARTING", "ROUND_ACTIVE", "ROUND_WON", "GAME_OVER", "GAME_WON"
var g_currentRound = 0;
var g_enemies = []; // Array to store enemy cube objects

const ROUND_CONFIGS = [
    { id: 1, enemiesToSpawn: 5,  speed: 0.4, spawnInterval: 3.0 },  // Round 1
    { id: 2, enemiesToSpawn: 10, speed: 0.6, spawnInterval: 2.0 },  // Round 2
    { id: 3, enemiesToSpawn: 15, speed: 0.8, spawnInterval: 1.5 }   // Round 3
];

var g_enemiesSpawnedThisRound = 0;
var g_enemySpawnTimer = 0;

const ENEMY_COLOR = [0.8, 0.1, 0.1, 1.0]; // Reddish for corrupted blocks
const ENEMY_SCALE = PLACED_BLOCK_SCALE; // Use same scale as player-placed blocks or define new
const TREE_TRUNK_XZ_RADIUS = 0.15; // Tree trunk is 0.2 wide, so radius is 0.1. Add a small buffer.
const ENEMY_REMOVAL_DISTANCE = PLACEMENT_DISTANCE * 0.6; // How close player needs to be to remove enemy
const ENEMY_REMOVAL_RADIUS = 0.5; // How close to reticle the enemy must be

// Message Elements
var gameMessageElem;
var roundMessageElem;
var gameOverMessageElem;

var VSHADER_SOURCE =`
precision mediump float;
attribute vec4 a_Position;
attribute vec2 a_UV;
varying vec2 v_UV;
uniform mat4 u_ModelMatrix;
uniform mat4 u_GlobalRotateMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjectionMatrix;
uniform bool u_Clicked; // Mouse is pressed
void main() {
    if(u_Clicked){
        vec4(1,1,1,1);
    }
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
}`

var FSHADER_SOURCE =`
precision mediump float;
varying vec2 v_UV;
uniform vec4 u_FragColor;
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;
uniform sampler2D u_Sampler2;
uniform int u_whichTexture;
void main() {
    if(u_whichTexture == -2){
        gl_FragColor = u_FragColor;                  // Use color
    } else if (u_whichTexture == -1){
        gl_FragColor = vec4(v_UV, 1.0, 1.0);         // Use UV debug color
    } else if(u_whichTexture == 0){
        gl_FragColor = texture2D(u_Sampler0, v_UV);  // Use texture0
    } else if(u_whichTexture == 1){
        gl_FragColor = texture2D(u_Sampler1, v_UV);  // Use texture1
    } else if(u_whichTexture == 2){
        gl_FragColor = texture2D(u_Sampler2, v_UV);  // Use texture2
    } else {
        gl_FragColor = vec4(1,.2,.2,1);              // Error, Red
    }
}`

function addActionsForHtmlUI(){
    gameMessageElem = document.getElementById('gameMessageElement');
    roundMessageElem = document.getElementById('roundMessageElement');
    gameOverMessageElem = document.getElementById('gameOverMessageElement');
}

function setupWebGL(){
    canvas = document.getElementById('webgl');
    if (!canvas) {
        console.log('Error: Failed to retrieve the <canvas> element');
        return;
    }
    gl = getWebGLContext(canvas);
    if(!gl){
        console.log('Error: Failed to get the rendering context for WebGL');
        return;
    }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Error: Failed to intialize shaders.');
        return;
    }
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) { 
        console.log('Error: Failed to get a_Position'); 
        return; 
    }
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) { 
        console.log('Error: Failed to get a_UV'); 
        return; 
    }
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) { 
        console.log('Error: Failed to get u_whichTexture'); 
        return; 
    }
    u_Clicked = gl.getUniformLocation(gl.program, 'u_Clicked');
    if (!u_Clicked) { 
        console.log('Error: Failed to get u_Clicked'); 
        return; 
    }
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) { 
        console.log('Error: Failed to get u_FragColor'); 
        return; 
    }
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) { 
        console.log('Error: Failed to get u_ModelMatrix'); 
        return; 
    }
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) { 
        console.log('Error: Failed to get u_GlobalRotateMatrix'); 
        return; 
    }
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) { 
        console.log('Error: Failed to get u_ViewMatrix'); 
        return; 
    }
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) { 
        console.log('Error: Failed to get u_ProjectionMatrix'); 
        return; 
    }
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) { 
        console.log('Error: Failed to get u_Sampler0'); 
        return false; 
    }
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) { 
        console.log('Error: Failed to get u_Sampler1'); 
        return false; 
    }
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
        console.log('Failed to get the storage location of u_Sampler2');
        return false;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
    var imageGrass = new Image();
    var imageSky = new Image();
    var imageDirt = new Image();

    if (!imageGrass || !imageSky || !imageDirt) {
        console.log('Failed to create one or more image objects');
        return false;
    }

    imageGrass.onload = function(){ sendTextureToGL(imageGrass, gl.TEXTURE0, u_Sampler0, 0); };
    imageSky.onload = function(){ sendTextureToGL(imageSky, gl.TEXTURE1, u_Sampler1, 1); };
    imageDirt.onload = function(){ sendTextureToGL(imageDirt, gl.TEXTURE2, u_Sampler2, 2); };

    imageGrass.src = 'textures/grass.png';
    imageSky.src = 'textures/sky.jpg';
    imageDirt.src = 'textures/dirt.jpg';

    return true;
}

function isPowerOf2(value) { 
    return (value & (value - 1)) == 0; 
}

function sendTextureToGL(image, textureUnit, samplerUniform, textureUnitIndex) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object for unit ' + textureUnitIndex + ' (' + image.src.split('/').pop() + ')');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.uniform1i(samplerUniform, textureUnitIndex);
    console.log("Finished loadTexture for unit " + textureUnitIndex + " (" + image.src.split('/').pop() + ")");
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();
    updateGameMessages();

    g_camera = new Camera();
    document.onkeydown = keydown;

    canvas.onmousedown = function(ev) {
        isDragging = true;
        g_lastMouseX = ev.clientX; // Initialize last mouse position on drag start
        g_lastMouseY = ev.clientY;
        // check(ev); // Original call, keep if needed for picking on mousedown
        if (ev.shiftKey) { 
            // Placeholder for addBlock logic if you want it on click
        } else {
             check(ev); 
        }
    };
    canvas.onmouseup = function(ev) {
        isDragging = false;
    };
    canvas.onmouseout = function(ev) { // Important to stop dragging if mouse leaves canvas
        isDragging = false;
    };
    canvas.onmousemove = function(ev) {
        if (isDragging) {
            mouseLook(ev); // Changed from mouseCam to a more descriptive name
        }
    };

    initTextures();
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    g_startTime = performance.now() / 1000.0;
    g_lastFrameTime = performance.now();
    g_fpsAccumulator = 0;
    g_frameCount = 0;

    requestAnimationFrame(tick);
}

// check function (Copied from your original asg3.js)
function check(ev) {
    var picked = false; // This variable is not used outside this function scope
    var x = ev.clientX, y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
        var x_in_canvas = x - rect.left, y_in_canvas = rect.bottom - y;
        gl.uniform1i(u_Clicked, 1);
        var pixels = new Uint8Array(4);
        gl.readPixels(x_in_canvas, y_in_canvas, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.uniform1i(u_Clicked, 0);
    }
}

function convertCoordinatesEventToGL(ev){
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    return [x,y];
}

function mouseLook(ev){
    if (!isDragging) {
        return;
    }

    let deltaX = ev.clientX - g_lastMouseX;
    let deltaY = ev.clientY - g_lastMouseY;

    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    g_camera.panHorizontal(-deltaX * MOUSE_SENSITIVITY_X);
    g_camera.panVertical(-deltaY * MOUSE_SENSITIVITY_Y);
}

function keydown(ev){
    let angleStep = 2.0;

    if (g_gameState === "IDLE" || g_gameState === "GAME_OVER" || g_gameState === "GAME_WON") {
        if (ev.keyCode == 66) { // 'B' key to Begin/Restart game
            startGame();
            return; // Consume key press
        }
    }

    if (g_gameState.includes("ROUND")) { // Only allow game actions during rounds
        if (ev.keyCode == 70) { // 'F' key for Place Block
            placeBlock();
        } else if (ev.keyCode == 82) { // 'R' key for Remove
            removeGameElement(); // New function to handle removing player or enemy blocks
        }
    }

    // Camera controls always active (unless game over and you want to freeze controls)
    if (ev.keyCode == 87) { g_camera.forward(); }      // W
    else if (ev.keyCode == 65) { g_camera.left(); }    // A
    else if (ev.keyCode == 83) { g_camera.back(); }     // S
    else if (ev.keyCode == 68) { g_camera.right(); }   // D
    else if (ev.keyCode == 81) { g_camera.panHorizontal(angleStep); }  // Q
    else if (ev.keyCode == 69) { g_camera.panHorizontal(-angleStep); } // E
    else if (ev.keyCode == 90) { g_camera.panVertical(KEY_PITCH_ANGLE); }   // Z
    else if (ev.keyCode == 88) { g_camera.panVertical(-KEY_PITCH_ANGLE); }  // X
}

function placeBlock() {
    let newBlock = new Cube();
    newBlock.color = [Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, Math.random() * 0.8 + 0.2, 1.0]; // Random brighter color
    newBlock.textureNum = -2;

    // Calculate placement position in front of the camera
    let eye = g_camera.eye;
    let at = g_camera.at;

    let forward_dir = new Vector3();
    forward_dir.set(at);
    forward_dir.sub(eye); // forward_dir = at - eye
    forward_dir.normalize();
    forward_dir.mul(PLACEMENT_DISTANCE); // Scale by distance

    let placementCenterPos = new Vector3(); // This will be the CENTER of our new block
    placementCenterPos.set(eye);
    placementCenterPos.add(forward_dir);

    // Adjust Y so the BOTTOM of the block is at GROUND_Y_LEVEL
    placementCenterPos.elements[1] = GROUND_Y_LEVEL + (PLACED_BLOCK_SCALE / 2);

    // Set the block's matrix
    // The Cube.renderfast() draws a unit cube from (0,0,0) to (1,1,1).
    // To make its center at placementCenterPos and scale it:
    // 1. Translate the unit cube so its center is at (0,0,0) -> translate by (-0.5, -0.5, -0.5)
    // 2. Scale it to PLACED_BLOCK_SCALE
    // 3. Translate it to the final placementCenterPos
    newBlock.matrix = new Matrix4();
    newBlock.matrix.translate(placementCenterPos.elements[0], placementCenterPos.elements[1], placementCenterPos.elements[2]);
    newBlock.matrix.scale(PLACED_BLOCK_SCALE, PLACED_BLOCK_SCALE, PLACED_BLOCK_SCALE);
    newBlock.matrix.translate(-0.5, -0.5, -0.5); // Center the origin of the unit cube before scaling and final translation

    g_placedBlocks.push(newBlock);
    console.log("Block placed. Total blocks: " + g_placedBlocks.length);
}

function removeBlock() {
    if (g_placedBlocks.length > 0) {
        g_placedBlocks.pop();
        console.log("Block removed. Total blocks: " + g_placedBlocks.length);
    } else {
        console.log("No blocks to remove.");
    }
}

function updateGameMessages() {
    if (!gameMessageElem || !roundMessageElem || !gameOverMessageElem) return;

    gameOverMessageElem.textContent = ""; // Clear game over message by default

    switch(g_gameState) {
        case "IDLE":
            gameMessageElem.textContent = "Press 'B' to Begin Grove Guardian!";
            roundMessageElem.textContent = "";
            break;
        case "ROUND_STARTING":
            gameMessageElem.textContent = "Get Ready!";
            // When g_currentRound is 0, we are about to start Round 1 (index 0 of ROUND_CONFIGS).
            // When g_currentRound is 1 (after round 1 won), we are about to start Round 2 (index 1).
            // So, ROUND_CONFIGS[g_currentRound] refers to the config of the round that is about to start.
            if (g_currentRound < ROUND_CONFIGS.length && ROUND_CONFIGS[g_currentRound]) {
                roundMessageElem.textContent = "Round " + ROUND_CONFIGS[g_currentRound].id + " is about to start...";
            } else if (g_currentRound >= ROUND_CONFIGS.length) {
                // This case should ideally be handled by GAME_WON state before ROUND_STARTING is set again
                roundMessageElem.textContent = "All rounds completed!";
            } else {
                roundMessageElem.textContent = "Preparing..."; // Fallback
            }
            break;
        case "ROUND_ACTIVE":
            gameMessageElem.textContent = "Defend the Tree!";
            // Here, g_currentRound is 1, 2, or 3, so g_currentRound-1 is the correct index for the active round.
            let currentConfig = ROUND_CONFIGS[g_currentRound-1];
            roundMessageElem.textContent = "Round: " + currentConfig.id + 
                                         " | Enemies Remaining (to spawn): " + (currentConfig.enemiesToSpawn - g_enemiesSpawnedThisRound) +
                                         " | Active Enemies: " + g_enemies.length;
            break;
        // case "ROUND_WON": // This state was used in my previous detailed thought process
                           // but the implemented code transitions directly or to GAME_WON.
                           // If you add it, ensure indexing is correct.
                           // For example: gameMessageElem.textContent = "Round " + ROUND_CONFIGS[g_currentRound-1].id + " Cleared!";
            // break;
        case "GAME_OVER":
            gameMessageElem.textContent = "";
            roundMessageElem.textContent = "";
            gameOverMessageElem.textContent = "GAME OVER! A Corrupted Block reached the Tree! Press 'B' to restart.";
            break;
        case "GAME_WON":
            gameMessageElem.textContent = "";
            roundMessageElem.textContent = "";
            gameOverMessageElem.textContent = "YOU WON! The Sacred Grove is Safe! Press 'B' to play again.";
            break;
    }
}

function startGame() {
    console.log("Starting Grove Guardian game...");
    g_currentRound = 0;
    g_enemies = [];
    g_placedBlocks = []; // Clear player blocks too for a fresh game
    g_gameState = "ROUND_STARTING";
    updateGameMessages();
    setTimeout(startNextRound, 3000); // Give player 3 seconds before first round
}

function startNextRound() {
    g_currentRound++;
    if (g_currentRound > ROUND_CONFIGS.length) {
        g_gameState = "GAME_WON";
        updateGameMessages();
        return;
    }

    let config = ROUND_CONFIGS[g_currentRound - 1];
    g_enemiesSpawnedThisRound = 0;
    g_enemySpawnTimer = 0; // Reset spawn timer for this round
    g_enemies = []; // Clear any remaining enemies from a previous round (shouldn't happen with current logic)

    g_gameState = "ROUND_ACTIVE";
    updateGameMessages();
    console.log("Starting Round " + config.id);
}

function spawnEnemy() {
    let config = ROUND_CONFIGS[g_currentRound - 1];
    if (g_enemiesSpawnedThisRound >= config.enemiesToSpawn) {
        return; // All enemies for this wave spawned
    }

    let enemy = new Cube();
    enemy.color = ENEMY_COLOR.slice(); // Use a copy
    enemy.textureNum = -2;
    enemy.speed = config.speed;

    // Determine spawn position in a circle around the origin, outside the main play area
    const spawnDistanceFromOrigin = 5.0; // Distance from (0,0) to spawn enemies
    let angle = Math.random() * Math.PI * 2; // Random angle
    let spawnX = Math.cos(angle) * spawnDistanceFromOrigin;
    let spawnZ = Math.sin(angle) * spawnDistanceFromOrigin;
    // Center Y for the enemy so its bottom is at GROUND_Y_LEVEL
    let spawnY = GROUND_Y_LEVEL + ENEMY_SCALE / 2; 

    enemy.matrix = new Matrix4();
    enemy.matrix.translate(spawnX, spawnY, spawnZ); // Move to the spawn point (center of the enemy)
    enemy.matrix.scale(ENEMY_SCALE, ENEMY_SCALE, ENEMY_SCALE); // Scale the enemy
    enemy.matrix.translate(-0.5, -0.5, -0.5); // Adjust because Cube.renderfast() draws 0-1 local cube

    g_enemies.push(enemy);
    g_enemiesSpawnedThisRound++;
    updateGameMessages(); // Update enemy count display
}

function updateEnemies(deltaTime) {
    if (g_gameState !== "ROUND_ACTIVE") return;

    // Attempt to spawn new enemy based on interval
    let config = ROUND_CONFIGS[g_currentRound - 1];
    g_enemySpawnTimer += deltaTime;
    if (g_enemiesSpawnedThisRound < config.enemiesToSpawn && g_enemySpawnTimer >= config.spawnInterval) {
        spawnEnemy();
        g_enemySpawnTimer = 0; // Reset timer for next spawn
    }

    // Move existing enemies
    for (let i = g_enemies.length - 1; i >= 0; i--) {
        let enemy = g_enemies[i];

        // Get enemy's current center position
        // Matrix stores: [m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33]
        // Translation is in elements[12], elements[13], elements[14] of the final composed matrix.
        // This assumes matrix is Translate(world_center) * Scale * Translate(-0.5)
        // So elements[12],[13],[14] are the world center of the enemy.
        let enemyPos = new Vector3([enemy.matrix.elements[12], enemy.matrix.elements[13], enemy.matrix.elements[14]]);

        let treeBasePos = new Vector3([0, GROUND_Y_LEVEL + ENEMY_SCALE/2, 0]); // Target center of tree base area

        let moveDir = new Vector3();
        moveDir.set(treeBasePos);
        moveDir.sub(enemyPos);
        moveDir.normalize();
        moveDir.mul(enemy.speed * deltaTime);

        // Update enemy matrix by translating it
        enemy.matrix.translate(moveDir.elements[0]/ENEMY_SCALE, moveDir.elements[1]/ENEMY_SCALE, moveDir.elements[2]/ENEMY_SCALE);
        // The above translate is relative to the *scaled and pre-translated (-0.5,-0.5,-0.5)* local space.
        // It's simpler to update the world position directly if we reconstruct matrix:
        let newEnemyCenter = new Vector3([enemyPos.elements[0] + moveDir.elements[0],
                                         enemyPos.elements[1] + moveDir.elements[1],
                                         enemyPos.elements[2] + moveDir.elements[2]]);

        enemy.matrix = new Matrix4()
            .translate(newEnemyCenter.elements[0], newEnemyCenter.elements[1], newEnemyCenter.elements[2])
            .scale(ENEMY_SCALE, ENEMY_SCALE, ENEMY_SCALE)
            .translate(-0.5, -0.5, -0.5);


        // Check collision with tree (simplified: check XZ distance to tree center)
        let distToTreeCenterXZ = Math.sqrt(
            newEnemyCenter.elements[0] * newEnemyCenter.elements[0] + 
            newEnemyCenter.elements[2] * newEnemyCenter.elements[2]
        );

        if (distToTreeCenterXZ < TREE_TRUNK_XZ_RADIUS + ENEMY_SCALE/2) { // Collision
            console.log("Enemy reached the tree!");
            g_gameState = "GAME_OVER";
            updateGameMessages();
            return; // Stop further enemy processing this frame
        }
    }

    // Check for round completion
    if (g_enemiesSpawnedThisRound === config.enemiesToSpawn && g_enemies.length === 0 && g_gameState === "ROUND_ACTIVE") {
        console.log("Round " + config.id + " cleared!");
        g_gameState = "ROUND_WON"; // Or "BETWEEN_ROUNDS"
        updateGameMessages();
         if (g_currentRound === ROUND_CONFIGS.length) { // Last round won
            g_gameState = "GAME_WON";
            updateGameMessages();
        } else {
            // Prepare for next round after a delay or message
            gameMessageElem.textContent = "Round " + config.id + " Cleared!";
            roundMessageElem.textContent = "Next round starting soon...";
            setTimeout(startNextRound, 4000); // 4 seconds delay
        }
    }
}

// Modify removeBlock to become removeGameElement
function removeGameElement() {
    if (g_gameState !== "ROUND_ACTIVE") return; // Only allow removal during active round

    let eye = g_camera.eye;
    let at = g_camera.at;
    let forward_dir = new Vector3();
    forward_dir.set(at);
    forward_dir.sub(eye);
    forward_dir.normalize();

    let targetPoint = new Vector3();
    targetPoint.set(eye);
    targetPoint.add(forward_dir.mul(ENEMY_REMOVAL_DISTANCE)); // Target point in front

    // Try to remove an enemy first
    for (let i = g_enemies.length - 1; i >= 0; i--) {
        let enemy = g_enemies[i];
        let enemyCenter = new Vector3([enemy.matrix.elements[12], enemy.matrix.elements[13], enemy.matrix.elements[14]]);

        let distVec = new Vector3();
        distVec.set(enemyCenter);
        distVec.sub(targetPoint);
        if (distVec.magnitude() < ENEMY_REMOVAL_RADIUS + ENEMY_SCALE / 2) {
            g_enemies.splice(i, 1); // Remove enemy from array
            console.log("Corrupted Block removed by player. Remaining: " + g_enemies.length);
            updateGameMessages();
            return; // Removed one enemy, done for this key press
        }
    }

    // If no enemy removed, try to remove a player-placed block (original logic)
    if (g_placedBlocks.length > 0) {
        // For simplicity, just remove the last placed block.
        // Targeting player blocks would require similar distance checking to their positions.
        g_placedBlocks.pop();
        console.log("Player block removed. Total player blocks: " + g_placedBlocks.length);
    } else {
        console.log("No player blocks to remove.");
    }
}

function updateAnimationAngles(){
    return;
}

function tick(){
    var currentTime = performance.now();
    var deltaTime = (currentTime - g_lastFrameTime) / 1000.0;
    g_lastFrameTime = currentTime;

    g_frameCount++;
    g_fpsAccumulator += deltaTime;

    if (g_fpsAccumulator >= g_fpsDisplayInterval) {
        var local_fps = g_frameCount / g_fpsAccumulator;
        var local_ms = (g_fpsAccumulator * 1000.0) / g_frameCount;
        var fpsElement = document.getElementById('numdot');
        if (fpsElement) {
            fpsElement.textContent = "ms: " + local_ms.toFixed(2) + " | fps: " + local_fps.toFixed(2);
        }
        g_frameCount = 0;
        g_fpsAccumulator = 0;
    }

    g_seconds = currentTime / 1000.0 - g_startTime;

    if (g_gameState !== "GAME_OVER" && g_gameState !== "GAME_WON" && g_gameState !== "IDLE" && g_gameState !== "ROUND_STARTING" && g_gameState !== "ROUND_WON") {
        updateAnimationAngles(); // Only if game is active
    }

    if (g_gameState === "ROUND_ACTIVE") {
        updateEnemies(deltaTime);
    }

    renderScene();
    requestAnimationFrame(tick);
}

function renderScene(){
    var projMat = g_camera.projMat;
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = g_camera.viewMat;
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_rotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    drawAllShapes();
}