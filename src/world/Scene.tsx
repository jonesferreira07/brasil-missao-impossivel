import { Sky } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { Airport, IntroScene } from './Airport';
import { CameraRig } from './CameraRig';
import { City, useHealth } from './City';
import { Dynamic } from './Dynamic';
import { GameLoop } from './GameLoop';
import { Landmarks } from './Landmarks';
import { MissionActors } from './MissionActors';
import { Pedestrians } from './Pedestrians';
import { Player } from './Player';
import { Supermarket } from './Supermarket';
import { Traffic } from './Traffic';
import { Vehicles } from './Vehicles';

function Atmosphere() {
  const h = useHealth();
  const { scene } = useThree();
  const fog = new THREE.Color('#b39c7c').lerp(new THREE.Color('#bcd3e6'), h);
  useEffect(() => {
    scene.fog = new THREE.Fog(fog, 70 + h * 60, 330 + h * 120);
    scene.background = fog;
  }, [h]);
  return (
    <>
      <Sky distance={4500} sunPosition={[120, 60 + h * 40, 80]} turbidity={12 - h * 9} rayleigh={0.6 + h * 1.6} mieCoefficient={0.01} mieDirectionalG={0.85} />
      <hemisphereLight args={[h > 0.5 ? '#cfe6ff' : '#e8d3b0', '#5a5040', 0.9 + h * 0.4]} />
      <ambientLight intensity={0.25} />
    </>
  );
}

export function Scene() {
  return (
    <>
      <Atmosphere />
      <CameraRig />
      <City />
      <Landmarks />
      <Supermarket />
      <Dynamic />
      <Traffic />
      <Pedestrians />
      <MissionActors />
      <Airport />
      <IntroScene />
      <Vehicles />
      <Player />
      <GameLoop />
    </>
  );
}
