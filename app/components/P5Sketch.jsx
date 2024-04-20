import React, { useEffect, useRef } from 'react';


const P5Sketch = () => {
    console.log("p5 sketch component");
    const renderRef = useRef();

    useEffect(() => {
        console.log("Window type");
        if (typeof window !== 'undefined') {  // Ensures this code only runs in the browser
            import('p5').then((Module) => {
                const p5 = Module.default;
                console.log("p5 loaded", p5);  // Check if p5 is loaded
                new p5((p) => {
                    p.setup = () => {
                        console.log("Setting up canvas");  // Log setup
                        p.createCanvas(500, 400).parent(renderRef.current);
                        p.background(0);
                    };

                    p.draw = () => {
                        p.background(0);
                        p.ellipse(50, 50, 80, 80);
                    };
                });
            }).catch(err => console.error('Error loading p5', err));
        }
    }, []);

    return <div ref={renderRef}></div>;
};

export default P5Sketch;