import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree, extend } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Environment, OrbitControls, Plane, Shadow, SpotLight, useTexture, SoftShadows, Cylinder } from '@react-three/drei'
import * as THREE from 'three';
import { Box } from '@mui/material';
import fetchSpotifyData from '../lib/spotifyUtils';

/**
 * Creates a cylinder that spans from start to end position with given dimensions and color.
 * 
 * @param {THREE.Vector3} start - Starting position (x, y, z).
 * @param {THREE.Vector3} end - Ending position (x, y, z).
 * @param {number} radius - Radius of the cylinder.
 * @param {string} color - Color of the cylinder.
 * @param {number} radialSegments - Number of segmented faces around the circumference of the cylinder.
 * @returns JSX element representing the cylinder.
 */
function PositionedCylinder({ start, end, radius, height, color, radialSegments }) {
    // Calculate the midpoint for positioning
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    
    // Calculate the cylinder's orientation
    const orientation = new THREE.Matrix4(); // a new orientation matrix to offset pivot
    const offsetRotation = new THREE.Matrix4(); // a matrix to fix pivot rotation
    const upVector = new THREE.Vector3(0, 1, 0); // default cylinder orientation
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    orientation.lookAt(start, end, upVector);
    offsetRotation.makeRotationX(Math.PI / 2); // adjust for THREE.CylinderGeometry's default orientation
    orientation.multiply(offsetRotation);

    // Extract quaternion
    const rotation = new THREE.Quaternion().setFromRotationMatrix(orientation);

    return (
        <mesh
            position={[midPoint.x, midPoint.y, midPoint.z]}
            quaternion={rotation}
        >
            <cylinderGeometry
                args={[radius, radius, length, radialSegments]}
            />
            <meshStandardMaterial
                color={color}
            />
        </mesh>
    );
}

function createThreeJsTextureFromBase64(imageUrl) {
    const loader = new THREE.TextureLoader();
    // Load texture directly from base64 URL
    const texture = loader.load(imageUrl);

    // Optional: Configure texture parameters if necessary
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;

    return texture;
}

export function SongCylinderCanvas(color, trackId, accessToken){
	if (!accessToken) {
        console.error('Invalid Access Token');
        return (
			<p>Invalid Access Token</p>
		);
    }
    const songData = fetchSpotifyData(trackId, accessToken);
	return(
		<Canvas
			id="songviz-canvas-threejs"
		>
			<CameraController targetPosition={[5, 5, 5]} targetFov={40} />
				<SoftShadows size={200} focus={64} samples={60} />
                <ambientLight intensity={1.6}  color="#ffffff" />
                <spotLight
					position={[1, 10, 1]}
					angle={0.2}
					penumbra={1}
					intensity={100}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={50}
					shadow-camera-near={0.5}
					shadow-bias={-0.0001}
				/>
                <pointLight position={[4, 4, 4]} intensity={30} />
                <GroundPlane />
                <PositionedCylinder
					start={new THREE.Vector3(5, 4, 3)}
					end={new THREE.Vector3(3, 2, 1)}
					radius={0.2}
					height={10}
					color="purple"
					radialSegments={32}
				/>
				<PositionedCylinder
					start={new THREE.Vector3(0, 0, 0)}
					end={new THREE.Vector3(0, 5, 0)}
					radius={0.5}
					height={5}
					color="yellow"
					radialSegments={32}
				/>
				<OrbitControls minDistance={3} maxDistance={10} />
		</Canvas>
	)
}

function createSongTexture(color, trackId, accessToken) {
	console.log("createSongTexture");
	console.log(color, trackId);
	
	if (!accessToken) {
        console.error('Invalid Access Token');
        return (
			<p>Invalid Access Token</p>
		);
    }
    // const songData = fetchSpotifyData(trackId, accessToken).then((data) => {
	// 	console.log("Song Info", songData);
	// 	// console.log("Name", songData.name);
	// 	// console.log("Artists", songData.artists.map(artist => artist.name).join(', '));
	// });
	
    let canvas = document.getElementById('song-design-canvas');
	if(!canvas){
		canvas = document.createElement('canvas')
		canvas.id = 'song-design-canvas';
	}
	
    const ctx = canvas.getContext('2d');
    canvas.width = 4096;
    canvas.height = 4096;

    // Define colors and their corresponding fill styles
    const colorMap = {
        'Red': '#FF0000',
        'Blue': '#0000FF',
        'Beige': '#E1C699',
        'Black': '#050505'
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

	if (trackId) {
        console.log("Printing", trackId);
		ctx.fillText(trackId, textX, textY);
    }


    // const artistsWidth = ctx.measureText(artists).width;
    // const artistsX = textX + (textWidth - artistsWidth) / 2; // Center the text horizontally
    // const artistsY = songNameY + 150; // Some vertical padding between texts
	// ctx.fillText(artists, artistsX, artistsY);
    // Draw text within the specified area

	// document.body.appendChild(canvas);
    
	return new THREE.CanvasTexture(canvas);
}

function createCanvasTexture(color) {
	let canvas = document.getElementById('plain-canvas');
	if(!canvas){
		canvas = document.createElement('canvas')
		canvas.id = 'plain-canvas';
		document.body.appendChild(canvas);
	}
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

	if(color == "Red"){
		ctx.fillStyle = '#fa0412';
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

	const gltf = useLoader(GLTFLoader, "/models/tshirt-final.glb");
	console.log("GLTF", gltf);
	const textureRef = useRef();

	// const external_texture = fetch("http://localhost:8001/generateCanvas.php?trackId=sdjfkjsbf")
	// 				.then((data) => {
	// 					return createThreeJsTextureFromBase64(data.image);
	// 				})
	// console.log("external texture", external_texture);

	const backgroundTexture = useLoader(THREE.TextureLoader, "/models/textures/diffusion-test.png");
	backgroundTexture.flipY = false;

	const normalTexture = useLoader(THREE.TextureLoader, "/models/textures/normal-final.jpeg");
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
		// if(songCanvasTexture){songCanvasTexture.flipY = false};
		
		textureRef.current = canvasTexture;
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
			if (child.isMesh && child.name === "Tshirt_final1") {
				console.log("Mesh found: ", child);
				const material = new THREE.MeshStandardMaterial({
					side: THREE.DoubleSide,
					color: 'white', // Base color of the material
					map: canvasTexture, // The diffuse texture map
					normalMap: normalTexture, // The normal map
					roughness: 1,
					metalness: 0.2
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
				position={[0, 1, 0]}
				scale={[2.5, 2.5, 2.5]}
				children-0-castShadow
				castShadow
				receiveShadow
			/>
		</>
	);
}

// Ensure the ShadowMaterial is recognized by React Three Fiber
extend({ ShadowMaterial: THREE.ShadowMaterial });

function GroundPlane() {
    const meshRef = useRef();
    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -2, 0]}
            receiveShadow={true}
        >
            <planeGeometry args={[200, 200]} />
            {/* Apply ShadowMaterial */}
            <shadowMaterial attach="material" opacity={0.5} />
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
    // useFrame(() => {
    //     // Smoothly interpolate the camera's position
    //     camera.position.lerp(targetPos.current, 0.1);

    //     // Smoothly interpolate the camera's field of view
    //     if (camera.fov !== targetFovRef.current) {
    //         camera.fov += (targetFovRef.current - camera.fov) * 0.1;
    //         camera.updateProjectionMatrix();
    //     }

    //     // Look at the center or a specific point
    //     camera.lookAt(new THREE.Vector3(0, 0, 0));  // Adjust this as needed
    // });
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
				shadows={{ type: THREE.PCFSoftShadowMap }}
            >
				<CameraController targetPosition={camerapos} targetFov={fov} />
				<SoftShadows size={200} focus={64} samples={60} />
                <ambientLight intensity={2}  color="#ffffff" />
                <spotLight
					position={[5, 10, 5]}
					angle={0.5}
					penumbra={1}
					intensity={100}
					castShadow
					shadow-mapSize-width={2048}
					shadow-mapSize-height={2048}
					shadow-camera-far={50}
					shadow-camera-near={0.5}
					shadow-bias={-0.0001}
				/>
                {/* <pointLight position={[4, 4, 4]} intensity={1} /> */}
                <GroundPlane />
                <Tshirt
					color={color}
					trackId={songId}
					accessToken={accessToken}
				/>
				{controls ? <OrbitControls minDistance={2} maxDistance={10} /> : <></>}
				
            </Canvas>
        </Box>
		
	)
}