// Global variables
var gl;
var canvas;
var a_Position;
var a_UV;
var a_Normal; // Added for normals
var u_FragColor;
var u_ModelMatrix;
var u_NormalMatrix; // Added for transforming normals
var u_ProjectionMatrix;
var u_ViewMatrix;
var u_GlobalRotateMatrix;
var u_Sampler0;
var u_Sampler1;
var u_Sampler2;
var u_whichTexture;
var u_LightPos; // Added for light position
var u_CameraPos; // Added for camera position (for specular)
var u_LightColor; // Added for light color
var u_NormalVisualization; // Added for toggling normal view
var u_LightingOn; // Added for toggling lighting

var g_camera;
let isDragging = false;
var g_rotation = 0; // Keeping for potential global rotation
var g_lastMouseX = 0;
var g_lastMouseY = 0;
const MOUSE_SENSITIVITY_X = 0.25; // Adjusted sensitivity
const MOUSE_SENSITIVITY_Y = 0.25;

// Lighting and UI Globals
var g_lightPos = new Vector3([1, 2, 3]);
var g_lightColor = [1.0, 1.0, 1.0];
var g_normalVisualization = false;
var g_lightingOn = true;
var g_lightAnimation = true;

// Performance variables
var g_startTime = performance.now() / 1000.0;
var g_seconds = performance.now() / 1000.0 - g_startTime;
var g_lastFrameTime = 0;
var g_frameCount = 0;
var g_fpsAccumulator = 0;
var g_fpsDisplayInterval = 0.5;

var VSHADER_SOURCE =`
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    attribute vec3 a_Normal;

    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos; // Vertex position in world space

    uniform mat4 u_ModelMatrix;
    uniform mat4 u_NormalMatrix; // To transform normals
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;

    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
        v_Normal = normalize(vec3(u_NormalMatrix * vec4(a_Normal, 0.0)));
        v_VertPos = u_ModelMatrix * a_Position;
    }`;

var FSHADER_SOURCE =`
    precision mediump float;
    varying vec2 v_UV;
    varying vec3 v_Normal;
    varying vec4 v_VertPos;

    uniform vec4 u_FragColor; // Base color when no texture/lighting
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform int u_whichTexture;

    uniform vec3 u_LightPos;
    uniform vec3 u_CameraPos;
    uniform vec3 u_LightColor;
    uniform bool u_NormalVisualization;
    uniform bool u_LightingOn;

    void main() {
        if (u_NormalVisualization) {
            gl_FragColor = vec4(v_Normal * 0.5 + 0.5, 1.0); // Visualize normals (0..1 range)
            return;
        }

        vec3 normal = normalize(v_Normal);
        vec3 lightDirection = normalize(u_LightPos - v_VertPos.xyz);
        vec3 viewDirection = normalize(u_CameraPos - v_VertPos.xyz);

        // Determine base color (from texture or uniform)
        vec4 baseColor;
        if(u_whichTexture == 0){
            baseColor = texture2D(u_Sampler0, v_UV);
        } else if(u_whichTexture == 1){
            baseColor = texture2D(u_Sampler1, v_UV);
        } else if(u_whichTexture == 2){
            baseColor = texture2D(u_Sampler2, v_UV);
        } else if (u_whichTexture == -1){
            baseColor = vec4(v_UV, 1.0, 1.0); // UV debug
        } else {
            baseColor = u_FragColor; // Use fixed color
        }

        if (!u_LightingOn) {
            gl_FragColor = baseColor;
            return;
        }

        // Ambient Light
        float ambientStrength = 0.2;
        vec3 ambient = ambientStrength * u_LightColor;

        // Diffuse Light
        float diff = max(dot(normal, lightDirection), 0.0);
        vec3 diffuse = diff * u_LightColor;

        // Specular Light
        float specularStrength = 0.8; // Make things shiny
        vec3 reflectDirection = reflect(-lightDirection, normal);
        float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), 32.0); // Shininess factor = 32
        vec3 specular = specularStrength * spec * u_LightColor;

        // Final Color
        vec3 result = (ambient + diffuse + specular) * baseColor.rgb;
        gl_FragColor = vec4(result, baseColor.a);
    }`;

function addActionsForHtmlUI(){
    // Sliders
    document.getElementById('lightX').addEventListener('input', function() { g_lightPos.elements[0] = parseFloat(this.value); renderScene(); });
    document.getElementById('lightY').addEventListener('input', function() { g_lightPos.elements[1] = parseFloat(this.value); renderScene(); });
    document.getElementById('lightZ').addEventListener('input', function() { g_lightPos.elements[2] = parseFloat(this.value); renderScene(); });
    document.getElementById('lightR').addEventListener('input', function() { g_lightColor[0] = parseFloat(this.value); renderScene(); });
    document.getElementById('lightG').addEventListener('input', function() { g_lightColor[1] = parseFloat(this.value); renderScene(); });
    document.getElementById('lightB').addEventListener('input', function() { g_lightColor[2] = parseFloat(this.value); renderScene(); });

    // Buttons
    document.getElementById('normalButton').onclick = function() { g_normalVisualization = !g_normalVisualization; renderScene(); };
    document.getElementById('lightButton').onclick = function() { g_lightingOn = !g_lightingOn; renderScene(); };
    document.getElementById('lightAnimationButton').onclick = function() { g_lightAnimation = !g_lightAnimation; };

}

function setupWebGL(){
    canvas = document.getElementById('webgl');
    if (!canvas) { console.log('Error: Failed to retrieve <canvas>'); return; }
    gl = getWebGLContext(canvas, { preserveDrawingBuffer: true }); // Keep buffer for potential saving
    if(!gl){ console.log('Error: Failed to get WebGL context'); return; }
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) { console.log('Error: Failed to intialize shaders.'); return; }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    u_LightPos = gl.getUniformLocation(gl.program, 'u_LightPos');
    u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos');
    u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
    u_NormalVisualization = gl.getUniformLocation(gl.program, 'u_NormalVisualization');
    u_LightingOn = gl.getUniformLocation(gl.program, 'u_LightingOn');

    // Check if all attributes/uniforms were found
    if (a_Position < 0 || a_UV < 0 || a_Normal < 0 || !u_FragColor || !u_ModelMatrix ||
        !u_NormalMatrix || !u_GlobalRotateMatrix || !u_ViewMatrix || !u_ProjectionMatrix ||
        !u_Sampler0 || !u_Sampler1 || !u_Sampler2 || !u_whichTexture || !u_LightPos ||
        !u_CameraPos || !u_LightColor || !u_NormalVisualization || !u_LightingOn) {
        console.log('Error: Failed to get one or more GLSL variable locations');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

function initTextures() {
    var imageGrass = new Image();
    var imageSky = new Image();
    var imageDirt = new Image();

    if (!imageGrass || !imageSky || !imageDirt) { console.log('Failed to create image objects'); return false; }

    imageGrass.onload = function(){ sendTextureToGL(imageGrass, gl.TEXTURE0, u_Sampler0, 0); };
    imageSky.onload = function(){ sendTextureToGL(imageSky, gl.TEXTURE1, u_Sampler1, 1); };
    imageDirt.onload = function(){ sendTextureToGL(imageDirt, gl.TEXTURE2, u_Sampler2, 2); };

    imageGrass.src = 'textures/grass.png'; // Make sure these paths are correct!
    imageSky.src = 'textures/sky.jpg';
    imageDirt.src = 'textures/dirt.jpg';

    return true;
}

function isPowerOf2(value) { return (value & (value - 1)) == 0; }

function sendTextureToGL(image, textureUnit, samplerUniform, textureUnitIndex) {
    var texture = gl.createTexture();
    if (!texture) { console.log('Failed to create texture object ' + textureUnitIndex); return false; }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(textureUnit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
        gl.generateMipmap(gl.TEXTURE_2D);
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // Use CLAMP_TO_EDGE for non-power-of-2
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    gl.uniform1i(samplerUniform, textureUnitIndex);
    console.log("Loaded texture " + textureUnitIndex + " (" + image.src + ")");
}

function keydown(ev) {
    // Basic camera movement - keep or remove as needed
    switch (ev.keyCode) {
        case 87: // W key
            g_camera.moveForward(0.2);
            break;
        case 83: // S key
            g_camera.moveForward(-0.2);
            break;
        case 65: // A key
            g_camera.moveRight(-0.2);
            break;
        case 68: // D key
            g_camera.moveRight(0.2);
            break;
        case 81: // Q key
            g_camera.panHorizontal(5); // Rotate left
            break;
        case 69: // E key
            g_camera.panHorizontal(-5); // Rotate right
            break;
        case 38: // Up Arrow
             g_camera.panVertical(5); // Tilt Up
             break;
        case 40: // Down Arrow
             g_camera.panVertical(-5); // Tilt Down
             break;
    }
    renderScene();
}


function mouseLook(ev){
    if (!isDragging) return;

    let deltaX = ev.clientX - g_lastMouseX;
    let deltaY = ev.clientY - g_lastMouseY;

    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    g_camera.panHorizontal(-deltaX * MOUSE_SENSITIVITY_X);
    g_camera.panVertical(-deltaY * MOUSE_SENSITIVITY_Y); // Keep Y sensitivity negative for standard FPS look
}

function updateAnimationAngles(){
    if (g_lightAnimation) {
        g_lightPos.elements[0] = Math.cos(g_seconds * 0.5) * 4; // Animate X
        g_lightPos.elements[2] = Math.sin(g_seconds * 0.5) * 4; // Animate Z
        // Update slider positions
        document.getElementById('lightX').value = g_lightPos.elements[0];
        document.getElementById('lightZ').value = g_lightPos.elements[2];
    }
}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHtmlUI();

    g_camera = new Camera();
    document.onkeydown = keydown; // Keep keydown for potential simple controls

    canvas.onmousedown = function(ev) {
        isDragging = true;
        g_lastMouseX = ev.clientX;
        g_lastMouseY = ev.clientY;
    };
    canvas.onmouseup = function(ev) { isDragging = false; };
    canvas.onmouseout = function(ev) { isDragging = false; };
    canvas.onmousemove = function(ev) { mouseLook(ev); };

    initTextures();
    gl.clearColor(0.1, 0.1, 0.15, 1.0); // Darker background

    g_startTime = performance.now() / 1000.0;
    g_lastFrameTime = performance.now();
    requestAnimationFrame(tick);
}

function tick(){
    var currentTime = performance.now();
    var deltaTime = (currentTime - g_lastFrameTime) / 1000.0;
    g_lastFrameTime = currentTime;
    g_seconds = currentTime / 1000.0 - g_startTime;

    // Update FPS counter
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

    updateAnimationAngles();
    renderScene();
    requestAnimationFrame(tick);
}

function renderScene(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var projMat = g_camera.projMat;
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = g_camera.viewMat;
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_rotation, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Pass lighting/camera uniforms (once per frame)
    gl.uniform3fv(u_LightPos, g_lightPos.elements);
    gl.uniform3fv(u_CameraPos, g_camera.eye.elements);
    gl.uniform3fv(u_LightColor, g_lightColor);
    gl.uniform1i(u_NormalVisualization, g_normalVisualization);
    gl.uniform1i(u_LightingOn, g_lightingOn);

    drawAllShapes();
}