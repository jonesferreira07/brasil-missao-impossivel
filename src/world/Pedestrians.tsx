import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { addObstacle, removeObstacle } from '../game/obstacles';
import { IS_MOBILE } from '../game/device';
import { runtime } from '../game/runtime';
import { useHealth } from './City';
import { PED_ZONES } from './layout';
import { Person, type AnimState } from './Person';

const SHIRTS = ['#e76f51', '#2a9d8f', '#e9c46a', '#f4a261', '#264653', '#8ecae6', '#ffb703', '#d62828', '#6a4c93', '#90be6d', '#f1faee', '#577590'];
const SKINS = ['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac', '#a0673f'];
const HAIRS = ['#1b1b1b', '#3b2a1a', '#6b4423', '#b5915f', '#d9d9d9'];
const MAX = IS_MOBILE ? 16 : 36;

function rnd(a: number, b: number) {
  return a + Math.random() * (b - a);
}
function pickTarget(zone: number): [number, number] {
  const z = PED_ZONES[zone];
  return [rnd(z[0], z[1]), rnd(z[2], z[3])];
}

function Ped({ idx }: { idx: number }) {
  const g = useRef<THREE.Group>(null);
  const anim = useRef<AnimState>({ phase: Math.random() * 6, speed: 0 });
  const st = useMemo(() => {
    const zone = idx % PED_ZONES.length;
    const [x, z] = pickTarget(zone);
    return { zone, x, z, tx: x, tz: z, wait: Math.random() * 3, sp: rnd(1.1, 1.7) };
  }, [idx]);
  const ob = useMemo(() => addObstacle(st.x, st.z, 0.35, 'ped'), [st]);
  useEffect(() => {
    const entry = { x: st.x, z: st.z, id: idx };
    runtime.peds.push(entry);
    return () => {
      runtime.peds = runtime.peds.filter((p) => p !== entry);
      removeObstacle(ob);
    };
  }, [idx, st, ob]);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const a = anim.current;
    const dpx = runtime.player.x - st.x;
    const dpz = runtime.player.z - st.z;
    const nearPlayer = !runtime.vehicle && dpx * dpx + dpz * dpz < 6;
    if (nearPlayer) {
      // para e olha para o presidente
      a.speed += (0 - a.speed) * Math.min(1, dt * 8);
      if (g.current) g.current.rotation.y = Math.atan2(dpx, dpz);
    } else if (st.wait > 0) {
      st.wait -= dt;
      a.speed += (0 - a.speed) * Math.min(1, dt * 8);
    } else {
      const dx = st.tx - st.x;
      const dz = st.tz - st.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.5) {
        [st.tx, st.tz] = pickTarget(st.zone);
        st.wait = rnd(1, 5);
      } else {
        st.x += (dx / d) * st.sp * dt;
        st.z += (dz / d) * st.sp * dt;
        if (g.current) g.current.rotation.y = Math.atan2(dx, dz);
        a.speed += (1 - a.speed) * Math.min(1, dt * 6);
      }
    }
    a.phase += dt * 7 * a.speed;
    const e = runtime.peds.find((p) => p.id === idx);
    if (e) {
      e.x = st.x;
      e.z = st.z;
    }
    ob.x = st.x;
    ob.z = st.z;
    if (g.current) g.current.position.set(st.x, 0, st.z);
  });
  return (
    <group ref={g}>
      <Person shirt={SHIRTS[idx % SHIRTS.length]} skin={SKINS[idx % SKINS.length]} hair={HAIRS[idx % HAIRS.length]} pants={idx % 2 ? '#2b2f3a' : '#3d5a80'} anim={anim} castShadow={false} />
    </group>
  );
}

export function Pedestrians() {
  const h = useHealth();
  const n = Math.min(MAX, Math.round(IS_MOBILE ? 6 + h * 10 : 12 + h * 24));
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <Ped key={i} idx={i} />
      ))}
    </>
  );
}
