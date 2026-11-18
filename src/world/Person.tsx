import { useFrame } from '@react-three/fiber';
import { forwardRef, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

export interface AnimState {
  phase: number;
  speed: number; // 0 parado, ~1 andando, ~2 correndo
}

interface Props {
  shirt: string;
  pants?: string;
  skin?: string;
  hair?: string;
  sash?: boolean;
  tie?: string;
  scale?: number;
  headScale?: number;
  anim?: MutableRefObject<AnimState>;
  bald?: boolean;
  hat?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  castShadow?: boolean;
}

/** Personagem estilizado low-poly feito de primitivas (100% original). */
export const Person = forwardRef<THREE.Group, Props>(function Person(
  { shirt, pants = '#2b2f3a', skin = '#c98f6b', hair = '#2a1d14', sash, tie, scale = 1, headScale = 1, anim, bald, hat, position, rotation, castShadow = true },
  ref,
) {
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!anim) return;
    const a = anim.current;
    const sw = Math.sin(a.phase) * Math.min(1, a.speed) * (a.speed > 1.5 ? 0.9 : 0.6);
    if (legL.current) legL.current.rotation.x = sw;
    if (legR.current) legR.current.rotation.x = -sw;
    if (armL.current) armL.current.rotation.x = -sw * 0.8;
    if (armR.current) armR.current.rotation.x = sw * 0.8;
    if (body.current) body.current.position.y = Math.abs(Math.cos(a.phase)) * 0.06 * Math.min(1, a.speed);
  });

  const hs = headScale;
  return (
    <group ref={ref} scale={scale} position={position} rotation={rotation}>
      <group ref={body}>
        {/* pernas */}
        <group ref={legL} position={[-0.17, 0.92, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.24, 0.9, 0.26]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <mesh position={[0, -0.88, 0.06]}>
            <boxGeometry args={[0.26, 0.12, 0.38]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
        <group ref={legR} position={[0.17, 0.92, 0]}>
          <mesh position={[0, -0.45, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.24, 0.9, 0.26]} />
            <meshStandardMaterial color={pants} />
          </mesh>
          <mesh position={[0, -0.88, 0.06]}>
            <boxGeometry args={[0.26, 0.12, 0.38]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
        {/* tronco */}
        <mesh position={[0, 1.3, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.66, 0.8, 0.38]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        {tie && (
          <mesh position={[0, 1.32, 0.2]}>
            <boxGeometry args={[0.1, 0.55, 0.02]} />
            <meshStandardMaterial color={tie} />
          </mesh>
        )}
        {sash && (
          <group position={[0, 1.3, 0]} rotation={[0, 0, -0.75]}>
            <mesh position={[0, 0, 0.2]}>
              <boxGeometry args={[0.16, 1.05, 0.02]} />
              <meshStandardMaterial color="#1f9d55" />
            </mesh>
            <mesh position={[0, 0, 0.212]}>
              <boxGeometry args={[0.07, 1.05, 0.02]} />
              <meshStandardMaterial color="#f2c230" />
            </mesh>
          </group>
        )}
        {/* braços */}
        <group ref={armL} position={[-0.43, 1.62, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.2, 0.72, 0.22]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh position={[0, -0.78, 0]}>
            <boxGeometry args={[0.16, 0.14, 0.16]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
        <group ref={armR} position={[0.43, 1.62, 0]}>
          <mesh position={[0, -0.36, 0]} castShadow={castShadow}>
            <boxGeometry args={[0.2, 0.72, 0.22]} />
            <meshStandardMaterial color={shirt} />
          </mesh>
          <mesh position={[0, -0.78, 0]}>
            <boxGeometry args={[0.16, 0.14, 0.16]} />
            <meshStandardMaterial color={skin} />
          </mesh>
        </group>
        {/* cabeça */}
        <group position={[0, 1.72 + 0.26 * hs, 0]} scale={hs}>
          <mesh castShadow={castShadow}>
            <boxGeometry args={[0.46, 0.5, 0.44]} />
            <meshStandardMaterial color={skin} />
          </mesh>
          {!bald && (
            <mesh position={[0, 0.24, -0.03]}>
              <boxGeometry args={[0.5, 0.12, 0.48]} />
              <meshStandardMaterial color={hair} />
            </mesh>
          )}
          {/* olhos */}
          <mesh position={[-0.1, 0.05, 0.225]}>
            <boxGeometry args={[0.07, 0.07, 0.01]} />
            <meshBasicMaterial color="#111" />
          </mesh>
          <mesh position={[0.1, 0.05, 0.225]}>
            <boxGeometry args={[0.07, 0.07, 0.01]} />
            <meshBasicMaterial color="#111" />
          </mesh>
          {hat && (
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.3, 0.3, 0.12, 10]} />
              <meshStandardMaterial color={hat} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
});

/** Versão barata (4 malhas) para multidões. */
export function SimplePerson({ shirt, skin = '#b07b5a', position, rotation, sign }: { shirt: string; skin?: string; position: [number, number, number]; rotation?: number; sign?: THREE.Texture }) {
  return (
    <group position={position} rotation={[0, rotation ?? 0, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 1.0, 0.3]} />
        <meshStandardMaterial color="#2f3440" />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.62, 0.75, 0.36]} />
        <meshStandardMaterial color={shirt} />
      </mesh>
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[0.42, 0.46, 0.4]} />
        <meshStandardMaterial color={skin} />
      </mesh>
      {sign && (
        <group position={[0.25, 2.4, 0.1]}>
          <mesh position={[0, -0.6, 0]}>
            <boxGeometry args={[0.05, 1.3, 0.05]} />
            <meshStandardMaterial color="#6b4f2a" />
          </mesh>
          <mesh position={[0, 0.25, 0.03]}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshStandardMaterial map={sign} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
}
