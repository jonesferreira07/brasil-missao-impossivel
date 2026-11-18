import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { health } from '../economy/model';
import { useGame } from '../game/store';
import { textTexture, windowTexture } from '../game/textures';
import { BUILDINGS, COLLIDERS, ROADS, type Bld } from './layout';
import { useStaticObstacles } from './useObstacles';

export const useHealth = () => useGame((s) => Math.round(health(s.econ) * 20) / 20);

const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

function Ground() {
  const h = useHealth();
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[460, 460]} />
        <meshStandardMaterial color={mix('#9b8b63', '#6c9a52', h)} />
      </mesh>
      {/* gramado da Esplanada */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0.01, -20]}>
        <planeGeometry args={[42, 226]} />
        <meshStandardMaterial color={mix('#8d8a55', '#4f9a3f', h)} />
      </mesh>
    </>
  );
}

function Roads() {
  const dashes = useMemo(() => {
    const arr: { x: number; z: number; r: number }[] = [];
    for (const r of ROADS) {
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      const n = Math.floor(len / 9);
      const horiz = r.z1 === r.z2;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        arr.push({ x: r.x1 + (r.x2 - r.x1) * t, z: r.z1 + (r.z2 - r.z1) * t, r: horiz ? Math.PI / 2 : 0 });
      }
    }
    return arr;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    dashes.forEach((d, i) => {
      m.position.set(d.x, 0.035, d.z);
      m.rotation.set(0, d.r, 0);
      m.updateMatrix();
      ref.current!.setMatrixAt(i, m.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [dashes]);
  return (
    <group>
      {ROADS.map((r, i) => {
        const horiz = r.z1 === r.z2;
        const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1) + r.w;
        return (
          <group key={i}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(r.x1 + r.x2) / 2, 0.02 + i * 0.001, (r.z1 + r.z2) / 2]} receiveShadow>
              <planeGeometry args={horiz ? [len, r.w] : [r.w, len]} />
              <meshStandardMaterial color="#2e3034" roughness={0.95} />
            </mesh>
            {/* calçadas */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(r.x1 + r.x2) / 2, 0.015, (r.z1 + r.z2) / 2]} receiveShadow>
              <planeGeometry args={horiz ? [len, r.w + 4] : [r.w + 4, len]} />
              <meshStandardMaterial color="#9c968a" />
            </mesh>
          </group>
        );
      })}
      <instancedMesh ref={ref} args={[undefined, undefined, dashes.length]}>
        <boxGeometry args={[0.25, 0.02, 3]} />
        <meshBasicMaterial color="#e8d36b" />
      </instancedMesh>
    </group>
  );
}

function BuildingMesh({ b, h }: { b: Bld; h: number }) {
  const damaged = b.damage !== undefined && h < b.damage;
  const tex = useMemo(() => {
    if (b.kind === 'house') return null;
    const t = windowTexture().clone();
    t.repeat.set(Math.max(1, Math.round(Math.max(b.w, b.d) / 4)), Math.max(1, Math.round(b.h / 4)));
    t.needsUpdate = true;
    return t;
  }, [b]);
  const sign = useMemo(() => (b.label ? textTexture('min', b.label.length > 30 ? splitLabel(b.label) : [b.label], { w: 1024, h: 192, bg: '#1b4d3e', fg: '#f6f1dc', border: '#e3b23c' }) : null), [b.label]);
  const color = damaged ? mix(b.color, '#3a332c', 0.45) : b.color;
  const signPos = useMemo((): { p: [number, number, number]; r: number } | null => {
    if (!b.face) return null;
    const y = b.kind === 'ministry' ? b.h - 3 : b.h - 1.6;
    switch (b.face) {
      case 'x+':
        return { p: [b.x + b.w / 2 + 0.05, y, b.z], r: Math.PI / 2 };
      case 'x-':
        return { p: [b.x - b.w / 2 - 0.05, y, b.z], r: -Math.PI / 2 };
      case 'z+':
        return { p: [b.x, y, b.z + b.d / 2 + 0.05], r: 0 };
      default:
        return { p: [b.x, y, b.z - b.d / 2 - 0.05], r: Math.PI };
    }
  }, [b]);
  return (
    <group>
      <mesh position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={color} map={tex ?? undefined} roughness={0.85} />
      </mesh>
      {b.kind === 'house' && (
        <>
          <mesh position={[b.x, b.h + 1.6, b.z]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[b.w * 0.78, 3.2, 4]} />
            <meshStandardMaterial color={damaged ? '#4a3b33' : b.roof ?? '#8a3b2a'} />
          </mesh>
          <mesh position={[b.x, 1.1, b.z + b.d / 2 + 0.02]}>
            <planeGeometry args={[1.3, 2.2]} />
            <meshStandardMaterial color="#5b3a22" />
          </mesh>
          <mesh position={[b.x + 2.8, 2.6, b.z + b.d / 2 + 0.02]}>
            <planeGeometry args={[1.6, 1.2]} />
            <meshStandardMaterial color={damaged ? '#222' : '#a9c7d8'} />
          </mesh>
        </>
      )}
      {b.kind === 'ministry' && (
        <mesh position={[b.x, b.h + 0.4, b.z]} castShadow>
          <boxGeometry args={[b.w + 0.6, 0.8, b.d + 0.6]} />
          <meshStandardMaterial color={damaged ? '#3b342e' : '#bfb9ab'} />
        </mesh>
      )}
      {b.kind === 'warehouse' && (
        <mesh position={[b.x, b.h + 0.6, b.z]} rotation={[0, 0, 0.05]}>
          <boxGeometry args={[b.w + 0.4, 0.5, b.d + 0.4]} />
          <meshStandardMaterial color={damaged ? '#6b4b36' : '#8e8a84'} />
        </mesh>
      )}
      {damaged && (
        <>
          {/* parte superior queimada */}
          <mesh position={[b.x + b.w * 0.2, b.h * 0.82, b.z]}>
            <boxGeometry args={[b.w * 0.62, b.h * 0.3, b.d + 0.06]} />
            <meshStandardMaterial color="#1d1a18" roughness={1} />
          </mesh>
          {/* entulho */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[b.x - b.w / 2 - 1.2 + (i % 2) * 1.4, 0.35 + (i > 1 ? 0.3 : 0), b.z + (i - 1.5) * 1.6]} rotation={[i, i * 0.7, 0]} castShadow>
              <boxGeometry args={[1.2, 0.7, 1]} />
              <meshStandardMaterial color="#6c645c" />
            </mesh>
          ))}
        </>
      )}
      {sign && signPos && (
        <mesh position={signPos.p} rotation={[0, signPos.r, 0]}>
          <planeGeometry args={[b.kind === 'ministry' ? Math.min(b.d, 12) - 0.6 : Math.min(b.w, 20), b.kind === 'ministry' ? 2.2 : 1.8]} />
          <meshStandardMaterial map={sign} emissive="#ffffff" emissiveMap={sign} emissiveIntensity={0.25} />
        </mesh>
      )}
    </group>
  );
}

function splitLabel(l: string): string[] {
  const words = l.split(' ');
  const half = Math.ceil(l.length / 2);
  let a = '';
  const rest: string[] = [];
  for (const w of words) {
    if (a.length < half && rest.length === 0) a += (a ? ' ' : '') + w;
    else rest.push(w);
  }
  return [a, rest.join(' ')];
}

function Buildings() {
  const h = useHealth();
  return (
    <>
      {BUILDINGS.map((b) => (
        <BuildingMesh key={b.id} b={b} h={h} />
      ))}
    </>
  );
}

function Trees() {
  const pts = useMemo(() => {
    const a: [number, number, number][] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let z = -100; z <= 88; z += 14) {
      a.push([-17, z, 0.9 + rnd() * 0.4]);
      a.push([17, z, 0.9 + rnd() * 0.4]);
    }
    for (let i = 0; i < 70; i++) {
      const x = -200 + rnd() * 400;
      const z = -200 + rnd() * 400;
      // evita ruas e prédios (aproximado)
      if (Math.abs(z + 138) < 9 || Math.abs(z - 5) < 9 || Math.abs(z - 95) < 9 || Math.abs(x + 110) < 9 || Math.abs(x - 110) < 9) continue;
      if (Math.abs(x) < 60 && z < 100 && z > -180) continue;
      if (x > 60 && x < 100 && z < 100) continue;
      if (x > 135 && x < 190 && z > 15 && z < 65) continue;
      a.push([x, z, 0.8 + rnd() * 0.7]);
    }
    return a;
  }, []);
  useStaticObstacles(pts.map(([x, z, sc]) => [x, z, 0.3 * sc]));
  const trunk = useRef<THREE.InstancedMesh>(null);
  const crown = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    pts.forEach(([x, z, s], i) => {
      m.position.set(x, 1.2 * s, z);
      m.scale.set(s, s, s);
      m.updateMatrix();
      trunk.current!.setMatrixAt(i, m.matrix);
      m.position.set(x, 3.4 * s, z);
      m.updateMatrix();
      crown.current!.setMatrixAt(i, m.matrix);
    });
    trunk.current!.instanceMatrix.needsUpdate = true;
    crown.current!.instanceMatrix.needsUpdate = true;
  }, [pts]);
  const h = useHealth();
  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, pts.length]} castShadow>
        <cylinderGeometry args={[0.18, 0.25, 2.4, 6]} />
        <meshStandardMaterial color="#6b4a2f" />
      </instancedMesh>
      <instancedMesh ref={crown} args={[undefined, undefined, pts.length]} castShadow>
        <icosahedronGeometry args={[1.9, 0]} />
        <meshStandardMaterial color={mix('#7d7a3c', '#3f8a3a', h)} flatShading />
      </instancedMesh>
    </>
  );
}

/** Postes de iluminação ao longo das calçadas (instanciados). */
function StreetLamps() {
  const pts = useMemo(() => {
    const a: { x: number; z: number; r: number }[] = [];
    const free = (x: number, z: number) => !COLLIDERS.some((b) => x > b.minX - 1.2 && x < b.maxX + 1.2 && z > b.minZ - 1.2 && z < b.maxZ + 1.2);
    for (const r of ROADS) {
      const horiz = r.z1 === r.z2;
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      for (let d = 12; d < len; d += 26) {
        for (const side of [-1, 1]) {
          const t = d / len;
          const x = r.x1 + (r.x2 - r.x1) * t + (horiz ? 0 : side * (r.w / 2 + 1.3));
          const z = r.z1 + (r.z2 - r.z1) * t + (horiz ? side * (r.w / 2 + 1.3) : 0);
          // evita cruzamentos
          const nearCross = ROADS.some((o) => o !== r && (o.z1 === o.z2) !== horiz && (horiz ? Math.abs(x - o.x1) < 9 : Math.abs(z - o.z1) < 9));
          if (!nearCross && free(x, z)) a.push({ x, z, r: horiz ? (side > 0 ? Math.PI : 0) : side > 0 ? -Math.PI / 2 : Math.PI / 2 });
        }
      }
    }
    return a;
  }, []);
  useStaticObstacles(pts.map((p) => [p.x, p.z, 0.18]));
  const pole = useRef<THREE.InstancedMesh>(null);
  const arm = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    pts.forEach((p, i) => {
      m.rotation.set(0, p.r, 0);
      m.position.set(p.x, 3, p.z);
      m.updateMatrix();
      pole.current!.setMatrixAt(i, m.matrix);
      const fx = Math.sin(p.r), fz = Math.cos(p.r);
      m.position.set(p.x + fx * 0.9, 6, p.z + fz * 0.9);
      m.updateMatrix();
      arm.current!.setMatrixAt(i, m.matrix);
      m.position.set(p.x + fx * 1.7, 5.85, p.z + fz * 1.7);
      m.updateMatrix();
      head.current!.setMatrixAt(i, m.matrix);
    });
    [pole, arm, head].forEach((r) => (r.current!.instanceMatrix.needsUpdate = true));
  }, [pts]);
  const h = useHealth();
  return (
    <>
      <instancedMesh ref={pole} args={[undefined, undefined, pts.length]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 6, 6]} />
        <meshStandardMaterial color="#4a4f55" metalness={0.5} roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={arm} args={[undefined, undefined, pts.length]}>
        <boxGeometry args={[0.1, 0.1, 1.8]} />
        <meshStandardMaterial color="#4a4f55" />
      </instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, pts.length]}>
        <boxGeometry args={[0.5, 0.18, 0.8]} />
        <meshStandardMaterial color="#fff5d6" emissive="#ffe7a0" emissiveIntensity={0.3 + h * 0.9} />
      </instancedMesh>
    </>
  );
}

/** Meio-fio branco nas bordas das ruas. */
function Curbs() {
  return (
    <>
      {ROADS.map((r, i) => {
        const horiz = r.z1 === r.z2;
        const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1) + r.w;
        const cx = (r.x1 + r.x2) / 2;
        const cz = (r.z1 + r.z2) / 2;
        return [-1, 1].map((side) => (
          <mesh key={`${i}${side}`} position={[cx + (horiz ? 0 : side * (r.w / 2 + 0.1)), 0.06, cz + (horiz ? side * (r.w / 2 + 0.1) : 0)]} receiveShadow>
            <boxGeometry args={horiz ? [len, 0.12, 0.25] : [0.25, 0.12, len]} />
            <meshStandardMaterial color="#d8d4c8" />
          </mesh>
        ));
      })}
    </>
  );
}

export function City() {
  return (
    <group>
      <Ground />
      <Roads />
      <Curbs />
      <StreetLamps />
      <Buildings />
      <Trees />
    </group>
  );
}
