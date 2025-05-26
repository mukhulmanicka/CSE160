class Sphere {
    constructor() {
        this.color = [0.8, 0.2, 0.2, 1.0];
        this.matrix = new Matrix4();
        this.textureNum = -2; // Default to color, can be changed
        this.positionVBO = null;
        this.normalVBO = null;
        this.uvVBO = null; // Can add UVs later if needed
        this.indexVBO = null;
        this.vertexCount = 0;
        this.indexCount = 0;

        this.buffersInitialized = false;
        this.latitudeBands = 30;
        this.longitudeBands = 30;
        this.radius = 1.0;
    }

    initBuffers() {
        if (this.buffersInitialized || !gl) return;

        let vertices = [];
        let normals = [];
        let uvs = [];
        let indices = [];

        for (let latNumber = 0; latNumber <= this.latitudeBands; latNumber++) {
            let theta = latNumber * Math.PI / this.latitudeBands;
            let sinTheta = Math.sin(theta);
            let cosTheta = Math.cos(theta);

            for (let longNumber = 0; longNumber <= this.longitudeBands; longNumber++) {
                let phi = longNumber * 2 * Math.PI / this.longitudeBands;
                let sinPhi = Math.sin(phi);
                let cosPhi = Math.cos(phi);

                let x = cosPhi * sinTheta;
                let y = cosTheta;
                let z = sinPhi * sinTheta;
                let u = 1 - (longNumber / this.longitudeBands);
                let v = 1 - (latNumber / this.latitudeBands);

                normals.push(x);
                normals.push(y);
                normals.push(z);
                uvs.push(u);
                uvs.push(v);
                vertices.push(this.radius * x);
                vertices.push(this.radius * y);
                vertices.push(this.radius * z);
            }
        }

        for (let latNumber = 0; latNumber < this.latitudeBands; latNumber++) {
            for (let longNumber = 0; longNumber < this.longitudeBands; longNumber++) {
                let first = (latNumber * (this.longitudeBands + 1)) + longNumber;
                let second = first + this.longitudeBands + 1;
                indices.push(first);
                indices.push(second);
                indices.push(first + 1);

                indices.push(second);
                indices.push(second + 1);
                indices.push(first + 1);
            }
        }

        this.vertexCount = vertices.length / 3;
        this.indexCount = indices.length;

        // Position Buffer
        this.positionVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Normal Buffer
        this.normalVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        // UV Buffer (Optional but good to have)
        this.uvVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

        // Index Buffer
        this.indexVBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        this.buffersInitialized = true;
    }

    render() {
        if (!this.buffersInitialized) {
            this.initBuffers();
            if (!this.buffersInitialized) { console.error("Sphere.render() failed: Buffers not initialized."); return; }
        }

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, this.color[0], this.color[1], this.color[2], this.color[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        var normalMatrix = new Matrix4();
        normalMatrix.setInverseOf(this.matrix);
        normalMatrix.transpose();
        gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

        // Positions
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionVBO);
        gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Position);

        // Normals
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalVBO);
        gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_Normal);

        // UVs
        if (a_UV >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.uvVBO);
            gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(a_UV);
        }

        // Bind Index Buffer and Draw
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexVBO);
        gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);

        // Disable arrays
        gl.disableVertexAttribArray(a_Position);
        gl.disableVertexAttribArray(a_Normal);
        if (a_UV >= 0) gl.disableVertexAttribArray(a_UV);
    }
}