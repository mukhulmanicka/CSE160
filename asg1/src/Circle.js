class Circle {
    constructor() {
      this.type = 'circle';
      this.position = [0.0, 0.0, 0.0];
      this.color = [1.0, 1.0, 1.0, 1.0];
      this.size = 5.0;
      this.segments = 10;
    }
  
    render() {
      const xy = this.position;
      const rgba = this.color;
      const size = this.size;
  
      gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
      gl.uniform1f(u_Size, size);
  
      const d = size / 200.0;
      const angleStep = 360 / this.segments;
  
      for (let angle = 0; angle < 360; angle += angleStep) {
        const rad1 = (angle) * Math.PI / 180;
        const rad2 = (angle + angleStep) * Math.PI / 180;
        const cx = xy[0];
        const cy = xy[1];
        const vec1 = [Math.cos(rad1) * d, Math.sin(rad1) * d];
        const vec2 = [Math.cos(rad2) * d, Math.sin(rad2) * d];
        const pt1 = [cx + vec1[0], cy + vec1[1]];
        const pt2 = [cx + vec2[0], cy + vec2[1]];
        drawTriangle([
          cx,    cy,
          pt1[0], pt1[1],
          pt2[0], pt2[1]
        ]);
      }
    }
  }
  