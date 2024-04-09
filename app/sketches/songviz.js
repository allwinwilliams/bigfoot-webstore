function setup() {
  createCanvas(400, 600, WEBGL);
  noStroke();
}

function draw() {
  background(0);
  fill("red")
  rect(0,0,width, height);
  rect(-100,-200,10, 20);
}