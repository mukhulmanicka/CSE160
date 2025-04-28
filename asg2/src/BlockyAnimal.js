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

let g_seconds = 0;
let g_lastTimestamp = 0;
let g_fps = 0;
let g_frameCount = 0;
let g_frameTime = 0;
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
    document.getElementById('animationOffButton').onclick = function() {
        g_animation = false;
    
        // Reset all animated angles to 0
        g_legAngle = 0;
        g_wingAngle = 0;
        g_tailAngle = 0;
        g_headAngle = 0;
    
        // Reset sliders back to center
        document.getElementById('legSlide').value = 0;
        document.getElementById('wingSlide').value = 0;
        document.getElementById('headSlide').value = 0;
    
        renderScene();
    };
    
    
    document.getElementById('headSlide').addEventListener('input', function(e) { g_headAngle = parseFloat(e.target.value); renderScene(); });
    document.getElementById('wingSlide').addEventListener('input', function(e) { g_wingAngle = parseFloat(e.target.value); renderScene(); });
    document.getElementById('legSlide').addEventListener('input', function(e) { g_legAngle = parseFloat(e.target.value); renderScene(); });
    document.getElementById('xAngleSlide').addEventListener('input', function(e) { g_globalAngleX = parseFloat(e.target.value); renderScene(); });
    document.getElementById('yAngleSlide').addEventListener('input', function(e) { g_globalAngleY = parseFloat(e.target.value); renderScene(); });
    document.getElementById('zAngleSlide').addEventListener('input', function(e) { g_globalAngleZ = parseFloat(e.target.value); renderScene(); });

    let isDragging = false;
    let lastX, lastY;
    
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
        
        if (e.shiftKey) {
            g_idleAnimation = !g_idleAnimation;
        
            if (!g_idleAnimation) {
            g_neckAngle = 0;
            g_headAngle = 0;
            g_tailAngle = 0;
        
            if (document.getElementById('headSlide')) {
                document.getElementById('headSlide').value = 0;
            }
        
            renderScene();
            }
        }
    });
    
    canvas.addEventListener('mouseup', (e) => { isDragging = false; });
    
    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        let dx = e.clientX - lastX;
        let dy = e.clientY - lastY;
    
        g_globalAngleX += dx * 0.5;
        g_globalAngleY += dy * 0.5;
    
        lastX = e.clientX;
        lastY = e.clientY;
    
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

    // Render initial scene
    renderScene();

    // Start animation loop
    g_lastTimestamp = performance.now();
    requestAnimationFrame(tick);
}

function updatePerformance(timestamp) {
    // Calculate time between frames
    const elapsed = timestamp - g_lastTimestamp;
    g_lastTimestamp = timestamp;
    
    // Update frame count and accumulated time
    g_frameCount++;
    g_frameTime += elapsed;
    
    // Update FPS once per second
    if (g_frameTime >= 1000) {
        g_fps = Math.round((g_frameCount * 1000) / g_frameTime);
        g_frameCount = 0;
        g_frameTime = 0;
        
        // Update the performance display
        const performanceDisplay = document.getElementById('numdot');
        if (performanceDisplay) {
            performanceDisplay.innerHTML = `ms: ${elapsed.toFixed(2)} fps: ${g_fps}`;
        }
    }
}

function tick(timestamp) {
    g_seconds += 0.016; // Simulate 60 FPS
    
    // Update performance metrics
    updatePerformance(timestamp);
    
    // Only update animation angles if animation is enabled
    if (g_animation || g_idleAnimation) {
        updateAnimationAngles();
        renderScene();
    }
    requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if (g_animation) {
        g_legAngle = 10 * Math.sin(g_seconds * 5);
        g_footAngle = 5 * Math.sin(g_seconds * 5);
        g_wingAngle = 10 * Math.sin(g_seconds * 4);
        
        // Update slider positions to match animation
        if (document.getElementById('legSlide')) {
            document.getElementById('legSlide').value = g_legAngle;
        }
        if (document.getElementById('wingSlide')) {
            document.getElementById('wingSlide').value = g_wingAngle;
        }
    }
    
    if (g_idleAnimation) {
        g_neckAngle = 8 * Math.sin(g_seconds * 1.5);
        g_headAngle = 8 * Math.sin(g_seconds * 1.5);
        g_tailAngle = 3 * Math.sin(g_seconds * 2);
        
        if (document.getElementById('headSlide')) {
            document.getElementById('headSlide').value = g_headAngle;
        }
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