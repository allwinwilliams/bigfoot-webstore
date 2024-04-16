import React, { useEffect, useRef, useState } from 'react';

function P5Wrapper() {
    const sketchRef = useRef(null);

    useEffect(() => {
        // This check ensures we're only attempting to import p5 on the client side
        if (typeof window !== 'undefined') {
            import('p5').then((module) => {
                const P5 = module.default;

                // Create a new p5 instance passing the sketch function and the target container
                const myP5 = new P5(sketch, sketchRef.current);

                // Cleanup function to remove the sketch when the component unmounts
                return () => {
                    myP5.remove();
                };
            });
        }

        // Sketch definition can also be moved inside the dynamic import if required
        function sketch(p) {
            p.setup = () => {
                p.createCanvas(400, 400);
                p.background(220);
            };

            p.draw = () => {
                if (p.mouseIsPressed) {
                    p.fill(0);
                } else {
                    p.fill(255);
                }
                p.ellipse(p.mouseX, p.mouseY, 80, 80);
            };
        }
    }, []);

    // The div will be the container for the p5 sketch.
    return <div ref={sketchRef}></div>;
}

export default function P5Canvas({song}) {
    console.log("P5Canvas");
    return (
        <div className="p5Canvas">
            <p>p5Canvas. Song: {song}</p>
            <P5Wrapper />
        </div>
    );
};
