var VSHADER_SOURCE = `
attribute vec4 a_Position;
uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    //gl_PointSize = 10.0;
    gl_PointSize = u_Size;
  }`

// Fragment shader program              
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedType = POINT;
let g_selectedSeg = 1;

var g_shapesList = [];

var bgAnimationId = null;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
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

    // Get the storage location of u_Size
    u_Size = gl.getUniformLocation(gl.program, 'u_Size');
    if (!u_Size) {
        console.log('Failed to get the storage location of u_Size');
        return;
    }
}

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    // Button Events (Shape Type)
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };

    document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes(); };

    document.getElementById('pointButton').onclick = function() {g_selectedType=POINT};
    document.getElementById('triButton').onclick = function() {g_selectedType=TRIANGLE};
    document.getElementById('circleButton').onclick = function() {g_selectedType=CIRCLE};

    document.getElementById('drawPenguin').onclick = function() { renderPenguin(); };

    document.getElementById('startAnimation').onclick = function() {
        if (!bgAnimationId) {
            animateBackgroundColor();
        }
    };
    document.getElementById('stopAnimation').onclick = function() {
        if (bgAnimationId) {
            cancelAnimationFrame(bgAnimationId);
            bgAnimationId = null;
            // Reset to a static black background.
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            renderAllShapes();
        }
    };

    //Slider Events
    document.getElementById('redSlide').addEventListener('mouseup', function() {g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() {g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() {g_selectedColor[2] = this.value/100; });

    // Size Slider Events
    document.getElementById('sizeSlide').addEventListener('mouseup', function() {g_selectedSize = this.value; });
    
    // Segment Slider Events
    document.getElementById('segSlide').addEventListener('mouseup', function() {g_selectedSeg = this.value; });

}

function main() {
    // Set up canvas and gl variables
    setupWebGL();

    // Set up GLSL shader programs and connect GLSL variables
    connectVariablesToGLSL();

    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    canvas.onmousedown = click;
    canvas.onmousemove = function(ev) { if(ev.buttons == 1) {click(ev)} };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
    // Extract the event click and return it in WebGL coordinates
    let [x, y] = convertCoordinatesEventToGL(ev);

    let point;

    if (g_selectedType == POINT) {
        point = new Point();
    } else if (g_selectedType == TRIANGLE) {
        point = new Triangle();
    } else {
        point = new Circle();
    }

    point.position = [x, y];
    point.color=g_selectedColor.slice();
    point.size=g_selectedSize;

    if (g_selectedType == CIRCLE) {
        point.segments = g_selectedSeg;
    }

    g_shapesList.push(point);

    // Draw every shape that is supposed to be in the canvas
    renderAllShapes();
}

// Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
    return([x, y]);
}

// Draw every shape that is supposed to be in the canvas 
function renderAllShapes() {

    // Check the time at the start of this function
    var startTime = performance.now();

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw each shape on the list
    var len = g_shapesList.length;

    for(var i = 0; i < len; i++) {
        g_shapesList[i].render();
    } 

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML("numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

// Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}

function renderPenguin() {
  // Clear any previously drawn shapes.
  g_shapesList = [];
  
  // Set a sky-blue background.
  gl.clearColor(0.3, 0.6, 0.9, 1.0); 
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Define colors.
  let black  = [0.0, 0.0, 0.0, 1.0];
  let orange = [1.0, 0.6, 0.0, 1.0];
  let white  = [1.0, 1.0, 1.0, 1.0];
  
  // Helper function: pushes one triangle into g_shapesList.
  function pushTriangle(x1, y1, x2, y2, x3, y3, color) {
    g_shapesList.push({
      render: function(){
        gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
        gl.uniform1f(u_Size, 1.0);
        drawTriangle([x1, y1, x2, y2, x3, y3]);
      }
    });
  }
  
  //--------------------------------------------
  // 1. HEAD (2 Triangles)
  //    Head vertices: left (-0.35, 0.3), right (0.35, 0.3), top (0.0, 0.7)
  //--------------------------------------------
  pushTriangle(-0.35, 0.3,  0.0, 0.3,  0.0, 0.7, black);
  pushTriangle( 0.0, 0.3,  0.35, 0.3,  0.0, 0.7, black);
  
  //--------------------------------------------
  // 2. BODY (8 Triangles = Subdivided Rectangle)
  //    Rectangle corners: left=-0.35, right=0.35, top=0.3, bottom=-0.7
  //--------------------------------------------
  let bodyLeft = -0.35, bodyRight = 0.35;
  let bodyTop = 0.3, bodyBottom = -0.7;
  let bodyMidX = 0.0, bodyMidY = (bodyTop + bodyBottom) / 2; // = -0.2
  
  // Top-left rectangle.
  pushTriangle(bodyLeft, bodyTop, bodyMidX, bodyTop, bodyMidX, bodyMidY, black);
  pushTriangle(bodyLeft, bodyTop, bodyMidX, bodyMidY, bodyLeft, bodyMidY, black);
  
  // Top-right rectangle.
  pushTriangle(bodyMidX, bodyTop, bodyRight, bodyTop, bodyRight, bodyMidY, black);
  pushTriangle(bodyMidX, bodyTop, bodyRight, bodyMidY, bodyMidX, bodyMidY, black);
  
  // Bottom-left rectangle.
  pushTriangle(bodyLeft, bodyMidY, bodyMidX, bodyMidY, bodyMidX, bodyBottom, black);
  pushTriangle(bodyLeft, bodyMidY, bodyMidX, bodyBottom, bodyLeft, bodyBottom, black);
  
  // Bottom-right rectangle.
  pushTriangle(bodyMidX, bodyMidY, bodyRight, bodyMidY, bodyRight, bodyBottom, black);
  pushTriangle(bodyMidX, bodyMidY, bodyRight, bodyBottom, bodyMidX, bodyBottom, black);
  
  //--------------------------------------------
  // 3. WINGS (Total 2 Triangles, 1 per wing)
  //    Left wing: one triangle.
  //--------------------------------------------
  // Define vertices for the left wing:
  // Attachment at the body left edge, a tip extended outward, and lower attachment on the body.
  pushTriangle(-0.35, 0.1,  -0.75, 0.0,  -0.35, -0.2, black);
  
  //--------------------------------------------
  // Right wing: one triangle.
  //--------------------------------------------
  pushTriangle(0.35, 0.1,  0.75, 0.0,  0.35, -0.2, black);
  
  //--------------------------------------------
  // 4. BEAK (2 Triangles)
  //    Centered at the head’s base.
  //--------------------------------------------
  pushTriangle(-0.08, 0.3,  0.0, 0.3,  0.0, 0.22, orange);
  pushTriangle( 0.0, 0.3,   0.08, 0.3,  0.0, 0.22, orange);
  
  //--------------------------------------------
  // 5. FEET (Total 2 Triangles, 1 per foot)
  //--------------------------------------------
  // Left foot: one triangle.
  pushTriangle(-0.2, -0.7,  -0.3, -0.7,  -0.25, -0.85, orange);
  
  //--------------------------------------------
  // Right foot: one triangle.
  //--------------------------------------------
  pushTriangle(0.2, -0.7,   0.3, -0.7,  0.25, -0.85, orange);
  
  //--------------------------------------------
  // 6. EYES (Each Eye = 2 Triangles, Total 4 Triangles)
  //    Eyes are now made larger and lowered.
  //    Left eye covers roughly x from -0.12 to -0.04, and y from 0.55 to 0.50.
  //--------------------------------------------
  // Left eye.
  pushTriangle(-0.12, 0.55, -0.08, 0.55, -0.08, 0.50, white);
  pushTriangle(-0.08, 0.55, -0.04, 0.55, -0.08, 0.50, white);
  
  // Right eye.
  pushTriangle(0.12, 0.55,  0.08, 0.55,  0.08, 0.50, white);
  pushTriangle(0.08, 0.55,  0.04, 0.55,  0.08, 0.50, white);
  
  // Render all triangles.
  renderAllShapes();
}
  
function animateBackgroundColor() {
function update() {
    let time = performance.now() / 1000;
    let red   = (Math.sin(time) + 1) / 2;
    let green = (Math.sin(time + 2*Math.PI/3) + 1) / 2;
    let blue  = (Math.sin(time + 4*Math.PI/3) + 1) / 2;
    gl.clearColor(red, green, blue, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderAllShapes();
    bgAnimationId = requestAnimationFrame(update);
}
bgAnimationId = requestAnimationFrame(update);
}
  