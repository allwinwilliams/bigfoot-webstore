import TshirtCanvas from '../components/TshirtCanvas';
import React from 'react';
import { Layout } from '../components/Layout';
import P5Sketch from '../components/P5Sketch'; // Assuming the P5Sketch component is saved here

export default function Customizer({color}){
	console.log("customiser view");
	return (
		<Layout> 
            <div className="threejs-canvas">

                <TshirtCanvas 
                    color="Black"
                />
                <P5Sketch 
                    songId="Aosdns"
                />
            </div>
        </Layout>
	)
}