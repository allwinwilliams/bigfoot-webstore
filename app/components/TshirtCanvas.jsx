import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls, Plane, Shadow, SpotLight } from '@react-three/drei'
import * as THREE from 'three';
import { Box } from '@mui/material';



function createCanvasTexture(color) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	// Set canvas size
	canvas.width = 256;
	canvas.height = 256;
	
	// Draw your texture here
	console.log(color);
	console.log("Creating texture..");

	if(color == "Beige"){
		ctx.fillStyle = '#E1C699';
	}

	if(color == "Black"){
		ctx.fillStyle = '#111';
	}
	
	ctx.fillText('Allwin Williams', 10, 50);

	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.font = '24px Arial';
	ctx.fillStyle = 'white';

	// Convert canvas to texture
	return new THREE.CanvasTexture(canvas);
}

export function Tshirt({color}) {

  const gltf = useLoader(GLTFLoader, "/models/tshirt-test.glb");
  const textureRef = useRef();
  
  const backgroundTexture = useLoader(THREE.TextureLoader, "/models/textures/background.png");
  const designTexture = useLoader(THREE.TextureLoader, "/models/textures/somedesign.png");

  useEffect(() => {
    // Create a new canvas texture with the current color
    const canvasTexture = createCanvasTexture(color);

	textureRef.current = canvasTexture;

    // textureRef.background = backgroundTexture;
	// textureRef.designArea = designTexture;
    // Apply the canvas texture to the model
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = textureRef.current;
        child.material.needsUpdate = true;
		
		child.castShadow = true;
		child.receiveShadow = true;
	

		if(child.name == "Tshirt02"){
			console.log("background mesh", child)
			child.material.map = backgroundTexture;
		}
		if(child.name == "Tshirt02_1"){
			console.log("design mesh", child)
			child.material.map = designTexture;
		}
      }
    });

    // Clean up the texture on component unmount
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
		backgroundTexture.dispose();
		designTexture.dispose();
      }
    };
  }, [color, gltf]);
  
    // useFrame(
	// 	(state, delta) => 
	// 	(gltf.scene.rotation.y += delta * 0.1)
	// )
	return (
		<primitive
			object={gltf.scene}
			position={[0, -1.5, 0]}
			scale={[15, 15, 15]}
			children-0-castShadow
			castShadow
			receiveShadow
		/>
	);
}

function GroundPlane() {
    const meshRef = useRef();
    return (
        <mesh
            ref={meshRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -1.6, 0]} 
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

export default function TshirtCanvas({color, song, camerapos=[5, 5, 5], fov = 50, width = '100%', height = '60vh', controls = true}){
	console.log("canvas color: ", color);
	console.log("Song: ", song);
	return (
		<Box sx={{ width: width, height: height, overflow: 'hidden' }}>
            <Canvas 
                id="threejs-canvas"
                shadows
            >
				<CameraController targetPosition={camerapos} targetFov={fov} />
                <ambientLight intensity={1}  color="#ffffff" />
                <spotLight
                    position={[1, 10, 1]} 
                    angle={0.3} 
                    penumbra={1.2}
                    intensity={50} 
                    castShadow
                    shadow-mapSize-width={1024}  
                    shadow-mapSize-height={1024}
                    shadow-camera-far={15} 
                    shadow-camera-near={1}
                />
                <pointLight position={[4, 4, 4]} intensity={2} />
                <GroundPlane />
                <Tshirt color={color} />
				<OrbitControls />
                
            </Canvas>
        </Box>
		
	)
}