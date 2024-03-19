import { createRoot } from 'react-dom/client'
import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useLoader, useThree } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from '@react-three/drei'
import TshirtModel from '../assets/models/tshirt-new.glb'
import * as THREE from 'three';

function createCanvasTexture(color) {
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');
	
	// Set canvas size
	canvas.width = 256;
	canvas.height = 256;
	
	// Draw your texture here
	console.log(color);
	console.log("Creating texture..");
	ctx.fillStyle = '#fff';
	ctx.fillText('Allwin Williams', 10, 50);

	if(color == "Beige"){
		ctx.fillStyle = '#E1C699';
	}

	if(color == "Black"){
		ctx.fillStyle = '#111';
	}
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	ctx.font = '24px Arial';
	ctx.fillStyle = 'white';

	// Convert canvas to texture
	return new THREE.CanvasTexture(canvas);
  }

export function Tshirt({color}) {
	const gltf = useLoader(GLTFLoader, "/models/tshirt-new.glb");
	  const textureRef = useRef();

  useEffect(() => {
    // Create a new canvas texture with the current color
    const canvasTexture = createCanvasTexture(color);
    textureRef.current = canvasTexture;

    // Apply the canvas texture to the model
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material.map = textureRef.current;
        child.material.needsUpdate = true;
      }
    });

    // Clean up the texture on component unmount
    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
      }
    };
  }, [color, gltf]);

    useFrame((state, delta) => (gltf.scene.rotation.y += delta * 0.2))
	return (
		<primitive
        object={gltf.scene}
        position={[0, 1, 0]}
		scale={[1.2, 1.2, 1.2]}
        children-0-castShadow
      />
	);
}

export default function TshirtCanvas({color}){
	console.log("canvas color: " + color);
	return (
		<Canvas id="threejs-canvas">
			{/* <PerspectiveCamera position={[5, 5, 5]} makeDefault /> */}
			<ambientLight intensity={Math.PI / 2} />
			<spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} decay={0} intensity={Math.PI} />
			<pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
			<Tshirt color={color} />
			<OrbitControls minDistance={2} maxDistance={5}/>
		</Canvas>
	)
}