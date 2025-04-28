// I used ChatGPT to help me with the animation angles.

function drawDuck() {
    // Body
    let body = new Cube();
    body.color = [0.0, 0.35, 0.3, 1.0]; // Greenish body
    body.matrix.translate(-0.4, -0.25, 0);
    body.matrix.scale(0.75, 0.55, 0.6);
    body.render();

    // Neck
    let neck = new Cube();
    neck.color = [1.0, 0.85, 0.3, 1.0];
    neck.matrix.translate(-0.12, 0.3, 0.1);
    neck.matrix.rotate(g_neckAngle, 1, 0, 0); // Keep X-axis rotation
    neck.matrix.scale(0.2, 0.3, 0.2);
    neck.render();

    // Head
    let head = new Cube();
    head.color = [1.0, 0.9, 0.5, 1.0];
    head.matrix.translate(-0.17, 0.5, 0.25);
    head.matrix.rotate(g_headAngle, 1, 0, 0); // Keep X-axis rotation
    head.matrix.scale(0.3, 0.3, -0.3);
    head.render();

    // Beak
    let beak = new Cube();
    beak.color = [1.0, 0.5, 0.0, 1.0]; // Orange beak
    beak.matrix.translate(-0.15, 0.51, 0);
    beak.matrix.rotate(g_headAngle, 1, 0, 0);
    beak.matrix.scale(0.26, 0.1, -0.2);
    beak.render();

    // Left Eye
    let leftEye = new Cube();
    leftEye.color = [1.0, 1.0, 1.0, 1.0]; // White eye
    leftEye.matrix.translate(-0.15, 0.63, -0.1);
    leftEye.matrix.rotate(g_headAngle, 1, 0, 0);
    leftEye.matrix.scale(0.1, 0.1, 0.05);
    leftEye.render();

    // Left Pupil
    let leftPupil = new Cube();
    leftPupil.color = [0.0, 0.0, 0.0, 1.0]; // Black pupil
    leftPupil.matrix.translate(-0.10, 0.63, -0.11);
    leftPupil.matrix.rotate(g_headAngle, 1, 0, 0);
    leftPupil.matrix.scale(0.05, 0.05, 0.05);
    leftPupil.render();

    // Right Eye
    let rightEye = new Cube();
    rightEye.color = [1.0, 1.0, 1.0, 1.0]; // White eye
    rightEye.matrix.translate(0.0, 0.63, -0.1);
    rightEye.matrix.rotate(g_headAngle, 1, 0, 0);
    rightEye.matrix.scale(0.1, 0.1, 0.1);
    rightEye.render();

    // Right Pupil
    let rightPupil = new Cube();
    rightPupil.color = [0.0, 0.0, 0.0, 1.0]; // Black pupil
    rightPupil.matrix.translate(0.0, 0.63, -0.11);
    rightPupil.matrix.rotate(g_headAngle, 1, 0, 0);
    rightPupil.matrix.scale(0.05, 0.05, 0.05);
    rightPupil.render();

    // Left Wing
    let leftWing = new Cube();
    leftWing.color = [1.0, 0.85, 0.3, 1.0];
    leftWing.matrix.translate(-0.55, -0.1, 0);
    leftWing.matrix.rotate(-g_wingAngle, 0, 0, 1);
    leftWing.matrix.scale(0.15, 0.4, 0.5);
    leftWing.render();

    // Right Wing
    let rightWing = new Cube();
    rightWing.color = [1.0, 0.85, 0.3, 1.0];
    rightWing.matrix.translate(0.35, -0.1, 0);
    rightWing.matrix.rotate(-g_wingAngle, 0, 0, 1);
    rightWing.matrix.scale(0.15, 0.4, 0.5);
    rightWing.render();

    // Left Leg
    let leftLeg = new Cube();
    leftLeg.color = [1.0, 0.5, 0.0, 1.0]; // Orange legs
    leftLeg.matrix.translate(-0.35, -0.6, 0.2);
    let leftLegMatrix = new Matrix4(leftLeg.matrix);
    leftLeg.matrix.rotate(g_legAngle, 1, 0, 0);
    leftLeg.matrix.rotate(g_legAngle * 0.3, 0, 1, 0);
    leftLeg.matrix.scale(0.2, 0.35, 0.2);
    leftLeg.render();

    // Left Foot
    let leftFoot = new Cube();
    leftFoot.color = [1.0, 0.4, 0.0, 1.0];
    leftFoot.matrix = new Matrix4(leftLegMatrix);
    leftFoot.matrix.rotate(g_legAngle, 1, 0, 0);
    leftFoot.matrix.rotate(g_legAngle * 0.3, 0, 1, 0);
    leftFoot.matrix.translate(0, -0.1, -0.1);
    leftFoot.matrix.scale(0.2, 0.1, 0.3);
    leftFoot.render();

    // Right Leg
    let rightLeg = new Cube();
    rightLeg.color = [1.0, 0.5, 0.0, 1.0];
    rightLeg.matrix.translate(0.1, -0.6, 0.2);
    let rightLegMatrix = new Matrix4(rightLeg.matrix);
    rightLeg.matrix.rotate(-g_legAngle, 1, 0, 0);
    rightLeg.matrix.rotate(-g_legAngle * 0.3, 0, 1, 0);
    rightLeg.matrix.scale(0.2, 0.35, 0.2);
    rightLeg.render();

    // Right Foot
    let rightFoot = new Cube();
    rightFoot.color = [1.0, 0.4, 0.0, 1.0];
    rightFoot.matrix = new Matrix4(rightLegMatrix);
    rightFoot.matrix.rotate(-g_legAngle, 1, 0, 0);
    rightFoot.matrix.rotate(-g_legAngle * 0.3, 0, 1, 0);
    rightFoot.matrix.translate(0, -0.1, -0.1);
    rightFoot.matrix.scale(0.2, 0.1, 0.3);
    rightFoot.render();

    // Tail
    let tail = new Sphere();
    tail.color = [1.0, 0.85, 0.3, 1.0];
    tail.matrix.translate(-0.01, 0.0, 0.6);
    tail.matrix.rotate(g_tailAngle, 0, 1, 0);
    tail.matrix.scale(0.2, 0.1, 0.2);
    tail.render();
}
