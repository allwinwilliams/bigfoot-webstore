let time = 0;

function setup() {
  p5Canvas = createCanvas(128, 128, WEBGL);
  p5Canvas = p5Canvas.canvas;
  // frameRate(1);
  translate(0,0);
}

function draw() {
  background(220);
  fill("red");
  circle(mouseX-50, mouseY-50, 100);
  fill("green");
  circle(-mouseY, -mouseX, abs(mouseX));

  // material.map = new THREE.CanvasTexture( p5Canvas.canvas );
}
