// import fs from "fs";

export const getImage = async (prompt) => {
    const path = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";
  
    const headers = {
      "Content-Type": "application/json",
      "Accept": "*/*",
      "Authorization": "Bearer sk-8ssAMA4Sp8aRZC7czSRhUFOcWz0NwpefLiffJQvPRJ0889y5"
    };
  
    let body = {
      steps: 40,
      width: 1024,
      height: 1024,
      seed: 0,
      cfg_scale: 5,
      samples: 1,
      text_prompts: [
        {
          "text": "dancing cat",
          "weight": 1
        },
        {
          "text": "blurry, bad",
          "weight": -1
        },
      ],
    };
  
    let response = fetch(
      path,
      {
        headers: new Headers(headers),
        method: "POST",
        body: JSON.stringify(body),
      }
    );
    
    console.log(JSON.stringify(body));
    
    let responseJSON = "Waiting for response";
    responseJSON = await response;
    console.log(responseJSON);

    if (!response.ok) {
      console.log("ERROR");
      throw new Error(`Non-200 response: ${await response.text()}`)
    }
    
  
    responseJSON.artifacts.forEach((image, index) => {
      console.log(image);
      // fs.writeFileSync(
      //   `./out/txt2img_${image.seed}.png`,
      //   Buffer.from(image.base64, 'base64')
      // )
    })
  };

  export default function AIShirtCanvas({prompt}){
    console.log("Prompt received: " + prompt);
    getImage(prompt);
    return (
        <div className="ai-canvas-container">
            <img src = "https://allwinwilliams.com/assets/icon.png" />
        </div>
    )
  }