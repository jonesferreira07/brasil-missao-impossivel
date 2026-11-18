import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { resolveObstacles } from '../game/obstacles';
import { resolveCircle, SUPER } from './layout';
import { Person, type AnimState } from './Person';

export function isBlocked() {
  const s = useGame.getState();
  return s.screen !== 'playing' || s.paused || s.decisionOpen || s.negotiationOpen || !!s.outcome || s.missionIntro || s.showHowTo || s.showHistory || !!s.dialogue || s.electionOpen;
}

const lerpAngle = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
};
export { lerpAngle };

/** O Presidente (personagem fictício e caricatural). */
export function Player() {
  const g = useRef<THREE.Group>(null);
  const anim = useRef<AnimState>({ phase: 0, speed: 0 });

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const grp = g.current;
    if (!grp) return;
    const p = runtime.player;
    grp.visible = !runtime.vehicle && useGame.getState().screen !== 'intro';
    if (runtime.vehicle) return;
    const k = runtime.keys;
    let f = 0,
      r = 0;
    const blocked = isBlocked();
    if (!blocked) {
      if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
      if (k.has('KeyD') || k.has('ArrowRight')) r += 1;
      if (k.has('KeyA') || k.has('ArrowLeft')) r -= 1;
      f -= runtime.joy.y;
      r += runtime.joy.x;
    }
    const joyMag = Math.hypot(runtime.joy.x, runtime.joy.y);
    const yaw = runtime.cam.yaw;
    let dx = -Math.sin(yaw) * f + Math.cos(yaw) * r;
    let dz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
    const len = Math.hypot(dx, dz);
    const run = k.has('ShiftLeft') || k.has('ShiftRight') || joyMag > 0.97;
    const a = anim.current;
    if (len > 0.01) {
      dx /= len;
      dz /= len;
      const sp = (run ? 9 : 4.5) * (joyMag > 0.05 && !k.size ? Math.max(0.35, Math.min(1, joyMag * 1.2)) : 1);
      p.x += dx * sp * dt;
      p.z += dz * sp * dt;
      p.yaw = lerpAngle(p.yaw, Math.atan2(dx, dz), 1 - Math.exp(-dt * 14));
      a.speed += ((run ? 2 : 1) - a.speed) * Math.min(1, dt * 10);
    } else {
      a.speed += (0 - a.speed) * Math.min(1, dt * 10);
    }
    a.phase += dt * (run ? 13 : 8.5) * Math.min(1, a.speed + 0.01);
    resolveCircle(p, 0.45);
    resolveObstacles(p, 0.42);
    resolveCircle(p, 0.45);
    grp.position.set(p.x, 0, p.z);
    grp.rotation.y = p.yaw;
    runtime.insideSuper = p.x > SUPER.minX - 0.5 && p.x < SUPER.maxX && p.z > SUPER.minZ && p.z < SUPER.maxZ;
  });

  return (
    <group ref={g}>
      <Person shirt="#1b2431" pants="#1b2431" sash tie="#8a1c2b" hair="#d4d4d4" skin="#d39a76" headScale={1.22} anim={anim} />
    </group>
  );
}
