import P5Sketch from "./P5Sketch";

export default function P5Canvas({song}) {
    console.log("P5Canvas");
    return (
        <div className="p5Canvas">
            {/* <p>p5Canvas. Song: {song}</p> */}
            <P5Sketch />
        </div>
    );
};
