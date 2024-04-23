import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Environment, OrbitControls, Plane, Shadow, SpotLight, useTexture } from '@react-three/drei'
import * as THREE from 'three';
import { Box } from '@mui/material';
import fetchSpotifyData from '../lib/spotifyUtils';

function createSongTexture(color, trackId, accessToken) {
	console.log("createSongTexture");
	console.log(color, trackId);
	if (!trackId) {
        console.error('Invalid track ID');
        return;
    }
	if (!accessToken) {
        console.error('Invalid Access Token');
        return;
    }
    // const songData = await fetchSpotifyData(trackId, accessToken);
	
    const canvas = document.createElement('canvas');
	canvas.id = 'song-design-canvas';
    const ctx = canvas.getContext('2d');
    canvas.width = 4096;
    canvas.height = 4096;

    // Define colors and their corresponding fill styles
    const colorMap = {
        'Red': '#FF0000',
        'Blue': '#0000FF',
        'Beige': '#E1C699',
        'Black': '#000000'
    };

    // Set background color based on input using a default color if not specified
    const fillColor = colorMap[color] || '#FFFFFF'; 
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text position constraints
    const textX = 400;
    const textY = 2400;

    // Check if songData is valid and set text content
	// songData ? console.log("Song data for createSongTexture CANVAS", songData) : console.log("Waiting for songdata");
    // const songName = songData ? songData.name : 'Unknown Song';
    // const artists = songData ? songData.artists.map(artist => artist.name).join(', ') : 'Unknown Artist';

    // Set text styles
    ctx.font = '80px Arial';
    ctx.fillStyle = 'white';

	console.log("Printing", trackId);
    
	ctx.fillText(trackId, textX, textY);

    // const artistsWidth = ctx.measureText(artists).width;
    // const artistsX = textX + (textWidth - artistsWidth) / 2; // Center the text horizontally
    // const artistsY = songNameY + 150; // Some vertical padding between texts
	// ctx.fillText(artists, artistsX, artistsY);
    // Draw text within the specified area

	document.body.appendChild(canvas);
    
	return new THREE.CanvasTexture(canvas);
}

function createCanvasTexture(color) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	// Set canvas size
	canvas.width = 4096;
	canvas.height = 4096;
	
	// Draw your texture here
	console.log(color);
	console.log("Creating texture..");

	if(color == "Beige"){
		ctx.fillStyle = '#E1C699';
	}

	if(color == "Black"){
		ctx.fillStyle = '#111';
	}
	
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.fillText('Allwin Williams', 100, 500);
	
	ctx.font = '100px Arial';
	ctx.fillStyle = 'white';

	// Convert canvas to texture
	return new THREE.CanvasTexture(canvas);
}

export function Tshirt({color, trackId, accessToken}) {

	console.log("canvas color: ", color);
	console.log("trackId: ", trackId);
	console.log("access Token: ", accessToken);

	const gltf = useLoader(GLTFLoader, "/models/tshirt-apr22.glb");
	console.log("GLTF", gltf);
	const textureRef = useRef();
  
	const backgroundTexture = useLoader(THREE.TextureLoader, "/models/textures/diffusionapr22.jpg");
	backgroundTexture.flipY = false;

	const normalTexture = useLoader(THREE.TextureLoader, "/models/textures/normalapr22.jpg");
	normalTexture.wrapS = THREE.RepeatWrapping;
	normalTexture.wrapT = THREE.RepeatWrapping;
	normalTexture.flipY = false; 

	const designTexture = useLoader(THREE.TextureLoader, "/models/textures/somedesign.png");
	designTexture.flipY = false;

	const gridTexture = useLoader(THREE.TextureLoader, "/models/textures/grid.png");
	gridTexture.flipY = false;

	useEffect(() => {
		// Create a new canvas texture with the current color
		const canvasTexture = createCanvasTexture(color);
		const songCanvasTexture = createSongTexture(color, trackId, accessToken);
		if(songCanvasTexture){songCanvasTexture.flipY = false};
		
		textureRef.current = songCanvasTexture;

		// textureRef.background = backgroundTexture;
		// textureRef.designArea = designTexture;
		// Apply the canvas texture to the model
		gltf.scene.traverse((child) => {
			if (child.isMesh) {
			// child.material.map = textureRef.current;
			// child.material.map = backgroundTexture;
			// child.material.needsUpdate = true;
			
			child.castShadow = true;
			child.receiveShadow = true;
			if (child.isMesh && child.name === "Tshirt1") {
				console.log("Mesh found: ", child);
				const material = new THREE.MeshStandardMaterial({
					side: THREE.DoubleSide,
					color: 'white', // Base color of the material
					map: textureRef.current, // The diffuse texture map
					normalMap: normalTexture, // The normal map
				});
				child.material = material;
				child.material.needsUpdate = true;
			}

			// if(child.name == "Tshirt02"){
			// 	console.log("background mesh", child)
			// 	child.material.map = backgroundTexture;
			// }
			// if(child.name == "Tshirt02_1"){
			// 	console.log("design mesh", child)
			// 	child.material.map = designTexture;
			// }
			}
	});

	// Clean up the texture on component unmount
	return () => {
		if (textureRef.current) {
		textureRef.current.dispose();
		// designTexture.dispose();
		}
		backgroundTexture.dispose();
		normalTexture.dispose();
		designTexture.dispose();
		gridTexture.dispose();
	};
	}, [color, gltf]);
  
    // useFrame(
	// 	(state, delta) => 
	// 	(gltf.scene.rotation.y += delta * 0.1)
	// )
	return (
		<>
			<primitive
				object={gltf.scene}
				position={[0, 0.9, 0]}
				scale={[0.12, 0.12, 0.12]}
				children-0-castShadow
				castShadow
				receiveShadow
			/>
		</>
	);
}

function GroundPlane() {
    const meshRef = useRef();
    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2, 0]} 
            receiveShadow={true} 
        >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#ffffff" />
        </mesh>
    );
}

function CameraController({ targetPosition, targetFov }) {
    const { camera } = useThree();
    const targetPos = useRef(new THREE.Vector3(...targetPosition));
    const targetFovRef = useRef(targetFov);

    // Update target positions on prop changes
    useEffect(() => {
        targetPos.current.set(...targetPosition);
        targetFovRef.current = targetFov;
    }, [targetPosition, targetFov]);

    // Animate camera position and fov
    useFrame(() => {
        // Smoothly interpolate the camera's position
        camera.position.lerp(targetPos.current, 0.1);

        // Smoothly interpolate the camera's field of view
        if (camera.fov !== targetFovRef.current) {
            camera.fov += (targetFovRef.current - camera.fov) * 0.1;
            camera.updateProjectionMatrix();
        }

        // Look at the center or a specific point
        camera.lookAt(new THREE.Vector3(0, 0, 0));  // Adjust this as needed
    });

    return null;
}

export default function TshirtCanvas({
	color, songId = '', accessToken = 'nope', trackId = '',
	camerapos=[5, 5, 5], fov = 50, width = '100%', height = '60vh', controls = true
}){
	return (
		<Box sx={{ width: width, height: height, overflow: 'hidden' }}>
            <Canvas 
                id="threejs-canvas"
                shadows
            >
				<CameraController targetPosition={camerapos} targetFov={fov} />
                <ambientLight intensity={1.2}  color="#ffffff" />
                <spotLight
                    position={[1, 10, 1]} 
                    angle={0.3} 
                    penumbra={1.2}
                    intensity={60} 
                    castShadow
                    shadow-mapSize-width={1024}  
                    shadow-mapSize-height={1024}
                    shadow-camera-far={15} 
                    shadow-camera-near={1}
                />
                <pointLight position={[4, 4, 4]} intensity={4} />
                <GroundPlane />
                <Tshirt
					color={color}
					trackId={songId}
					accessToken={accessToken}
				/>
				<OrbitControls />
                
            </Canvas>
        </Box>
		
	)
}