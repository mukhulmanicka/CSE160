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
var g_rotation = 0;
var g_placedBlocks = [];
var g_lastMouseX = 0;
var g_lastMouseY = 0;
const PLACEMENT_DISTANCE = 3.0;
const PLACED_BLOCK_SCALE = 0.3;
const GROUND_Y_LEVEL = -0.25;
const MOUSE_SENSITIVITY_X = 0.15;
const MOUSE_SENSITIVITY_Y = 0.15;
const KEY_PITCH_ANGLE = 2.0;

// Performance variables
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var g_lastFrameTime = 0;
var g_frameCount = 0;
var g_fpsAccumulator = 0;
var g_fpsDisplayInterval = 0.5;

// Game variables
var gameMessageElem;
var roundMessageElem;
var gameOverMessageElem;
var g_gameState = "IDLE";
var g_currentRound = 0;
var g_enemies = [];
var g_enemiesSpawnedThisRound = 0;
var g_enemySpawnTimer = 0;

const ROUND_CONFIGS = [
    { id: 1, enemiesToSpawn: 5,  speed: 0.4, spawnInterval: 3.0 },  // Round 1
    { id: 2, enemiesToSpawn: 10, speed: 0.6, spawnInterval: 2.0 },  // Round 2
    { id: 3, enemiesToSpawn: 15, speed: 0.8, spawnInterval: 1.5 }   // Round 3
];

const ENEMY_COLOR = [0.8, 0.1, 0.1, 1.0];
const ENEMY_SCALE = PLACED_BLOCK_SCALE;
const TREE_TRUNK_XZ_RADIUS = 0.15;
const ENEMY_REMOVAL_DISTANCE = PLACEMENT_DISTANCE * 0.6;
const ENEMY_REMOVAL_RADIUS = 0.5;

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
        g_lastMouseX = ev.clientX;
        g_lastMouseY = ev.clientY;
    };
    canvas.onmouseup = function(ev) {
        isDragging = false;
    };
    canvas.onmouseout = function(ev) {
        isDragging = false;
    };
    canvas.onmousemove = function(ev) {
        if (isDragging) {
            mouseLook(ev);
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
            return;
        }
    }

    if (g_gameState.includes("ROUND")) { 
        if (ev.keyCode == 70) { // 'F' key for Place Block
            placeBlock();
        } else if (ev.keyCode == 82) { // 'R' key for Remove
            removeGameElement();
        }
    }

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

    let eye = g_camera.eye;
    let at = g_camera.at;

    let forward_dir = new Vector3();
    forward_dir.set(at);
    forward_dir.sub(eye);
    forward_dir.normalize();
    forward_dir.mul(PLACEMENT_DISTANCE);

    let placementCenterPos = new Vector3();
    placementCenterPos.set(eye);
    placementCenterPos.add(forward_dir);
    placementCenterPos.elements[1] = GROUND_Y_LEVEL + (PLACED_BLOCK_SCALE / 2);

    newBlock.matrix = new Matrix4();
    newBlock.matrix.translate(placementCenterPos.elements[0], placementCenterPos.elements[1], placementCenterPos.elements[2]);
    newBlock.matrix.scale(PLACED_BLOCK_SCALE, PLACED_BLOCK_SCALE, PLACED_BLOCK_SCALE);
    newBlock.matrix.translate(-0.5, -0.5, -0.5);

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
            if (g_currentRound < ROUND_CONFIGS.length && ROUND_CONFIGS[g_currentRound]) {
                roundMessageElem.textContent = "Round " + ROUND_CONFIGS[g_currentRound].id + " is about to start...";
            } else if (g_currentRound >= ROUND_CONFIGS.length) {
                roundMessageElem.textContent = "All rounds completed!";
            } else {
                roundMessageElem.textContent = "Preparing...";
            }
            break;
        case "ROUND_ACTIVE":
            gameMessageElem.textContent = "Defend the Tree!";
            let currentConfig = ROUND_CONFIGS[g_currentRound-1];
            roundMessageElem.textContent = "Round: " + currentConfig.id + 
                                         " | Enemies Remaining (to spawn): " + (currentConfig.enemiesToSpawn - g_enemiesSpawnedThisRound) +
                                         " | Active Enemies: " + g_enemies.length;
            break;
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
    g_placedBlocks = [];
    g_gameState = "ROUND_STARTING";
    updateGameMessages();
    setTimeout(startNextRound, 3000);
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
    g_enemySpawnTimer = 0;
    g_enemies = [];

    g_gameState = "ROUND_ACTIVE";
    updateGameMessages();
    console.log("Starting Round " + config.id);
}

function spawnEnemy() {
    let config = ROUND_CONFIGS[g_currentRound - 1];
    if (g_enemiesSpawnedThisRound >= config.enemiesToSpawn) {
        return;
    }

    let enemy = new Cube();
    enemy.color = ENEMY_COLOR.slice();
    enemy.textureNum = -2;
    enemy.speed = config.speed;

    const spawnDistanceFromOrigin = 5.0;
    let angle = Math.random() * Math.PI * 2;
    let spawnX = Math.cos(angle) * spawnDistanceFromOrigin;
    let spawnZ = Math.sin(angle) * spawnDistanceFromOrigin;
    let spawnY = GROUND_Y_LEVEL + ENEMY_SCALE / 2; 

    enemy.matrix = new Matrix4();
    enemy.matrix.translate(spawnX, spawnY, spawnZ);
    enemy.matrix.scale(ENEMY_SCALE, ENEMY_SCALE, ENEMY_SCALE);
    enemy.matrix.translate(-0.5, 0, -0.5);

    g_enemies.push(enemy);
    g_enemiesSpawnedThisRound++;
    updateGameMessages();
}

function updateEnemies(deltaTime) {
    if (g_gameState !== "ROUND_ACTIVE") return;

    let config = ROUND_CONFIGS[g_currentRound - 1];
    g_enemySpawnTimer += deltaTime;
    if (g_enemiesSpawnedThisRound < config.enemiesToSpawn && g_enemySpawnTimer >= config.spawnInterval) {
        spawnEnemy();
        g_enemySpawnTimer = 0;
    }

    // Move existing enemies
    for (let i = g_enemies.length - 1; i >= 0; i--) {
        let enemy = g_enemies[i];
        let enemyPos = new Vector3([enemy.matrix.elements[12], enemy.matrix.elements[13], enemy.matrix.elements[14]]);
        let targetY = GROUND_Y_LEVEL + ENEMY_SCALE / 2;
        let treeBasePos = new Vector3([0, targetY, 0]);

        let moveDir = new Vector3();
        moveDir.set(treeBasePos);
        moveDir.sub(enemyPos);
        moveDir.elements[1] = 0;
        moveDir.normalize();
        moveDir.mul(enemy.speed * deltaTime);

        let newEnemyCenter = new Vector3([
            enemyPos.elements[0] + moveDir.elements[0],
            enemyPos.elements[1],
            enemyPos.elements[2] + moveDir.elements[2]
        ]);

        enemy.matrix = new Matrix4()
            .translate(newEnemyCenter.elements[0], newEnemyCenter.elements[1], newEnemyCenter.elements[2])
            .scale(ENEMY_SCALE, ENEMY_SCALE, ENEMY_SCALE)
            .translate(-0.5, 0, -0.5);


        // Check collision with tree (simplified: check XZ distance to tree center)
        let distToTreeCenterXZ = Math.sqrt(
            newEnemyCenter.elements[0] * newEnemyCenter.elements[0] +
            newEnemyCenter.elements[2] * newEnemyCenter.elements[2]
        );

        if (distToTreeCenterXZ < TREE_TRUNK_XZ_RADIUS + ENEMY_SCALE/2) {
            console.log("Enemy reached the tree! Game Over.");
            g_gameState = "GAME_OVER";
            updateGameMessages();
            return;
        }
    }

    // Check for round completion
    if (g_enemiesSpawnedThisRound === config.enemiesToSpawn && g_enemies.length === 0 && g_gameState === "ROUND_ACTIVE") {
        console.log("Round " + config.id + " cleared!");
        updateGameMessages();
         if (g_currentRound === ROUND_CONFIGS.length) {
            g_gameState = "GAME_WON";
            updateGameMessages();
        } else {
            gameMessageElem.textContent = "Round " + config.id + " Cleared!";
            roundMessageElem.textContent = "Next round starting soon...";
            setTimeout(startNextRound, 4000);
        }
    }
}

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
            g_enemies.splice(i, 1);
            console.log("Corrupted Block removed by player. Remaining: " + g_enemies.length);
            updateGameMessages();
            return;
        }
    }

    if (g_placedBlocks.length > 0) {
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
        updateAnimationAngles();
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