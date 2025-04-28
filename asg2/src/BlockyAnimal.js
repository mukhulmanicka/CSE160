var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalAngleZ = 0;
let g_neckAngle = 0;
let g_headAngle = 0;
let g_wingAngle = 0;
let g_legAngle = 0;
let g_footAngle = 0;
let g_tailAngle = 0;

let g_animation = false;
let g_idleAnimation = false;
let g_headBobbingAnimation = false;

let g_seconds = 0;
let g_isDragging = false;
let g_lastX, g_lastY;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Enable hidden surface removal
    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    // Get the storage location of u_ModelMatrix
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }

    // Get the storage location of u_GlobalRotateMatrix
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }
}

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    document.getElementById('animationOnButton').onclick = function() { g_animation = true; };
    document.getElementById('animationOffButton').onclick = function() { g_animation = false; };
    document.getElementById('neckSlide').addEventListener('input', (e) => { g_neckAngle = e.target.value; renderScene(); });
    document.getElementById('wingSlide').addEventListener('input', (e) => { g_wingAngle = e.target.value; renderScene(); });
    document.getElementById('legSlide').addEventListener('input', (e) => { g_legAngle = e.target.value; renderScene(); });
    document.getElementById('xAngleSlide').addEventListener('input', (e) => { g_globalAngleX = e.target.value; renderScene(); });
    document.getElementById('yAngleSlide').addEventListener('input', (e) => { g_globalAngleY = e.target.value; renderScene(); });
    document.getElementById('zAngleSlide').addEventListener('input', (e) => { g_globalAngleZ = e.target.value; renderScene(); });

    canvas.addEventListener('mousedown', (e) => {
        g_isDragging = true;
        g_lastX = e.clientX;
        g_lastY = e.clientY;

        if (e.shiftKey) {
            g_idleAnimation = !g_idleAnimation;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        g_isDragging = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (g_isDragging) {
            let deltaX = e.clientX - g_lastX;
            let deltaY = e.clientY - g_lastY;
            g_globalAngleY += deltaX * 0.5;
            g_globalAngleX += deltaY * 0.5;
            g_lastX = e.clientX;
            g_lastY = e.clientY;
            renderScene();
        }
    });
}

function main() {
    // Set up canvas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    // Set up the background color animation
    requestAnimationFrame(tick);
}

function tick() {
    g_seconds += 0.016; // Simulate 60 FPS
    updateAnimationAngles();
    renderScene();
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if (g_animation) {
        g_legAngle = 20 * Math.sin(g_seconds * 5);
        g_footAngle = 10 * Math.sin(g_seconds * 5);
        g_wingAngle = 20 * Math.sin(g_seconds * 4);
    } else {
        g_legAngle = 0;
        g_footAngle = 0;
        g_wingAngle = 0;
    }
    
    if (g_idleAnimation) {
        g_neckAngle = 15 * Math.sin(g_seconds * 1.5);
        g_headAngle = 10 * Math.sin(g_seconds * 1.5); 
        g_tailAngle = 5 * Math.sin(g_seconds * 2);
    } else {
        g_neckAngle = 0;
        g_headAngle = 0;
        g_tailAngle = 0;
    }
}

function renderScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let globalRotMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
    globalRotMat.rotate(g_globalAngleZ, 0, 0, 1);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    drawDuck();
}