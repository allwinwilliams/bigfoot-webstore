import React, { useEffect } from 'react';
import p5 from 'p5';

const P5Sketch = ({songId}) => {
  console.log("SongID", songId);
  useEffect(() => {
    let myP5;

    const sketch = (p) => {
      // p5.js setup function
      p.setup = () => {
        p.createCanvas(400, 400);
        p.background(220);
      };

      // p5.js draw function
      p.draw = () => {
        p.fill('red');
        p.circle(p.width / 2, p.height / 2, 50);
      };
    };

    // Create a new p5 instance
    myP5 = new p5(sketch, document.getElementById('p5-container'));

    // Cleanup function to remove the sketch when the component unmounts
    return () => {
      myP5.remove();
    };
  }, []);

  return <div id="p5-container"></div>;
};

export default P5Sketch;