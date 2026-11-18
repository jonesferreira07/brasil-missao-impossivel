import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { clamp } from '../economy/model';
import { P } from '../game/places';
import { useGame } from '../game/store';
import { MISSIONS } from '../missions/data';
import { textTexture } from '../game/textures';
import { Car } from './Car';
import { useHealth } from './City';
import { Sign } from './Landmarks';
import { SHOP_D, SHOP_W, SHOPS } from './layout';
import { SimplePerson } from './Person';
import { carStatic, useStaticObstacles } from './useObstacles';

// ------------------------------------------------------------- Lojas
function Shops() {
  const unemployment = useGame((s) => Math.round(s.econ.ind.unemployment * 4) / 4);
  const openFrac = clamp(1 - (unemployment - 6.5) / 9, 0.1, 1);
  const order = [3, 7, 0, 5, 9, 1, 4, 8, 2, 6]; // ordem de reabertura
  return (
    <group>
      {SHOPS.map((sh, i) => {
        const rank = order.indexOf(i);
        const open = rank < Math.round(openFrac * SHOPS.length);
        return <ShopMesh key={sh.id} sh={sh} open={open} />;
      })}
    </group>
  );
}

function ShopMesh({ sh, open }: { sh: (typeof SHOPS)[number]; open: boolean }) {
  const name = useMemo(() => textTexture('shop', [sh.name], { w: 1024, h: 160, bg: open ? sh.color : '#5a5a5a', fg: '#fff' }), [sh.name, open, sh.color]);
  const closed = useMemo(() => textTexture('closed', ['FECHADO', 'ALUGA-SE'], { w: 512, h: 256, bg: '#c9c9c9', fg: '#b00020' }), []);
  const fz = sh.z - SHOP_D / 2 + 1; // frente voltada para -z (rua)
  return (
    <group>
      <mesh position={[sh.x, 3, sh.z + 1]} castShadow receiveShadow>
        <boxGeometry args={[SHOP_W, 6, SHOP_D]} />
        <meshStandardMaterial color={open ? '#efe6d6' : '#9a9388'} />
      </mesh>
      <mesh position={[sh.x, 5.2, fz - 0.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[SHOP_W - 1, 1.3]} />
        <meshStandardMaterial map={name} emissive="#fff" emissiveMap={name} emissiveIntensity={open ? 0.5 : 0.05} />
      </mesh>
      {open ? (
        <>
          <mesh position={[sh.x, 2, fz - 0.03]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[SHOP_W - 2, 3.2]} />
            <meshStandardMaterial color="#ffe8a3" emissive="#ffcf66" emissiveIntensity={0.55} />
          </mesh>
          <mesh position={[sh.x, 4.1, fz - 1]} rotation={[0.35, 0, 0]} castShadow>
            <boxGeometry args={[SHOP_W - 1, 0.12, 2.2]} />
            <meshStandardMaterial color={sh.color} />
          </mesh>
        </>
      ) : (
        <mesh position={[sh.x, 2, fz - 0.03]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[SHOP_W - 2, 3.6]} />
          <meshStandardMaterial map={closed} />
        </mesh>
      )}
    </group>
  );
}

// ------------------------------------------------------------- Lixo
function Trash() {
  const services = useGame((s) => Math.round(s.econ.ind.services));
  const pts = useMemo(() => {
    const a: [number, number][] = [];
    let seed = 99;
    const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
    while (a.length < 60) {
      const roads = [-138, 5, 95];
      if (rnd() < 0.5) a.push([-190 + rnd() * 380, roads[Math.floor(rnd() * 3)] + (rnd() < 0.5 ? -6.5 : 6.5)]);
      else a.push([[-110, -26, 26, 110][Math.floor(rnd() * 4)] + (rnd() < 0.5 ? -6.5 : 6.5), -130 + rnd() * 220]);
    }
    return a;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    pts.forEach(([x, z], i) => {
      m.position.set(x, 0.35, z);
      m.rotation.set(0, i, 0);
      const s = 0.8 + (i % 4) * 0.15;
      m.scale.set(s, s * 0.9, s);
      m.updateMatrix();
      ref.current!.setMatrixAt(i, m.matrix);
    });
    ref.current!.instanceMatrix.needsUpdate = true;
  }, [pts]);
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = Math.round(clamp((70 - services) * 1.6, 0, pts.length));
  }, [services, pts.length]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pts.length]} castShadow>
      <dodecahedronGeometry args={[0.45, 0]} />
      <meshStandardMaterial color="#1b1b1b" roughness={0.5} />
    </instancedMesh>
  );
}

// ------------------------------------------------------------- Fogo
function Fire({ p }: { p: [number, number, number] }) {
  const g = useRef<THREE.Group>(null);
  const l = useRef<THREE.PointLight>(null);
  const off = useMemo(() => Math.random() * 10, []);
  useFrame((st) => {
    const t = st.clock.elapsedTime + off;
    if (g.current) {
      g.current.children.forEach((c, i) => {
        c.scale.y = 1 + Math.sin(t * 9 + i * 2) * 0.25;
        c.rotation.y = t * (1 + i * 0.3);
      });
    }
    if (l.current) l.current.intensity = 18 + Math.sin(t * 13) * 6;
  });
  return (
    <group position={p}>
      <group ref={g}>
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.8, 1.8, 6]} />
          <meshBasicMaterial color="#ff7b00" transparent opacity={0.9} />
        </mesh>
        <mesh position={[0.2, 0.5, 0.2]}>
          <coneGeometry args={[0.5, 1.2, 6]} />
          <meshBasicMaterial color="#ffd000" transparent opacity={0.9} />
        </mesh>
      </group>
      <pointLight ref={l} color="#ff8a2a" distance={14} intensity={18} position={[0, 1.5, 0]} />
    </group>
  );
}

const FIRE_SPOTS: [number, number, number][] = [
  [-60, 0, -105],
  [140, 0, -80],
  [-150, 0, -120],
  [70, 0, 15],
  [-95, 0, 60],
  [-60, 0, 150],
];

function Fires() {
  const h = useHealth();
  const n = Math.round(clamp((0.55 - h) * 14, 0, FIRE_SPOTS.length));
  return (
    <>
      {FIRE_SPOTS.slice(0, n).map((p, i) => (
        <group key={i}>
          <Fire p={p} />
          <mesh position={[p[0], 0.25, p[2]]}>
            <cylinderGeometry args={[0.6, 0.7, 0.5, 8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ------------------------------------------------------------- Carros abandonados
const WRECKS: [number, number, number, string][] = [
  [120, 30, 0.3, '#6d597a'],
  [124, 50, 1.9, '#3a3a3a'],
  [-60, 8, 1.5, '#b56576'],
  [30, -80, 0.1, '#355070'],
  [-118, -60, 2.8, '#2b2b2b'],
  [90, 98, 1.6, '#e56b6f'],
  [-150, 98, 0.2, '#444'],
  [160, -138 + 7, 1.4, '#2b2b2b'],
];
function Wrecks() {
  const h = useHealth();
  const n = Math.round(clamp((0.75 - h) * 12, 0, WRECKS.length));
  useStaticObstacles(WRECKS.slice(0, n).flatMap(([x, z, r]) => carStatic(x, z, r)), 'car', [n]);
  return (
    <>
      {WRECKS.slice(0, n).map(([x, z, r, c], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, i % 3 === 0 ? 0.08 : 0]}>
          <Car color={c} kind="wreck" />
        </group>
      ))}
    </>
  );
}

// ------------------------------------------------------------- Manifestação
const PROTEST_SIGNS = ['PICANHA JÁ!', 'MENOS DISCURSO, MAIS FEIJÃO', 'CADÊ O ORÇAMENTO?', 'INFLAÇÃO NÃO É OPINIÃO', 'QUERO EMPREGO, NÃO PROMESSA', 'O CARRINHO TÁ VAZIO', 'PLANO QUE DURE!', 'PAZ E PÃO'];
function Protest() {
  const pop = useGame((s) => Math.round(s.econ.ind.popularity));
  const infl = useGame((s) => Math.round(s.econ.ind.inflation));
  const n = Math.round(clamp(8 + (55 - pop) * 0.9 + (infl - 5) * 0.8, 3, 46));
  const tex = useMemo(() => PROTEST_SIGNS.map((t) => textTexture('prot', t.split(', ').length > 1 ? t.split(', ') : [t], { w: 512, h: 256, bg: '#fffdf2', fg: '#b00020', border: '#222' })), []);
  const people = useMemo(() => {
    const a: { p: [number, number, number]; r: number; c: string; s: number }[] = [];
    let seed = 5;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const colors = ['#e63946', '#f1c40f', '#2ecc71', '#3498db', '#ecf0f1', '#9b59b6', '#e67e22'];
    for (let i = 0; i < 46; i++) {
      const ang = rnd() * Math.PI * 2;
      const rad = 3 + rnd() * 14;
      a.push({ p: [Math.cos(ang) * rad, 0, -114 + Math.sin(ang) * rad * 0.7], r: Math.PI + (rnd() - 0.5), c: colors[i % colors.length], s: i % 3 === 0 ? i % PROTEST_SIGNS.length : -1 });
    }
    return a;
  }, []);
  useStaticObstacles(people.slice(0, n).map((pp) => [pp.p[0], pp.p[2], 0.38]), 'npc', [n]);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    g.current.children.forEach((c, i) => (c.position.y = Math.max(0, Math.sin(t * 4 + i)) * 0.18));
  });
  return (
    <group ref={g}>
      {people.slice(0, n).map((pp, i) => (
        <SimplePerson key={i} position={pp.p} rotation={pp.r} shirt={pp.c} sign={pp.s >= 0 ? tex[pp.s] : undefined} />
      ))}
    </group>
  );
}

// ------------------------------------------------------------- Outdoors
const BILLBOARDS: { p: [number, number, number]; r: number; lines: string[]; bg: string; fg: string }[] = [
  { p: [100, 0, -132], r: 0, lines: ['CADÊ MEU IMPOSTO?', 'Saiba quanto você paga e como gastam: cademeuimposto.com'], bg: '#f2c230', fg: '#0b1d2e' },
  { p: [123, 0, 72], r: -Math.PI / 2, lines: ['SEU DINHEIRO MERECE ATENÇÃO', 'cademeuimposto.com — informação que vira cidadania'], bg: '#0b1d2e', fg: '#f2c230' },
  { p: [-100, 0, 105], r: Math.PI, lines: ['QUANTO CUSTA UM DEPUTADO POR DIA?', 'Descubra em cademeuimposto.com'], bg: '#1f9d55', fg: '#fff' },
  { p: [118, 0, -10], r: -Math.PI / 2, lines: ['PICANHA PARA TODOS*', '*consulte condições, prazos e o Tesouro'], bg: '#c1121f', fg: '#fff' },
  { p: [-40, 0, 100], r: Math.PI, lines: ['NOVO MINISTÉRIO!', 'Ministério da Solução dos Problemas Criados Ontem'], bg: '#1d3557', fg: '#f1faee' },
  { p: [-118, 0, -60], r: Math.PI / 2, lines: ['ASFALTO NESTA RUA', 'promessa nº 4.817 — em breve desde sempre'], bg: '#f2c230', fg: '#14213d' },
  { p: [60, 0, -132], r: 0, lines: ['A INFLAÇÃO NÃO ACEITA', 'DISCURSO COMO FORMA DE PAGAMENTO'], bg: '#fefae0', fg: '#bc4749' },
  { p: [121, 0, 128], r: -Math.PI / 2, lines: ['CRÉDITO FÁCIL!', 'juros de apenas 14% ao dia (fictício)'], bg: '#6a4c93', fg: '#fff' },
  { p: [-150, 0, -132], r: 0, lines: ['GOVERNO ANUNCIA PLANO', 'O PLANO ANUNCIA OUTRO PLANO'], bg: '#2a9d8f', fg: '#fff' },
];
function Billboards() {
  useStaticObstacles(
    BILLBOARDS.flatMap((b) => [-1, 1].map((sx) => [b.p[0] + Math.cos(b.r) * sx * 4.7, b.p[2] - Math.sin(b.r) * sx * 4.7, 0.25] as [number, number, number])),
  );
  return (
    <>
      {BILLBOARDS.map((b, i) => (
        <group key={i} position={b.p} rotation={[0, b.r, 0]}>
          <Sign lines={b.lines} w={10} h={4} pos={[0, 7.5, 0]} bg={b.bg} fg={b.fg} emissive={0.25} res={[1024, 410]} mount="posts" />
          <mesh position={[0, 5.4, 0.3]}>
            <boxGeometry args={[10.4, 0.12, 0.8]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// ------------------------------------------------------------- Greve (missão 4)
function StrikeTrucks() {
  const active = useGame((s) => MISSIONS[s.missionIndex]?.id === 'm4');
  const supply = useGame((s) => s.econ.lev.foodSupply);
  const show = active || supply <= 0.84;
  const n = !show ? 0 : active ? 6 : 3;
  useStaticObstacles(
    Array.from({ length: n }).flatMap((_, i) => carStatic(-113 + (i % 2) * 6, 20 + i * 11 - 0.6, 0.05 * (i - 2), 9.5, 1.4)),
    'car',
    [n],
  );
  if (!show) return null;
  return (
    <group>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[-113 + (i % 2) * 6, 0, 20 + i * 11]} rotation={[0, 0.05 * (i - 2), 0]}>
          <Car color={['#d62828', '#003049', '#f77f00', '#2a9d8f', '#6a4c93', '#264653'][i]} kind="truck" />
        </group>
      ))}
      <Sign lines={['GREVE!', 'DIESEL JUSTO OU NADA RODA']} w={6} h={2} pos={[-103, 2.6, 8]} rot={Math.PI / 2} bg="#fff" fg="#d62828" border="#111" mount="posts" />
    </group>
  );
}

// ------------------------------------------------------------- Fila no posto
function PostoQueue() {
  const supply = useGame((s) => Math.round(s.econ.lev.foodSupply * 40) / 40);
  const n = Math.round(clamp((0.95 - supply) * 40, 0, 6));
  useStaticObstacles(Array.from({ length: n }).flatMap((_, i) => carStatic(-128 + i * 0.3, 30 - i * 5.5, Math.PI)), 'car', [n]);
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[-128 + i * 0.3, 0, 30 - i * 5.5]} rotation={[0, Math.PI, 0]}>
          <Car color={['#adb5bd', '#e63946', '#457b9d', '#f4a261', '#2a9d8f', '#ddd'][i]} kind={i % 2 ? 'popular' : 'sedan'} />
        </group>
      ))}
    </>
  );
}

export function Dynamic() {
  return (
    <group>
      <Shops />
      <Trash />
      <Fires />
      <Wrecks />
      <Protest />
      <Billboards />
      <StrikeTrucks />
      <PostoQueue />
    </group>
  );
}

export { P };
