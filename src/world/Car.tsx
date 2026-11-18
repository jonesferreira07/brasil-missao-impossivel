import { forwardRef } from 'react';
import * as THREE from 'three';

interface Props {
  color: string;
  kind?: 'sedan' | 'popular' | 'truck' | 'wreck';
  lightsOn?: boolean;
  flag?: boolean;
}

const Wheel = ({ p }: { p: [number, number, number] }) => (
  <mesh position={p} rotation={[0, 0, Math.PI / 2]}>
    <cylinderGeometry args={[0.38, 0.38, 0.3, 10]} />
    <meshStandardMaterial color="#141414" />
  </mesh>
);

/** Carro estilizado original. Frente aponta para +z. */
export const Car = forwardRef<THREE.Group, Props>(function Car({ color, kind = 'sedan', lightsOn, flag }, ref) {
  if (kind === 'truck') {
    return (
      <group ref={ref}>
        <mesh position={[0, 1.4, 3.2]} castShadow>
          <boxGeometry args={[2.4, 2.2, 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, 1.9, -1]} castShadow>
          <boxGeometry args={[2.5, 2.8, 6.4]} />
          <meshStandardMaterial color="#d7d2c8" />
        </mesh>
        {[3.2, -0.5, -2.6].map((z) => (
          <group key={z}>
            <Wheel p={[-1.15, 0.45, z]} />
            <Wheel p={[1.15, 0.45, z]} />
          </group>
        ))}
      </group>
    );
  }
  const pop = kind === 'popular';
  const wreck = kind === 'wreck';
  const L = pop ? 3.6 : 4.3;
  const W = pop ? 1.75 : 1.95;
  return (
    <group ref={ref}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[W, 0.7, L]} />
        <meshStandardMaterial color={color} metalness={wreck ? 0 : 0.35} roughness={wreck ? 1 : 0.45} />
      </mesh>
      <mesh position={[0, pop ? 1.42 : 1.36, pop ? -0.1 : -0.2]} castShadow>
        <boxGeometry args={[W * 0.88, pop ? 0.75 : 0.62, L * (pop ? 0.58 : 0.5)]} />
        <meshStandardMaterial color={wreck ? '#222' : '#2a3a48'} metalness={0.6} roughness={0.2} />
      </mesh>
      {!wreck && (
        <>
          <mesh position={[-0.6, 0.78, L / 2 + 0.01]}>
            <boxGeometry args={[0.36, 0.16, 0.04]} />
            <meshStandardMaterial color="#fff6d5" emissive="#fff2b0" emissiveIntensity={lightsOn ? 1.5 : 0.3} />
          </mesh>
          <mesh position={[0.6, 0.78, L / 2 + 0.01]}>
            <boxGeometry args={[0.36, 0.16, 0.04]} />
            <meshStandardMaterial color="#fff6d5" emissive="#fff2b0" emissiveIntensity={lightsOn ? 1.5 : 0.3} />
          </mesh>
          <mesh position={[-0.6, 0.8, -L / 2 - 0.01]}>
            <boxGeometry args={[0.36, 0.14, 0.04]} />
            <meshStandardMaterial color="#b3001b" emissive="#b3001b" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0.6, 0.8, -L / 2 - 0.01]}>
            <boxGeometry args={[0.36, 0.14, 0.04]} />
            <meshStandardMaterial color="#b3001b" emissive="#b3001b" emissiveIntensity={0.6} />
          </mesh>
        </>
      )}
      {flag && (
        <group position={[W / 2 - 0.1, 1.1, L / 2 - 0.4]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
            <meshStandardMaterial color="#aaa" />
          </mesh>
          <mesh position={[0, 0.5, -0.2]}>
            <boxGeometry args={[0.02, 0.24, 0.36]} />
            <meshStandardMaterial color="#1f9d55" />
          </mesh>
        </group>
      )}
      <Wheel p={[-W / 2, 0.38, L * 0.32]} />
      <Wheel p={[W / 2, 0.38, L * 0.32]} />
      <Wheel p={[-W / 2, 0.38, -L * 0.32]} />
      <Wheel p={[W / 2, 0.38, -L * 0.32]} />
    </group>
  );
});
