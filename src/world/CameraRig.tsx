import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { lerpAngle } from './Player';

const tmp = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const t = useRef(0);
  const sun = useRef<THREE.DirectionalLight>(null);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = useGame.getState();
    let fx = 0,
      fz = 0;
    if (s.screen === 'intro') {
      fx = 150;
      fz = -168;
    } else if (s.screen !== 'playing') {
      t.current += dt * 0.04;
      const a = t.current;
      camera.position.set(Math.sin(a) * 120 + 20, 55 + Math.sin(a * 2) * 8, Math.cos(a) * 120 - 40);
      camera.lookAt(0, 8, -60);
      fx = 0;
      fz = -60;
    } else {
      let tx: number, tz: number, ty: number;
      const v = runtime.vehicle ? runtime.vehicles.find((c) => c.id === runtime.vehicle) : null;
      if (v) {
        tx = v.x;
        tz = v.z;
        ty = 1.3;
        if (performance.now() - runtime.cam.lastMouse > 1400 && Math.abs(v.speed) > 1) {
          const desired = v.speed >= 0 ? v.yaw + Math.PI : v.yaw;
          runtime.cam.yaw = lerpAngle(runtime.cam.yaw, desired, 1 - Math.exp(-dt * 2.5));
          runtime.cam.pitch += (0.28 - runtime.cam.pitch) * (1 - Math.exp(-dt * 2));
        }
      } else {
        tx = runtime.player.x;
        tz = runtime.player.z;
        ty = 1.75;
      }
      let dist = runtime.cam.dist;
      if (v) dist += 3.5;
      if (runtime.insideSuper && !v) dist = Math.min(dist, 5);
      const { yaw, pitch } = runtime.cam;
      tmp.set(tx + Math.sin(yaw) * Math.cos(pitch) * dist, ty + Math.sin(pitch) * dist + 0.6, tz + Math.cos(yaw) * Math.cos(pitch) * dist);
      if (runtime.insideSuper && !v) tmp.y = Math.min(tmp.y, 7.8);
      tmp.y = Math.max(tmp.y, 0.6);
      // evita a câmera atravessar o avião estacionado na base aérea
      if (tmp.x > 132 && tmp.x < 168 && tmp.z > -190 && tmp.z < -160) tmp.y = Math.max(tmp.y, 6.8);
      camera.position.lerp(tmp, 1 - Math.exp(-dt * 12));
      camera.lookAt(tx, ty + 0.3, tz);
      fx = tx;
      fz = tz;
    }
    // sombra acompanha o foco da câmera
    if (sun.current) {
      sun.current.position.set(fx + 60, 90, fz + 40);
      sun.current.target.position.set(fx, 0, fz);
      sun.current.target.updateMatrixWorld();
    }
  });
  return (
    <directionalLight
      ref={sun}
      castShadow
      intensity={2.2}
      color="#fff1d6"
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-70}
      shadow-camera-right={70}
      shadow-camera-top={70}
      shadow-camera-bottom={-70}
      shadow-camera-near={10}
      shadow-camera-far={260}
      shadow-bias={-0.0004}
    />
  );
}
