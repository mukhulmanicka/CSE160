// DrawTriangle.js (c) 2012 matsuda
// Name: Mukhul Manicka Sivakumar
// Email: mmanicka@ucsc.edu

// Notes to Grader:
// I used ChatGPT to clarify some concepts and to help with the implementation of the Vector3 class.

function main() {  
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');  
  if (!canvas) { 
    console.log('Failed to retrieve the <canvas> element');
    return false; 
  } 

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);
}

function drawVector(ctx, v, color) {
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + v.elements[0] * 20, 200 - v.elements[1] * 20); // Scale and invert Y-axis
  ctx.strokeStyle = color;
  ctx.stroke();
}

function handleDrawEvent() {
  var canvas = document.getElementById('example');  
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  let x1 = parseFloat(document.getElementById("x-input").value) || 0;
  let y1 = parseFloat(document.getElementById("y-input").value) || 0;
  let v1 = new Vector3([x1, y1, 0]);

  let x2 = parseFloat(document.getElementById("x2-input").value) || 0;
  let y2 = parseFloat(document.getElementById("y2-input").value) || 0;
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");
}

function handleDrawOperationEvent() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, 400, 400);

  let x1 = parseFloat(document.getElementById("x-input").value) || 0;
  let y1 = parseFloat(document.getElementById("y-input").value) || 0;
  let v1 = new Vector3([x1, y1, 0]);

  let x2 = parseFloat(document.getElementById("x2-input").value) || 0;
  let y2 = parseFloat(document.getElementById("y2-input").value) || 0;
  let v2 = new Vector3([x2, y2, 0]);

  drawVector(ctx, v1, "red");
  drawVector(ctx, v2, "blue");

  let operation = document.getElementById("operation").value;
  let scalar = parseFloat(document.getElementById("scalar").value);

  let v3, v4;
  
  if (operation === "add") {
    v3 = v1.add(v2); 
    drawVector(ctx, v3, "green");
  } else if (operation === "sub") {
    v3 = v1.sub(v2); 
    drawVector(ctx, v3, "green");
  } else if (operation === "div") {
    v3 = v1.div(scalar); 
    v4 = v2.div(scalar); 
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (operation === "mul") {
    v3 = v1.mul(scalar); 
    v4 = v2.mul(scalar); 
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (operation === "magnitude") {
    console.log("Magnitude of vector 1: " + v1.magnitude()); 
    console.log("Magnitude of vector 2: " + v2.magnitude()); 
  } else if (operation === "normalize") {
    v3 = v1.normalize(); 
    v4 = v2.normalize(); 
    drawVector(ctx, v3, "green");
    drawVector(ctx, v4, "green");
  } else if (operation === "angle") {
    let dotProduct = Vector3.dot(v1, v2); 
    let magV1 = v1.magnitude(); 
    let magV2 = v2.magnitude(); 
    let angle = Math.acos(dotProduct / (magV1 * magV2)) * (180 / Math.PI);

    console.log("Angle between v1 and v2: " + angle + " degrees");
  } else if (operation === "area") {
    let crossProduct = Vector3.cross(v1, v2); 
    let area = crossProduct.magnitude() / 2; 

    console.log("Area of Triangle: " + area);
  }
}
