import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { addObstacle, carCircles, removeObstacle } from '../game/obstacles';
import { IS_MOBILE } from '../game/device';
import { runtime } from '../game/runtime';
import { Car } from './Car';
import { useHealth } from './City';
import { TRAFFIC_LOOPS } from './layout';

interface Loop {
  pts: [number, number][];
  cum: number[];
  total: number;
}
const LOOPS: Loop[] = TRAFFIC_LOOPS.map((pts) => {
  const cum = [0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    cum.push(cum[i] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, cum, total: cum[cum.length - 1] };
});

function sample(l: Loop, s: number) {
  s = ((s % l.total) + l.total) % l.total;
  let i = 0;
  while (l.cum[i + 1] < s) i++;
  const a = l.pts[i];
  const b = l.pts[(i + 1) % l.pts.length];
  const t = (s - l.cum[i]) / (l.cum[i + 1] - l.cum[i]);
  const yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const x = a[0] + (b[0] - a[0]) * t - Math.cos(yaw) * 2.6;
  const z = a[1] + (b[1] - a[1]) * t + Math.sin(yaw) * 2.6;
  return { x, z, yaw };
}

const COLORS = ['#e63946', '#457b9d', '#f1faee', '#2a9d8f', '#e9c46a', '#264653', '#adb5bd', '#ff006e', '#8338ec', '#3a86ff', '#fb5607', '#6c757d'];
const MAX = IS_MOBILE ? 9 : 20;

function TrafficCar({ idx }: { idx: number }) {
  const g = useRef<THREE.Group>(null);
  const own = useMemo(() => [addObstacle(0, 0, 1.0, 'car'), addObstacle(0, 0, 1.0, 'car')], []);
  useEffect(() => () => own.forEach(removeObstacle), [own]);
  const st = useMemo(() => ({ loop: idx % LOOPS.length, s: (idx * 137) % LOOPS[idx % LOOPS.length].total, v: 9 + (idx % 5) }), [idx]);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const l = LOOPS[st.loop];
    const cur = sample(l, st.s);
    // para se o jogador estiver à frente
    const px = runtime.vehicle ? runtime.vehicles.find((c) => c.id === runtime.vehicle)!.x : runtime.player.x;
    const pz = runtime.vehicle ? runtime.vehicles.find((c) => c.id === runtime.vehicle)!.z : runtime.player.z;
    const dx = px - cur.x;
    const dz = pz - cur.z;
    const ahead = dx * Math.sin(cur.yaw) + dz * Math.cos(cur.yaw);
    const side = Math.abs(dx * Math.cos(cur.yaw) - dz * Math.sin(cur.yaw));
    const blocked = ahead > 0 && ahead < 9 && side < 2.6;
    const target = blocked ? 0 : 9 + (idx % 5);
    st.v += (target - st.v) * Math.min(1, dt * (blocked ? 6 : 1.5));
    st.s += st.v * dt;
    const p = sample(l, st.s);
    carCircles(own, p.x, p.z, p.yaw, idx % 3 === 0 ? 3.6 : 4.3, 1.0);
    if (g.current) {
      g.current.position.set(p.x, 0, p.z);
      const ry = g.current.rotation.y;
      let d = p.yaw - ry;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.current.rotation.y = ry + d * Math.min(1, dt * 8);
    }
  });
  return <Car ref={g} color={COLORS[idx % COLORS.length]} kind={idx % 3 === 0 ? 'popular' : 'sedan'} />;
}

export function Traffic() {
  const h = useHealth();
  const n = Math.round(IS_MOBILE ? 3 + h * 6 : 5 + h * 15);
  return (
    <>
      {Array.from({ length: Math.min(MAX, n) }).map((_, i) => (
        <TrafficCar key={i} idx={i} />
      ))}
    </>
  );
}
