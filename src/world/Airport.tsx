import { useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { Sign } from './Landmarks';
import { AIRPORT } from './layout';
import { Person, SimplePerson, type AnimState } from './Person';
import { useStaticObstacles } from './useObstacles';

// ------------------------------------------------------------ Avião presidencial (fictício)
/** Escada com degraus e corrimãos. Topo junto à porta (x local ≈ 2,2; y ≈ 2,35), base no chão (x ≈ 6,2). */
function Stairs() {
  const steps = 10;
  const x0 = 2.25,
    x1 = 6.2,
    y0 = 2.35;
  const len = Math.hypot(x1 - x0, y0);
  const ang = Math.atan2(y0, x1 - x0);
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => {
        const k = (i + 0.5) / steps;
        return (
          <mesh key={i} position={[x0 + (x1 - x0) * k, y0 * (1 - k) - 0.06, 0]} castShadow receiveShadow>
            <boxGeometry args={[(x1 - x0) / steps + 0.05, 0.1, 1.3]} />
            <meshStandardMaterial color="#d8d8d8" metalness={0.4} roughness={0.5} />
          </mesh>
        );
      })}
      {[-0.68, 0.68].map((z) => (
        <group key={z}>
          {/* longarina */}
          <mesh position={[(x0 + x1) / 2, y0 / 2 - 0.15, z]} rotation={[0, 0, -ang]}>
            <boxGeometry args={[len, 0.25, 0.08]} />
            <meshStandardMaterial color="#9aa3ad" metalness={0.6} />
          </mesh>
          {/* corrimão */}
          <mesh position={[(x0 + x1) / 2, y0 / 2 + 0.85, z]} rotation={[0, 0, -ang]}>
            <boxGeometry args={[len, 0.06, 0.06]} />
            <meshStandardMaterial color="#c9a227" metalness={0.7} />
          </mesh>
          {[0.1, 0.5, 0.9].map((k) => (
            <mesh key={k} position={[x0 + (x1 - x0) * k, y0 * (1 - k) + 0.42, z]}>
              <boxGeometry args={[0.05, 0.85, 0.05]} />
              <meshStandardMaterial color="#9aa3ad" />
            </mesh>
          ))}
        </group>
      ))}
      {/* plataforma do topo e caminhão da escada */}
      <mesh position={[x0 - 0.05, y0 - 0.06, 0]}>
        <boxGeometry args={[0.5, 0.1, 1.4]} />
        <meshStandardMaterial color="#cfcfcf" />
      </mesh>
      <mesh position={[x1 - 0.4, 0.35, 1.3]} castShadow>
        <boxGeometry args={[2.4, 0.7, 0.9]} />
        <meshStandardMaterial color="#2f6db5" />
      </mesh>
    </group>
  );
}

/** Nariz aponta para +z local; lado direito (+x local) tem a porta. Piso da porta ≈ 2,35. */
const Plane = forwardRef<THREE.Group, { animate?: boolean }>(function Plane({ animate }, ref) {
  const livery = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f4f4f2', metalness: 0.25, roughness: 0.35 }), []);
  const stairs = useRef<THREE.Group>(null);
  const doorMat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const k = animate ? Math.max(0, Math.min(1, (runtime.introT - 11.2) / 1.4)) : 1;
    if (stairs.current) {
      stairs.current.visible = k > 0.01;
      stairs.current.position.x = (1 - k) * 4;
    }
    if (doorMat.current) doorMat.current.color.set(!animate || runtime.introT > 11.6 ? '#0d0d0d' : '#d9d9d6');
  });
  return (
    <group ref={ref}>
      {/* fuselagem */}
      <group position={[0, 3.2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={livery}>
          <cylinderGeometry args={[2, 2, 24, 24]} />
        </mesh>
        <mesh position={[0, 0, 12]} scale={[1, 1, 1.5]} castShadow material={livery}>
          <sphereGeometry args={[2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        {/* para-brisa */}
        <mesh position={[0, 0.75, 13.6]} rotation={[-0.75, 0, 0]}>
          <boxGeometry args={[1.9, 0.45, 0.9]} />
          <meshStandardMaterial color="#1b2a3a" metalness={0.7} roughness={0.15} />
        </mesh>
        {/* cauda afunilada e levemente erguida */}
        <mesh position={[0, 0.3, -15.05]} rotation={[-Math.PI / 2 - 0.08, 0, 0]} castShadow material={livery}>
          <cylinderGeometry args={[0.55, 2, 6.6, 24]} />
        </mesh>
        {/* janelas e faixas */}
        {[-1, 1].map((sx) => (
          <group key={sx} rotation={[0, (sx * Math.PI) / 2, 0]}>
            <mesh position={[0, 0.55, sx * 2.005]} rotation={[0, sx > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[21, 0.32]} />
              <meshStandardMaterial color="#1b2a3a" />
            </mesh>
            <mesh position={[0, -0.35, sx * 2.005]} rotation={[0, sx > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[24, 0.34]} />
              <meshStandardMaterial color="#1f9d55" />
            </mesh>
            <mesh position={[0, -0.66, sx * 2.005]} rotation={[0, sx > 0 ? 0 : Math.PI, 0]}>
              <planeGeometry args={[24, 0.18]} />
              <meshStandardMaterial color="#f2c230" />
            </mesh>
          </group>
        ))}
        <Sign lines={['REPÚBLICA FICTÍCIA DO BRASIL']} w={11} h={0.8} pos={[2.01, 1.25, -2]} rot={Math.PI / 2} bg="#f4f4f2" fg="#1f2a44" emissive={0.05} res={[1024, 80]} />
        {/* porta */}
        <mesh position={[2.01, -0.05, 8.5]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[1.1, 1.9]} />
          <meshStandardMaterial ref={doorMat} color="#0d0d0d" side={THREE.DoubleSide} />
        </mesh>
        {/* deriva (leme vertical) presa na cauda */}
        <mesh position={[0, 2.9, -16.2]} rotation={[-0.5, 0, 0]} castShadow material={livery}>
          <boxGeometry args={[0.28, 4.6, 3]} />
        </mesh>
        <mesh position={[0, 3.3, -16.45]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.3, 1.2, 3]} />
          <meshStandardMaterial color="#1f9d55" />
        </mesh>
        {/* estabilizadores horizontais */}
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * 2.3, 0.75, -16.6]} rotation={[0, sx * 0.4, 0]} castShadow material={livery}>
            <boxGeometry args={[4.4, 0.18, 1.8]} />
          </mesh>
        ))}
        {/* asas baixas, enflechadas */}
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh position={[sx * 6.6, -1.15, 0.3]} rotation={[0, sx * 0.38, sx * -0.05]} castShadow material={livery}>
              <boxGeometry args={[10.5, 0.3, 3.6]} />
            </mesh>
            {/* motor sob a asa */}
            <mesh position={[sx * 5.2, -2.05, 2.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.7, 0.62, 3, 16]} />
              <meshStandardMaterial color="#9aa3ad" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[sx * 5.2, -1.5, 2.2]}>
              <boxGeometry args={[0.2, 0.7, 1.6]} />
              <meshStandardMaterial color="#9aa3ad" />
            </mesh>
          </group>
        ))}
      </group>
      {/* trem de pouso */}
      {[
        [0, 10, 0.5],
        [-2.2, -0.6, 0.6],
        [2.2, -0.6, 0.6],
      ].map(([gx, gz, r], i) => (
        <group key={i}>
          <mesh position={[gx, 1.3, gz]}>
            <boxGeometry args={[0.15, 1.6, 0.15]} />
            <meshStandardMaterial color="#666" />
          </mesh>
          <mesh position={[gx, r, gz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[r, r, 0.45, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      {/* escada encostada na porta */}
      <group position={[0, 0, 8.5]}>
        <group ref={stairs}>
          <Stairs />
        </group>
      </group>
    </group>
  );
});

// ------------------------------------------------------------ Primeira-Dama (fictícia) com sacolas
function ShoppingBags() {
  const colors = ['#e63946', '#f4a261', '#2a9d8f', '#ff70a6', '#ffd166', '#8338ec', '#06d6a0'];
  return (
    <group>
      {colors.map((c, i) => (
        <mesh key={i} position={[(i % 2 ? 0.55 : -0.55) + (i > 3 ? (i % 2 ? 0.25 : -0.25) : 0), 0.75 - (i % 3) * 0.12, 0.05 + (i % 3) * 0.12]} castShadow>
          <boxGeometry args={[0.38, 0.5, 0.16]} />
          <meshStandardMaterial color={c} />
        </mesh>
      ))}
    </group>
  );
}

export const FirstLady = forwardRef<THREE.Group, { anim?: React.MutableRefObject<AnimState> }>(function FirstLady({ anim }, ref) {
  return (
    <group ref={ref}>
      <Person shirt="#c9184a" pants="#590d22" skin="#e8b98f" hair="#b08968" anim={anim} />
      {/* óculos escuros */}
      <mesh position={[0, 2.06, 0.23]}>
        <boxGeometry args={[0.36, 0.08, 0.02]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <ShoppingBags />
    </group>
  );
});

// ------------------------------------------------------------ Base aérea
export function Airport() {
  const screen = useGame((s) => s.screen);
  const { runwayX1, runwayX2, runwayZ, terminal } = AIRPORT;
  const marks = useMemo(() => Array.from({ length: 9 }, (_, i) => runwayX1 + 6 + i * 9.5), [runwayX1]);
  useStaticObstacles([
    [139, -164.2, 0.45],
    [134, -160, 0.4],
    [135.5, -159, 0.4],
    [133, -158.5, 0.4],
  ]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(runwayX1 + runwayX2) / 2, 0.03, runwayZ]} receiveShadow>
        <planeGeometry args={[runwayX2 - runwayX1, 16]} />
        <meshStandardMaterial color="#3a3c40" />
      </mesh>
      {marks.map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.045, runwayZ]}>
          <planeGeometry args={[5, 0.5]} />
          <meshBasicMaterial color="#f1f1f1" />
        </mesh>
      ))}
      {/* pátio até a rua */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[140, 0.025, -155]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#8b8b85" />
      </mesh>
      {/* tapete vermelho */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[141, 0.05, -166]}>
        <planeGeometry args={[1.6, 6]} />
        <meshStandardMaterial color="#b3001b" />
      </mesh>
      {/* terminal */}
      <mesh position={[terminal.x, 3, terminal.z]} castShadow receiveShadow>
        <boxGeometry args={[terminal.w, 6, terminal.d]} />
        <meshStandardMaterial color="#d9d4c7" />
      </mesh>
      <mesh position={[terminal.x, 2.4, terminal.z + terminal.d / 2 + 0.02]}>
        <planeGeometry args={[terminal.w - 2, 3]} />
        <meshStandardMaterial color="#4f6d7a" metalness={0.5} roughness={0.2} />
      </mesh>
      <Sign lines={['BASE AÉREA DE BRASÍLIA (FICTÍCIA)']} w={12} h={1} pos={[terminal.x, 5.3, terminal.z - terminal.d / 2 - 0.03]} rot={Math.PI} bg="#0d3b66" fg="#fff" emissive={0.3} res={[1024, 96]} />
      <Sign lines={['BEM-VINDO DE VOLTA, PRESIDENTE!', '47ª viagem internacional do ano']} w={6} h={1.4} pos={[134, 2.6, -162]} rot={Math.PI / 2} bg="#f2c230" fg="#0b1d2e" emissive={0.3} mount="posts" />
      {/* jornalistas */}
      {[
        [134, -160],
        [135.5, -159],
        [133, -158.5],
      ].map(([x, z], i) => (
        <group key={i}>
          <SimplePerson position={[x, 0, z]} rotation={Math.PI / 2 + 0.3} shirt={['#333', '#5c677d', '#7d8597'][i]} />
          <mesh position={[x + 0.4, 1.9, z + 0.15]}>
            <boxGeometry args={[0.35, 0.3, 0.5]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      ))}
      {screen !== 'intro' && (
        <>
          <group position={[AIRPORT.planeX, 0, AIRPORT.planeZ]} rotation={[0, -Math.PI / 2, 0]}>
            <Plane />
          </group>
          <group position={[139, 0, -164.2]} rotation={[0, 0.6, 0]}>
            <FirstLady />
          </group>
        </>
      )}
    </group>
  );
}

// ------------------------------------------------------------ Cena de abertura
export const INTRO_LENGTH = 26;
const LINES: [number, string, string][] = [
  [0, '', 'Ano 203X. O Brasil enfrenta a pior crise da sua história (fictícia).'],
  [4.5, '', 'Enquanto o país aperta o cinto, o Presidente volta de mais uma viagem à Europa — a 47ª do ano.'],
  [10, '', 'Base Aérea de Brasília. O pouso foi suave. A economia, nem tanto.'],
  [13.5, '', 'A Primeira-Dama desembarca com catorze sacolas de compras. Duty free, claro.'],
  [16.5, 'Primeira-Dama', '"Querido, Paris estava uma pechincha... perto do preço da picanha daqui."'],
  [19.5, 'Assessor, correndo', '"Presidente! A inflação disparou, a dívida subiu e... a picanha sumiu!"'],
  [23, 'Presidente', '"Sumiu? Então vamos procurar. Chamem o carro oficial."'],
];

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3));
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();
const look = new THREE.Vector3();

export function IntroScene() {
  const screen = useGame((s) => s.screen);
  const { camera } = useThree();
  const plane = useRef<THREE.Group>(null);
  const pitch = useRef<THREE.Group>(null);
  const pres = useRef<THREE.Group>(null);
  const lady = useRef<THREE.Group>(null);
  const aide = useRef<THREE.Group>(null);
  const presAnim = useRef<AnimState>({ phase: 0, speed: 0 });
  const ladyAnim = useRef<AnimState>({ phase: 0, speed: 0 });
  const aideAnim = useRef<AnimState>({ phase: 0, speed: 0 });
  const lineIdx = useRef(-1);

  useFrame((_, dtRaw) => {
    if (useGame.getState().screen !== 'intro') return;
    const dt = Math.min(dtRaw, 0.05);
    runtime.introT += dt;
    const t = runtime.introT;
    // legendas
    let li = 0;
    for (let i = 0; i < LINES.length; i++) if (t >= LINES[i][0]) li = i;
    if (li !== lineIdx.current) {
      lineIdx.current = li;
      useGame.getState().set({ introLine: { speaker: LINES[li][1], text: LINES[li][2] } });
    }
    if (t >= INTRO_LENGTH) {
      useGame.getState().finishIntro();
      return;
    }
    // avião
    let px: number, py: number, pp: number;
    if (t < 6) {
      const k = t / 6;
      px = lerp(340, 200, k);
      py = 34 * Math.pow(1 - k, 1.6);
      pp = 0.05 + 0.08 * k;
    } else {
      const k = ease(seg(t, 6, 11.5));
      px = lerp(200, AIRPORT.planeX, k);
      py = 0;
      pp = Math.max(0, 0.13 * (1 - seg(t, 6, 7.2)));
    }
    if (plane.current) plane.current.position.set(px, py, AIRPORT.planeZ);
    if (pitch.current) pitch.current.rotation.x = -pp;
    // presidente: porta → escada → tapete
    const walk = (ref: React.RefObject<THREE.Group>, anim: React.MutableRefObject<AnimState>, t0: number) => {
      const g = ref.current;
      if (!g) return;
      g.visible = t > t0;
      const a = seg(t, t0, t0 + 2.4);
      const b = seg(t, t0 + 2.4, t0 + 4.6);
      if (a < 1) {
        g.position.set(141, lerp(2.35, 0.02, a), lerp(-172.75, -168.8, a));
      } else {
        g.position.set(141 + (ref === lady ? lerp(0, -2, b) : 0), 0, lerp(-168.8, ref === lady ? -164.2 : -163, b));
      }
      g.rotation.y = 0;
      anim.current.speed = t > t0 && b < 1 ? 1 : 0;
      anim.current.phase += dt * 8 * anim.current.speed;
    };
    walk(pres, presAnim, 13);
    walk(lady, ladyAnim, 14.4);
    // assessor correndo
    if (aide.current) {
      const k = seg(t, 18.6, 20.8);
      aide.current.visible = t > 18.6;
      aide.current.position.set(lerp(156, 142.3, k), 0, lerp(-152, -161.6, k));
      aide.current.rotation.y = Math.atan2(142.3 - 156, -161.6 + 152);
      aideAnim.current.speed = k > 0 && k < 1 ? 2 : 0;
      aideAnim.current.phase += dt * 13 * aideAnim.current.speed;
    }
    // câmera
    if (t < 6) {
      tmpPos.set(212, 3.5, -152);
      tmpLook.set(px, py + 3, AIRPORT.planeZ);
    } else if (t < 11.5) {
      tmpPos.set(170, 4, -156);
      tmpLook.set(px, 3, AIRPORT.planeZ);
    } else if (t < 18.5) {
      tmpPos.set(146.5, 3.4, -158.5);
      tmpLook.set(141, 2.2, -169);
    } else {
      tmpPos.set(146, 2.8, -156.5);
      tmpLook.set(141.5, 1.7, -163.5);
    }
    const k = 1 - Math.exp(-dt * (t < 6 ? 8 : 2.5));
    camera.position.lerp(tmpPos, k);
    look.lerp(tmpLook, k);
    camera.lookAt(look);
  });

  if (screen !== 'intro') return null;
  return (
    <group>
      <group ref={plane} position={[340, 34, AIRPORT.planeZ]}>
        <group rotation={[0, -Math.PI / 2, 0]}>
          <group ref={pitch}>
            <Plane animate />
          </group>
        </group>
      </group>
      <group ref={pres} visible={false}>
        <Person shirt="#1b2431" pants="#1b2431" sash tie="#8a1c2b" hair="#d4d4d4" skin="#d39a76" headScale={1.22} anim={presAnim} />
      </group>
      <group ref={lady} visible={false}>
        <FirstLady anim={ladyAnim} />
      </group>
      <group ref={aide} visible={false}>
        <Person shirt="#ffffff" pants="#2b2d42" tie="#1d3557" skin="#c68642" hair="#1b1b1b" anim={aideAnim} />
      </group>
    </group>
  );
}
