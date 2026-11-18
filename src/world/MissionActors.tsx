import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { P } from '../game/places';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { MISSIONS } from '../missions/data';
import { Person } from './Person';
import { useStaticObstacles } from './useObstacles';

interface NpcDef {
  id: string;
  pos: [number, number];
  shirt: string;
  pants?: string;
  skin?: string;
  hair?: string;
  tie?: string;
  hat?: string;
  bald?: boolean;
}

export const NPCS: NpcDef[] = [
  { id: 'worker', pos: P.superWorker, shirt: '#2f5d8a', pants: '#2f5d8a', skin: '#b07b5a', hair: '#2b2b2b', hat: '#f2c230' },
  { id: 'ministra', pos: P.ministra, shirt: '#7b2d43', pants: '#222', skin: '#e0ac69', hair: '#3a2a1a' },
  { id: 'secretario', pos: P.secretario, shirt: '#2f3e46', pants: '#2f3e46', tie: '#c9a227', bald: true, skin: '#f1c27d' },
  { id: 'ze', pos: P.zeDoFrete, shirt: '#c0392b', pants: '#34495e', hat: '#f1c40f', skin: '#a0673f' },
  { id: 'prot1', pos: P.prot1, shirt: '#8e44ad', skin: '#8d5524', hair: '#1b1b1b' },
  { id: 'prot2', pos: P.prot2, shirt: '#f39c12', hat: '#222', skin: '#c68642' },
  { id: 'prot3', pos: P.prot3, shirt: '#ffffff', pants: '#6d4c41', skin: '#ffdbac', hair: '#d9d9d9' },
  { id: 'fornecedora', pos: P.fornecedora, shirt: '#16a085', skin: '#e0ac69', hair: '#6b4423' },
  { id: 'eleitora', pos: P.eleitora, shirt: '#f28482', pants: '#3d405b', skin: '#8d5524', hair: '#1b1b1b' },
  { id: 'arlindo', pos: P.arlindo, shirt: '#3a5a40', pants: '#283618', skin: '#e0ac69', hair: '#6b6b6b', hat: '#b5651d' },
  { id: 'juvenal', pos: P.juvenal, shirt: '#3d405b', pants: '#2b2d42', tie: '#0d6efd', skin: '#e0ac69', hair: '#cfcfcf' },
  { id: 'diretora', pos: P.diretora, shirt: '#6a994e', pants: '#386641', skin: '#8d5524', hair: '#2b1a10' },
  { id: 'enfermeira', pos: P.enfermeira, shirt: '#e9f5f9', pants: '#e9f5f9', skin: '#e0ac69', hair: '#3b2a1a' },
  { id: 'morador', pos: P.morador, shirt: '#b5838d', pants: '#4a4e69', skin: '#6f4e37', hair: '#1b1b1b', hat: '#e9c46a' },
  { id: 'sargento', pos: P.sargento, shirt: '#556b2f', pants: '#556b2f', skin: '#a0673f', hat: '#3b4a2a' },
  { id: 'herdeira', pos: P.herdeira, shirt: '#ffafcc', pants: '#cdb4db', skin: '#f1c27d', hair: '#e0c068' },
  { id: 'general', pos: P.general, shirt: '#4b5320', pants: '#4b5320', tie: '#c9a227', skin: '#e0ac69', hair: '#cfcfcf', hat: '#2f3a1a' },
  { id: 'toga', pos: P.toga, shirt: '#0d0d0d', pants: '#0d0d0d', tie: '#f5f5f5', skin: '#f1c27d', hair: '#4a4a4a' },
  { id: 'clara', pos: P.professora, shirt: '#2a6f97', pants: '#1d3557', skin: '#c68642', hair: '#2b1a10' },
  { id: 'quorum', pos: P.quorum, shirt: '#34495e', pants: '#34495e', tie: '#e74c3c', skin: '#f1c27d', hair: '#9e9e9e' },
];

function Npc({ d }: { d: NpcDef }) {
  const g = useRef<THREE.Group>(null);
  const mark = useRef<THREE.Group>(null);
  const active = useGame((s) => MISSIONS[s.missionIndex]?.steps[s.stepIndex]?.npc === d.id);
  useFrame((st) => {
    if (!g.current) return;
    const dx = runtime.player.x - d.pos[0];
    const dz = runtime.player.z - d.pos[1];
    if (dx * dx + dz * dz < 150) g.current.rotation.y = Math.atan2(dx, dz);
    if (mark.current) {
      mark.current.position.y = 3.3 + Math.sin(st.clock.elapsedTime * 3) * 0.15;
      mark.current.rotation.y = st.clock.elapsedTime * 2;
    }
  });
  return (
    <group position={[d.pos[0], 0, d.pos[1]]}>
      <group ref={g}>
        <Person shirt={d.shirt} pants={d.pants} skin={d.skin} hair={d.hair} tie={d.tie} hat={d.hat} bald={d.bald} />
      </group>
      {active && (
        <group ref={mark}>
          <mesh>
            <boxGeometry args={[0.22, 0.6, 0.22]} />
            <meshBasicMaterial color="#ffd60a" />
          </mesh>
          <mesh position={[0, -0.55, 0]}>
            <boxGeometry args={[0.22, 0.22, 0.22]} />
            <meshBasicMaterial color="#ffd60a" />
          </mesh>
        </group>
      )}
    </group>
  );
}

function Beacon() {
  const step = useGame((s) => MISSIONS[s.missionIndex]?.steps[s.stepIndex]);
  const ref = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + Math.sin(t * 3) * 0.06;
    if (ring.current) {
      const s = 1 + (t % 1.5) * 0.6;
      ring.current.scale.set(s, s, s);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - (t % 1.5) / 1.5);
    }
  });
  if (!step) return null;
  const r = step.type === 'reach' ? Math.min(step.radius ?? 6, 6) : 1.6;
  return (
    <group position={[step.target[0], 0, step.target[1]]}>
      <mesh ref={ref} position={[0, 30, 0]}>
        <cylinderGeometry args={[r * 0.35, r * 0.35, 60, 16, 1, true]} />
        <meshBasicMaterial color="#ffd60a" transparent opacity={0.2} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <ringGeometry args={[r * 0.8, r, 32]} />
        <meshBasicMaterial color="#ffd60a" transparent opacity={0.6} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function MissionActors() {
  useStaticObstacles(NPCS.map((d) => [d.pos[0], d.pos[1], 0.42]), 'npc');
  return (
    <>
      {NPCS.map((d) => (
        <Npc key={d.id} d={d} />
      ))}
      <Beacon />
    </>
  );
}
