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
var u_whichTexture;
var u_Clicked;
var g_camera;
let isDragging = false;
var g_rotation = 0; // Camera

// Performance variables
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var g_lastFrameTime = 0;        // Timestamp of the last frame processed
var g_frameCount = 0;           // How many frames we've counted for the current FPS calculation
var g_fpsAccumulator = 0;       // Accumulates time for FPS calculation
var g_fpsDisplayInterval = 0.5; // How often to update the FPS display (e.g., every 0.5 seconds)

// Add these with your other global variables at the top of asg3.js
var g_placedBlocks = []; // Array to store the blocks you place
const PLACEMENT_DISTANCE = 3.0; // How far in front of the camera to place a block
const PLACED_BLOCK_SCALE = 0.3;  // The size of the placed blocks
const GROUND_Y_LEVEL = -0.25;   // Assuming your floor is at y = -0.25

var g_lastMouseX = 0;
var g_lastMouseY = 0;
const MOUSE_SENSITIVITY_X = 0.15; // Adjust as needed
const MOUSE_SENSITIVITY_Y = 0.15; // Adjust as needed
const KEY_PITCH_ANGLE = 2.0;    // Degrees to pitch per Z/X key press

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
    } else {
        gl_FragColor = vec4(1,.2,.2,1);              // Error, Red
    }
}`

function addActionsForHtmlUI(){
    // Empty for now
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
        return; 
    }
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) { 
        console.log('Error: Failed to get u_Sampler1'); 
        return; 
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
    var image = new Image();
    var image1 = new Image();
    if (!image) { console.log('Error: Failed to fetch image0'); return false; }
    if (!image1) { console.log('Error: Failed to fetch image1'); return false; }
    image.onload = function(){ sendTextureToTEXTURE0(image); };
    image1.onload = function(){ sendTextureToTEXTURE1(image1); };
    image.src = 'textures/grass.png';
    image1.src = 'textures/sky.jpg';
    return true;
}

function isPowerOf2(value) { 
    return (value & (value - 1)) == 0; 
}

function sendTextureToTEXTURE0(image) {
    var texture = gl.createTexture();
    if(!texture){ console.log('Error: Failed to make texture0'); return false; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.uniform1i(u_Sampler0, 0);
}

function sendTextureToTEXTURE1(image) {
    var texture = gl.createTexture();
    if(!texture){ console.log('Error: Failed to make texture1'); return false; }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); // REPEAT was CLAMP_TO_EDGE
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT); // REPEAT was CLAMP_TO_EDGE
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.uniform1i(u_Sampler1, 1);
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

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
    let angleStep = 2.0; // Degrees for panning

    if (ev.keyCode == 87) { // W
        g_camera.forward();
    } else if (ev.keyCode == 65) { // A
        g_camera.left();
    } else if (ev.keyCode == 83) { // S
        g_camera.back();
    } else if (ev.keyCode == 68) { // D
        g_camera.right();
    } else if (ev.keyCode == 81) { // Q
        g_camera.panHorizontal(angleStep);
    } else if (ev.keyCode == 69) { // E
        g_camera.panHorizontal(-angleStep);
    } else if (ev.keyCode == 90) { // Z
        g_camera.panVertical(KEY_PITCH_ANGLE);
    } else if (ev.keyCode == 88) { // X
        g_camera.panVertical(-KEY_PITCH_ANGLE);
    } else if (ev.keyCode == 70) { // F
        placeBlock();
    } else if (ev.keyCode == 82) { // R
        removeBlock();
    }
    
    renderScene();
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

function tick(){
    var currentTime = performance.now();
    var deltaTime = (currentTime - g_lastFrameTime) / 1000.0; // deltaTime in seconds
    g_lastFrameTime = currentTime;

    g_frameCount++;
    g_fpsAccumulator += deltaTime;

    if (g_fpsAccumulator >= g_fpsDisplayInterval) {
        var local_fps = g_frameCount / g_fpsAccumulator;
        var local_ms = (g_fpsAccumulator * 1000.0) / g_frameCount;

        var fpsElement = document.getElementById('numdot');
        if (fpsElement) {
            fpsElement.textContent = "fps: " + local_fps.toFixed(2) + " | ms: " + local_ms.toFixed(2);
        }
        g_frameCount = 0;
        g_fpsAccumulator = 0;
    }

    g_seconds = performance.now()/1000.0 - g_startTime;
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