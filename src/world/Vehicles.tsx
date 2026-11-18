import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { runtime, type VehicleState } from '../game/runtime';
import { addObstacle, carCircles, removeObstacle, resolveObstacles } from '../game/obstacles';
import { engineUpdate } from '../game/sfx';
import { useGame } from '../game/store';
import { resolveCircle } from './layout';
import { Car } from './Car';
import { isBlocked } from './Player';

let lastWarn = 0;
function Drivable({ v }: { v: VehicleState }) {
  const g = useRef<THREE.Group>(null);
  const len = v.kind === 'sedan' ? 4.3 : 3.6;
  const own = useMemo(() => [addObstacle(v.x, v.z, 1.0, 'car'), addObstacle(v.x, v.z, 1.0, 'car')], [v]);
  const skip = useMemo(() => new Set(own), [own]);
  useEffect(() => () => own.forEach(removeObstacle), [own]);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const driving = runtime.vehicle === v.id;
    const k = runtime.keys;
    const blocked = isBlocked();
    let acc = 0,
      brake = 0,
      steer = 0;
    if (driving && !blocked) {
      if (k.has('KeyW') || k.has('ArrowUp')) acc = 1;
      if (k.has('KeyS') || k.has('ArrowDown')) brake = 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) steer += 1;
      if (k.has('KeyD') || k.has('ArrowRight')) steer -= 1;
      if (runtime.joy.y < -0.25) acc = 1;
      if (runtime.joy.y > 0.35) brake = 1;
      if (Math.abs(runtime.joy.x) > 0.12) steer -= runtime.joy.x;
    }
    const max = v.kind === 'sedan' ? 30 : 24;
    if (acc) v.speed += (v.speed < 0 ? 26 : 13) * dt;
    if (brake) v.speed -= (v.speed > 0 ? 24 : 9) * dt;
    if (!acc && !brake) v.speed *= 1 - 0.9 * dt;
    if (driving && k.has('Space')) v.speed *= 1 - 3.5 * dt;
    v.speed = Math.max(-9, Math.min(max, v.speed));
    if (Math.abs(v.speed) < 0.05 && !acc && !brake) v.speed = 0;
    const grip = Math.min(1, Math.abs(v.speed) / 7);
    v.yaw += steer * 1.8 * dt * grip * Math.sign(v.speed || 1);
    v.x += Math.sin(v.yaw) * v.speed * dt;
    v.z += Math.cos(v.yaw) * v.speed * dt;
    if (resolveCircle(v, 1.7)) v.speed *= 0.6;
    if (driving) {
      const hit = resolveObstacles(v, 1.6, skip);
      if (hit) {
        if (hit.kind === 'ped' || hit.kind === 'npc') {
          if (Math.abs(v.speed) > 3 && performance.now() - lastWarn > 4000) {
            lastWarn = performance.now();
            useGame.getState().notify('Freada brusca! Presidente, pedestre não é obstáculo de campanha.', 'bad');
          }
          v.speed = 0;
        } else v.speed *= 0.3;
      }
    }
    carCircles(own, v.x, v.z, v.yaw, len, 1.0);
    if (g.current) {
      g.current.position.set(v.x, 0, v.z);
      g.current.rotation.y = v.yaw;
      g.current.rotation.z = -steer * grip * 0.03;
    }
    if (driving) engineUpdate(true, v.speed);
  });
  return <Car ref={g} color={v.color} kind={v.kind} flag={v.kind === 'sedan'} />;
}

export function Vehicles() {
  useFrame(() => {
    if (!runtime.vehicle) engineUpdate(false, 0);
  });
  return (
    <>
      {runtime.vehicles.map((v) => (
        <Drivable key={v.id} v={v} />
      ))}
    </>
  );
}
