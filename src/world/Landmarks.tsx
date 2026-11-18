import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { brl, fuelPrices } from '../economy/model';
import { P } from '../game/places';
import { useGame } from '../game/store';
import { MISSIONS } from '../missions/data';
import { textTexture } from '../game/textures';
import { useHealth } from './City';
import { Person } from './Person';
import { Car } from './Car';
import { CONGRESS, PLANALTO, POSTO, SUPREMO } from './layout';

interface SignProps {
  lines: string[];
  w: number;
  h: number;
  pos: [number, number, number];
  rot?: number;
  bg?: string;
  fg?: string;
  border?: string;
  emissive?: number;
  res?: [number, number];
  /** posts: dois postes até o chão · hang: cabos até o teto (hangTo) · flush: colada numa parede */
  mount?: 'posts' | 'hang' | 'flush';
  hangTo?: number;
  frame?: string;
}

/** Placa com moldura e suporte — nunca flutua solta no ar. */
function Sign({ lines, w, h, pos, rot = 0, bg = '#123b2c', fg = '#f7f1da', border, emissive = 0.3, res = [1024, 256], mount = 'flush', hangTo = 9, frame = '#2b2d31' }: SignProps) {
  const t = useMemo(() => textTexture('sign', lines, { w: res[0], h: res[1], bg, fg, border }), [lines.join('|'), bg, fg, border]);
  const poleH = pos[1] - h / 2;
  const wireH = hangTo - (pos[1] + h / 2);
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      {mount !== 'flush' && (
        <mesh position={[0, 0, -0.06]} castShadow>
          <boxGeometry args={[w + 0.16, h + 0.16, 0.1]} />
          <meshStandardMaterial color={frame} roughness={0.6} metalness={0.3} />
        </mesh>
      )}
      <mesh position={[0, 0, mount === 'flush' ? 0 : 0.005]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={t} emissive="#ffffff" emissiveMap={t} emissiveIntensity={emissive} />
      </mesh>
      {mount === 'posts' && poleH > 0 &&
        [-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (w / 2 - Math.min(0.3, w * 0.12)), -h / 2 - poleH / 2, -0.06]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, poleH, 8]} />
            <meshStandardMaterial color="#5f6368" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      {mount === 'hang' && wireH > 0 &&
        [-1, 1].map((sx) => (
          <mesh key={sx} position={[sx * (w / 2 - 0.3), h / 2 + wireH / 2, -0.06]}>
            <cylinderGeometry args={[0.015, 0.015, wireH, 4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
    </group>
  );
}
export { Sign };

function Congress() {
  const h = useHealth();
  const { x, z } = CONGRESS;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[70, 3, 26]} />
        <meshStandardMaterial color="#ece9e1" />
      </mesh>
      {[-3.2, 3.2].map((tx) => (
        <mesh key={tx} position={[tx, 25, -5]} castShadow>
          <boxGeometry args={[5, 44, 8]} />
          <meshStandardMaterial color="#e4e1d8" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 38, -5]}>
        <boxGeometry args={[1.6, 3, 7]} />
        <meshStandardMaterial color="#d8d4ca" />
      </mesh>
      {/* cúpula */}
      <mesh position={[-20, 3, 2]} castShadow>
        <sphereGeometry args={[9, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f2f0ea" />
      </mesh>
      {/* "cuia" invertida */}
      <mesh position={[20, 3 + 9 * 0.55, 2]} rotation={[Math.PI, 0, 0]} scale={[1.25, 0.55, 1.25]} castShadow>
        <sphereGeometry args={[9, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f2f0ea" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[20, 4, 2]}>
        <cylinderGeometry args={[2, 3, 2, 12]} />
        <meshStandardMaterial color="#dcd8cf" />
      </mesh>
      {/* andaimes: funciona em condições precárias */}
      {h < 0.6 && (
        <group position={[6, 3, 10]}>
          {[0, 3, 6].map((i) => (
            <mesh key={i} position={[i, 4, 0]}>
              <boxGeometry args={[0.2, 8, 0.2]} />
              <meshStandardMaterial color="#8a6b3c" />
            </mesh>
          ))}
          <mesh position={[3, 7.5, 0.2]}>
            <boxGeometry args={[7, 0.2, 1.4]} />
            <meshStandardMaterial color="#8a6b3c" />
          </mesh>
          <mesh position={[3, 4, 0.3]}>
            <planeGeometry args={[6.5, 5]} />
            <meshStandardMaterial color="#2f6db5" transparent opacity={0.75} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      <Sign lines={['CONGRESSO NACIONAL', h < 0.6 ? 'FUNCIONANDO (MAIS OU MENOS)' : 'FUNCIONANDO (ATÉ QUE BEM)']} w={18} h={3} pos={[0, 2.2, 13.06]} bg="#f4f1e8" fg="#1f2a44" emissive={0.1} />
    </group>
  );
}

function Planalto() {
  const { x, z, w, d } = PLANALTO;
  const cols = useMemo(() => {
    const a: [number, number][] = [];
    for (let i = 0; i < 9; i++) {
      const cx = -w / 2 + 2 + (i * (w - 4)) / 8;
      a.push([cx, d / 2]);
      a.push([cx, -d / 2]);
    }
    return a;
  }, [w, d]);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <boxGeometry args={[w + 4, 1, d + 4]} />
        <meshStandardMaterial color="#e2ded3" />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[w - 6, 7, d - 6]} />
        <meshStandardMaterial color="#5d7c8c" metalness={0.5} roughness={0.15} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 8.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.8, d]} />
        <meshStandardMaterial color="#f3f1ea" />
      </mesh>
      {cols.map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 4.6, cz]} castShadow>
          <boxGeometry args={[0.5, 7.4, 0.9]} />
          <meshStandardMaterial color="#f5f3ee" />
        </mesh>
      ))}
      {/* rampa */}
      <mesh position={[-10, 0.6, d / 2 + 5]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[6, 0.3, 10]} />
        <meshStandardMaterial color="#e8e4da" />
      </mesh>
      <Sign lines={['PALÁCIO DO PLANALTO']} w={14} h={1.6} pos={[0, 9.6, d / 2 + 0.02]} bg="#f4f1e8" fg="#1f2a44" emissive={0.1} res={[1024, 128]} />
    </group>
  );
}

function TaxMachine() {
  const gear = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((st) => {
    if (gear.current) gear.current.rotation.z = st.clock.elapsedTime * 1.5;
    if (lamp.current) lamp.current.emissiveIntensity = 1 + Math.sin(st.clock.elapsedTime * 6) * 0.8;
  });
  const [x, z] = P.taxMachine;
  return (
    <group position={[x, 0, z]} rotation={[0, 0, 0]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <boxGeometry args={[2.6, 3.2, 1.8]} />
        <meshStandardMaterial color="#a83232" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 3.6, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.8, 8]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      <mesh ref={gear} position={[0.6, 2.2, 0.92]}>
        <cylinderGeometry args={[0.55, 0.55, 0.1, 8]} />
        <meshStandardMaterial color="#d4a017" metalness={0.8} />
      </mesh>
      <mesh position={[-0.6, 2.4, 0.92]}>
        <sphereGeometry args={[0.18, 10, 8]} />
        <meshStandardMaterial ref={lamp} color="#ffdc5e" emissive="#ffb300" />
      </mesh>
      <mesh position={[0, 0.9, 0.93]}>
        <boxGeometry args={[1.4, 0.4, 0.05]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Sign lines={['MÁQUINA DE IMPOSTOS 3000', '(não aperte o botão errado)']} w={3} h={0.8} pos={[0, 3.6, 0.85]} bg="#111" fg="#ffd84a" emissive={0.6} mount="posts" frame="#7a1f1f" />
    </group>
  );
}

function Cofre() {
  const [x, z] = P.cofre;
  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[2.6, 2.8, 2]} />
        <meshStandardMaterial color="#5b6168" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.4, 1.01]}>
        <planeGeometry args={[2.1, 2.3]} />
        <meshStandardMaterial color="#0b0b0b" />
      </mesh>
      <mesh position={[-1.6, 1.4, 1.6]} rotation={[0, -1.1, 0]} castShadow>
        <boxGeometry args={[2.1, 2.3, 0.25]} />
        <meshStandardMaterial color="#6e757d" metalness={0.7} roughness={0.3} />
      </mesh>
      <Sign lines={['COFRE DO TESOURO', 'conteúdo: 1 traça']} w={2.6} h={0.7} pos={[0, 3.25, 0.9]} bg="#222" fg="#e9e9e9" emissive={0.4} mount="posts" />
    </group>
  );
}

function Palanque() {
  const [x, z] = P.palanque;
  const debate = useGame((s) => MISSIONS[s.missionIndex]?.id === 'm9');
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, -1]} castShadow receiveShadow>
        <boxGeometry args={[7, 1, 4]} />
        <meshStandardMaterial color="#7a5230" />
      </mesh>
      <mesh position={[0, 1.6, -0.2]} castShadow>
        <boxGeometry args={[0.9, 1.2, 0.6]} />
        <meshStandardMaterial color="#1f5f99" />
      </mesh>
      <Sign lines={debate ? ['DEBATE NA TV — AO VIVO', 'Presidente × Dr. Teodoro Talvez'] : ['PLANO DE RECUPERAÇÃO', '(versão 1.0 — sem bugs, esperamos)']} w={6.5} h={1.4} pos={[0, 3.6, -2.9]} bg="#f2c230" fg="#14324a" emissive={0.2} mount="posts" />
    </group>
  );
}

function Plenario() {
  const [x, z] = P.plenario;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[3.2, 0.12, 1.4]} />
        <meshStandardMaterial color="#5a3d26" />
      </mesh>
      {[-1.4, 1.4].map((sx) => (
        <mesh key={sx} position={[sx, 0.4, 0]}>
          <boxGeometry args={[0.12, 0.8, 1.2]} />
          <meshStandardMaterial color="#4a3220" />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-0.8 + i * 0.4, 0.9 + i * 0.04, 0]} rotation={[0, i * 0.3, 0]}>
          <boxGeometry args={[0.5, 0.04, 0.7]} />
          <meshStandardMaterial color="#f5f5f0" />
        </mesh>
      ))}
      <Sign lines={['MESA DE NEGOCIAÇÃO', 'PACOTE DE REFORMAS']} w={3} h={0.8} pos={[0, 2.2, -0.75]} bg="#0f2a4a" fg="#ffd84a" emissive={0.5} mount="posts" />
    </group>
  );
}

function Estoque() {
  const supply = useGame((s) => Math.round(s.econ.lev.foodSupply * 20) / 20);
  const [x, z] = P.estoque;
  const n = Math.max(2, Math.min(18, Math.round((supply - 0.7) * 50)));
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }).map((_, i) => (
        <mesh key={i} castShadow position={[(i % 3) * 1.3 - 1.3, 0.55 + Math.floor(i / 9) * 1.1, (Math.floor(i / 3) % 3) * 1.3 - 1.3]}>
          <boxGeometry args={[1.2, 1.05, 1.2]} />
          <meshStandardMaterial color={i % 2 ? '#b58b52' : '#a0763f'} />
        </mesh>
      ))}
      <Sign lines={['ESTOQUES REGULADORES', `nível: ${Math.round(supply * 100)}%`]} w={3.2} h={0.9} pos={[0, 2.6, 2.4]} bg="#2a2a2a" fg="#f5f5f5" emissive={0.4} mount="posts" />
    </group>
  );
}

function Posto() {
  const econ = useGame((s) => s.econ);
  const { gas, diesel } = fuelPrices(econ);
  const board = useMemo(
    () => textTexture('posto', ['POSTO ESPERANÇA', `GASOLINA  ${brl(gas)}`, `DIESEL  ${brl(diesel)}`], { w: 512, h: 512, bg: '#0d3b66', fg: '#ffd166' }),
    [gas.toFixed(2), diesel.toFixed(2)],
  );
  const { x, z } = POSTO;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 6, 2]} castShadow>
        <boxGeometry args={[26, 0.7, 16]} />
        <meshStandardMaterial color="#f4f4f4" />
      </mesh>
      <mesh position={[0, 6.4, 2]}>
        <boxGeometry args={[26.2, 0.25, 16.2]} />
        <meshStandardMaterial color="#1f9d55" />
      </mesh>
      {[
        [-11, -5],
        [11, -5],
        [-11, 9],
        [11, 9],
      ].map(([cx, cz], i) => (
        <mesh key={i} position={[cx, 3, cz]} castShadow>
          <boxGeometry args={[0.6, 6, 0.6]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>
      ))}
      {[-6, 0, 6].map((px) => (
        <group key={px} position={[px, 0, 4]}>
          <mesh position={[0, 1, 0]} castShadow>
            <boxGeometry args={[1, 2, 0.7]} />
            <meshStandardMaterial color={px === 0 ? '#ffb703' : '#e63946'} />
          </mesh>
          <mesh position={[0, 1.5, 0.36]}>
            <planeGeometry args={[0.7, 0.5]} />
            <meshStandardMaterial color="#111" emissive="#2a9d8f" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      {/* loja de conveniência */}
      <mesh position={[0, 2.5, 18]} castShadow receiveShadow>
        <boxGeometry args={[16, 5, 8]} />
        <meshStandardMaterial color="#e9e4d8" />
      </mesh>
      <Sign lines={['CONVENIÊNCIA — CAFÉ A PREÇO DE OURO']} w={12} h={1.2} pos={[0, 4.2, 13.97]} rot={Math.PI} bg="#e63946" fg="#fff" emissive={0.4} res={[1024, 128]} />
      {/* totem de preços */}
      <group position={[24, 0, -12]}>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[0.6, 8, 0.6]} />
          <meshStandardMaterial color="#888" />
        </mesh>
        <mesh position={[0, 7.5, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[5, 5]} />
          <meshStandardMaterial map={board} emissive="#ffffff" emissiveMap={board} emissiveIntensity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function Chimney() {
  const puffs = useRef<THREE.Group>(null);
  const h = useHealth();
  useFrame((st, dt) => {
    const g = puffs.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      c.position.y += dt * (2 + i * 0.1);
      c.position.x += dt * 1.2;
      const s = 1 + (c.position.y - 30) * 0.12;
      c.scale.setScalar(Math.max(0.5, s));
      if (c.position.y > 50) {
        c.position.set(0, 30, 0);
      }
    });
    void st;
  });
  return (
    <group position={[-118, 0, -178]}>
      <mesh position={[0, 15, 0]} castShadow>
        <cylinderGeometry args={[1.4, 2, 30, 10]} />
        <meshStandardMaterial color="#7a4b3a" />
      </mesh>
      <group ref={puffs}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} position={[i * 0.6, 30 + i * 2.5, 0]}>
            <icosahedronGeometry args={[1.5, 0]} />
            <meshStandardMaterial color={h < 0.5 ? '#3f3f3f' : '#bdbdbd'} transparent opacity={0.55} flatShading />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Suprema Corte Fictícia: prédio branco com colunata. */
function Supremo() {
  const { x, z, w, d } = SUPREMO;
  const cols = Array.from({ length: 8 }, (_, i) => -w / 2 + 1.2 + (i * (w - 2.4)) / 7);
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.4, 0]} receiveShadow>
        <boxGeometry args={[w + 3, 0.8, d + 3]} />
        <meshStandardMaterial color="#e6e2d8" />
      </mesh>
      <mesh position={[0, 4.4, 0]} castShadow>
        <boxGeometry args={[w - 4, 7.2, d - 4]} />
        <meshStandardMaterial color="#4f6d7a" metalness={0.5} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 8.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.9, d]} />
        <meshStandardMaterial color="#f5f3ee" />
      </mesh>
      {cols.map((cx) =>
        [d / 2 - 0.3, -d / 2 + 0.3].map((cz) => (
          <mesh key={`${cx}${cz}`} position={[cx, 4.4, cz]} castShadow>
            <cylinderGeometry args={[0.25, 0.4, 7.2, 8]} />
            <meshStandardMaterial color="#f8f7f3" />
          </mesh>
        )),
      )}
      <Sign lines={['SUPREMA CORTE FICTÍCIA']} w={12} h={1.3} pos={[0, 9.6, d / 2 + 0.02]} bg="#f4f1e8" fg="#1f2a44" emissive={0.1} res={[1024, 128]} mount="posts" frame="#d8d4c8" />
    </group>
  );
}

/** A "sessão": um só ministro ocupa as quatro cadeiras. */
function Tribunal() {
  const seats: [string, number][] = [
    ['RÉU', -54.5],
    ['ADVOGADO', -51.5],
    ['PROMOTOR', -48.5],
    ['JUIZ', -45.5],
  ];
  const z = -147.4;
  return (
    <group>
      <mesh position={[-50, 0.55, z]} castShadow>
        <boxGeometry args={[12.4, 1.1, 1.2]} />
        <meshStandardMaterial color="#3e2a1b" />
      </mesh>
      <mesh position={[-50, 1.12, z]}>
        <boxGeometry args={[12.6, 0.06, 1.3]} />
        <meshStandardMaterial color="#5c3d26" />
      </mesh>
      {seats.map(([label, sx], i) => (
        <group key={label}>
          <Sign lines={[label]} w={2.4} h={0.55} pos={[sx, 0.62, z + 0.62]} bg={label === 'JUIZ' ? '#7a1f1f' : '#1f2a44'} fg="#ffd84a" emissive={0.35} res={[512, 128]} />
          {/* cadeira de espaldar alto */}
          <mesh position={[sx, 1.6, z - 1.7]} castShadow>
            <boxGeometry args={[1, 3.2, 0.2]} />
            <meshStandardMaterial color={label === 'JUIZ' ? '#6b1d1d' : '#2a2a2a'} />
          </mesh>
          {label !== 'JUIZ' && (
            <group position={[sx, 0, z - 1.1]}>
              <Person shirt="#0d0d0d" pants="#0d0d0d" tie="#f5f5f5" skin="#f1c27d" hair="#4a4a4a" castShadow={false} rotation={[0, 0, 0]} />
            </group>
          )}
          {i === 0 && <Sign lines={['Sessão do Ministro Onipotêncio Toga', 'Réu, advogado, promotor e juiz: ele mesmo']} w={7} h={1.1} pos={[-50, 3.9, z - 1.5]} bg="#f4f1e8" fg="#7a1f1f" emissive={0.2} res={[1024, 160]} mount="posts" />}
        </group>
      ))}
    </group>
  );
}

/** Monumento dos Três Poderes: as colunas mostram o equilíbrio entre os Poderes. */
function TresPoderes() {
  const inst = useGame((s) => Math.round((s.econ.lev.institutions ?? 0) * 2) / 2);
  const [x, z] = P.monumento;
  const hExec = 3.2 + inst * 0.08;
  const hLeg = 3.2 + inst * 0.08;
  const hJud = Math.max(1, 3.2 - inst * 0.4);
  const pillars: [string, number, number, string][] = [
    ['EXECUTIVO', -2.2, hExec, '#1f9d55'],
    ['LEGISLATIVO', 0, hLeg, '#2f6db5'],
    ['JUDICIÁRIO', 2.2, hJud, '#8a2432'],
  ];
  const balanced = Math.abs(inst) < 2.5 || inst > 2.5;
  return (
    <group position={[x, 0, z - 2.5]}>
      <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[7.4, 0.7, 2.2]} />
        <meshStandardMaterial color="#9a9488" />
      </mesh>
      {pillars.map(([label, px, h, c]) => (
        <group key={label}>
          <mesh position={[px, 0.7 + h / 2, 0]} castShadow>
            <boxGeometry args={[1.2, h, 1.2]} />
            <meshStandardMaterial color={c} />
          </mesh>
          <Sign lines={[label]} w={2} h={0.45} pos={[px, 0.36, 1.11]} bg="#2b2d31" fg="#fff" emissive={0.3} res={[512, 112]} />
        </group>
      ))}
      <Sign
        lines={balanced && inst > 2.5 ? ['OS TRÊS PODERES', 'independentes e em equilíbrio'] : ['OS TRÊS PODERES', inst < -2.5 ? 'um deles cresceu demais' : 'equilíbrio frágil']}
        w={3.6}
        h={0.9}
        pos={[-6.2, 1.5, 0.4]}
        bg={inst > 2.5 ? '#1f9d55' : inst < -2.5 ? '#7a1f1f' : '#5c5c5c'}
        fg="#fff"
        emissive={0.3}
        mount="posts"
      />
    </group>
  );
}

/** Caneta Gigante na frente do Banco Central (missão dos juros). */
function CanetaGigante() {
  const [x, z] = P.caneta;
  const pen = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (pen.current) pen.current.rotation.z = 0.5 + Math.sin(st.clock.elapsedTime * 1.2) * 0.05;
  });
  return (
    <group position={[x, 0, z]} rotation={[0, -Math.PI / 2, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[3, 1, 1.6]} />
        <meshStandardMaterial color="#5a3d26" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.6, 0.03, 1.1]} />
        <meshStandardMaterial color="#f8f8f2" />
      </mesh>
      <group ref={pen} position={[0.2, 1.5, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.14, 0.14, 2.6, 10]} />
          <meshStandardMaterial color="#1d3557" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -1.45, 0]}>
          <coneGeometry args={[0.14, 0.3, 10]} />
          <meshStandardMaterial color="#d4a017" metalness={0.8} />
        </mesh>
      </group>
      <Sign lines={['CANETA DOS JUROS', '(efeitos colaterais não inclusos)']} w={2.8} h={0.7} pos={[0, 2.9, -0.7]} bg="#111" fg="#ffd84a" emissive={0.5} mount="posts" />
    </group>
  );
}

/** Impostômetro do jogo: contador simulado + chamada para o site de transparência. */
function Impostometro() {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    return c;
  }, []);
  const tex = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);
  const acc = useRef({ total: 1.2e12, last: 0 });
  useFrame((st, dt) => {
    const tax = useGame.getState().econ.ind.taxBurden;
    // PIB fictício de R$ 12 tri/ano: arrecadação simulada por segundo
    acc.current.total += ((tax / 100) * 12e12 * dt) / (365 * 86400) * 600; // acelerado no jogo
    if (st.clock.elapsedTime - acc.current.last < 0.25) return;
    acc.current.last = st.clock.elapsedTime;
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#0b1d2e';
    g.fillRect(0, 0, 1024, 512);
    g.fillStyle = '#f2c230';
    g.fillRect(0, 0, 1024, 90);
    g.fillStyle = '#0b1d2e';
    g.font = '900 54px Arial Black, Arial, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('IMPOSTÔMETRO DO JOGO', 512, 47);
    g.fillStyle = '#3ddc84';
    g.font = '900 70px Courier New, monospace';
    g.fillText('R$ ' + Math.floor(acc.current.total).toLocaleString('pt-BR'), 512, 200, 980);
    g.fillStyle = '#ffffff';
    g.font = '700 34px Arial, sans-serif';
    g.fillText(`simulado · carga tributária do jogo: ${tax.toFixed(1).replace('.', ',')}% do PIB`, 512, 290);
    g.fillStyle = '#f2c230';
    g.font = '900 40px Arial Black, Arial, sans-serif';
    g.fillText('Os números reais: cademeuimposto.com', 512, 390, 980);
    g.fillStyle = '#cfd8dc';
    g.font = '700 32px Arial, sans-serif';
    g.fillText('Informação que vira cidadania', 512, 455);
    tex.needsUpdate = true;
  });
  return (
    <group position={[36, 0, -55]} rotation={[0, -Math.PI / 2, 0]}>
      {[-2.6, 2.6].map((sx) => (
        <mesh key={sx} position={[sx, 2.5, -0.1]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 5, 8]} />
          <meshStandardMaterial color="#5f6368" metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 5.2, -0.12]} castShadow>
        <boxGeometry args={[6.4, 3.4, 0.2]} />
        <meshStandardMaterial color="#2b2d31" />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <planeGeometry args={[6, 3]} />
        <meshStandardMaterial map={tex} emissive="#ffffff" emissiveMap={tex} emissiveIntensity={0.45} />
      </mesh>
    </group>
  );
}

/** Placas de "DADO REAL" e o esgoto a céu aberto (missão O País do Futuro). */
function Realidade() {
  return (
    <group>
      {/* esgoto a céu aberto */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-120, 0.04, 199]}>
        <planeGeometry args={[160, 3]} />
        <meshStandardMaterial color="#4b4a2a" roughness={0.3} metalness={0.2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} rotation={[-Math.PI / 2, 0, 0]} position={[-120, 0.035, 199 + s * 2]}>
          <planeGeometry args={[160, 1.2]} />
          <meshStandardMaterial color="#6b5b3e" />
        </mesh>
      ))}
      <Sign lines={['OBRA DE SANEAMENTO', 'Início: 2009 · Previsão: em breve', 'Valor gasto até agora: R$ 48 milhões']} w={5} h={1.8} pos={[P.placaObra[0], 2.4, P.placaObra[1] - 1.5]} rot={0} bg="#f2c230" fg="#14213d" emissive={0.2} mount="posts" res={[1024, 360]} />
      <Sign lines={['DADO REAL (Brasil, 2024)', '~90 milhões de pessoas (43,3%) sem coleta de esgoto', '~33 milhões sem água potável · Fonte: Sinisa/Trata Brasil']} w={6} h={1.9} pos={[-58, 2.3, 194.5]} bg="#0b1d2e" fg="#ffffff" emissive={0.35} mount="posts" res={[1024, 330]} />
      <Sign lines={['DADO REAL (PISA 2022)', '73% dos alunos abaixo do nível básico em matemática', 'Média da OCDE: 31% · Fonte: OCDE/Inep']} w={6} h={1.9} pos={[-44, 2.3, 127]} bg="#0b1d2e" fg="#ffffff" emissive={0.35} mount="posts" res={[1024, 330]} />
      <Sign lines={['DADO REAL (SUS)', 'Recorde de cirurgias eletivas — e mesmo assim há fila', 'A fila não é unificada: não há número oficial exato']} w={6} h={1.9} pos={[45, 2.3, 125]} bg="#0b1d2e" fg="#ffffff" emissive={0.35} mount="posts" res={[1024, 330]} />
    </group>
  );
}

/** Pátio do quartel: equipamento sucateado, mural do orçamento e carro de luxo da pensionista. */
function Quartel() {
  const rust = '#6b4f2a';
  return (
    <group>
      {/* blindado antigo sobre tijolos */}
      <group position={[138, 0, -11]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[3.2, 1.2, 6]} />
          <meshStandardMaterial color="#5a5a3c" roughness={1} />
        </mesh>
        <mesh position={[0, 2.2, -0.4]} castShadow>
          <boxGeometry args={[2, 0.8, 2.4]} />
          <meshStandardMaterial color={rust} roughness={1} />
        </mesh>
        <mesh position={[0, 2.25, 1.8]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 3, 8]} />
          <meshStandardMaterial color={rust} />
        </mesh>
        {[-1.2, 1.2].map((x) =>
          [-2.2, 0, 2.2].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.3, z]}>
              <boxGeometry args={[0.6, 0.6, 0.9]} />
              <meshStandardMaterial color="#9c4a32" />
            </mesh>
          )),
        )}
        <Sign lines={['BLINDADO DE 1970', 'peças: ferro-velho do Zé']} w={2.6} h={0.7} pos={[0, 1.9, 3.06]} bg="#fff" fg="#7a1f1f" emissive={0.2} res={[512, 140]} />
      </group>
      {/* caminhão quebrado */}
      <group position={[160, 0, -11]} rotation={[0, 0, 0.06]}>
        <Car color="#4b5320" kind="truck" />
        <Sign lines={['QUEBRADO', 'aguardando orçamento desde 2014']} w={2.4} h={0.7} pos={[0, 2, 4.3]} bg="#ffd166" fg="#111" emissive={0.2} res={[512, 140]} />
      </group>
      {/* helicóptero sem hélice */}
      <group position={[179, 0, -13]}>
        <mesh position={[0, 1.6, 1]} scale={[1, 1, 1.5]} castShadow>
          <sphereGeometry args={[1.5, 16, 12]} />
          <meshStandardMaterial color="#4b5320" />
        </mesh>
        <mesh position={[0, 1.8, -2.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.5, 4, 8]} />
          <meshStandardMaterial color="#4b5320" />
        </mesh>
        <mesh position={[0, 3.2, 1]}>
          <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.12, 1]}>
            <boxGeometry args={[0.12, 0.12, 3.4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
        <Sign lines={['HÉLICE: EM LICITAÇÃO']} w={2.6} h={0.5} pos={[0, 1.4, 3.3]} bg="#fff" fg="#111" emissive={0.2} res={[512, 100]} />
      </group>
      {/* carro de luxo da pensionista */}
      <group position={[172, 0, -9]}>
        <Car color="#f4f1ea" kind="sedan" />
      </group>
      {/* mural do orçamento (dados reais) */}
      <Sign
        lines={['DADO REAL — DEFESA (2025)', 'Inativos e pensões: ~R$ 56 bi (~47% do orçamento)', 'Investimento em equipamento abaixo dos 20% da OTAN']}
        w={4.2}
        h={1.9}
        pos={[130, 2.1, -19.2]}
        bg="#0b1d2e"
        fg="#fff"
        emissive={0.35}
        mount="posts"
        res={[1024, 460]}
      />
      <Sign
        lines={['DADO REAL — PENSÃO DE FILHAS', 'Extinta em 2001 para novos militares, mantida', 'para quem estava na carreira até 2000 (~R$ 6 bi/ano, estimativa)']}
        w={4.8}
        h={1.9}
        pos={[186, 2.1, -4]}
        rot={-Math.PI / 2}
        bg="#0b1d2e"
        fg="#fff"
        emissive={0.35}
        mount="posts"
        res={[1024, 400]}
      />
    </group>
  );
}

/** Palco do comício no bairro (Missão 9). */
function Comicio() {
  const [x, z] = P.comicio;
  return (
    <group position={[x, 0, z + 6]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 1.2, 4]} />
        <meshStandardMaterial color="#1d3557" />
      </mesh>
      <mesh position={[0, 1.25, 2.02]}>
        <boxGeometry args={[8, 0.1, 0.05]} />
        <meshStandardMaterial color="#f2c230" />
      </mesh>
      {[-3.6, 3.6].map((sx) => (
        <mesh key={sx} position={[sx, 2.6, 1.6]} castShadow>
          <boxGeometry args={[0.8, 1.6, 0.8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      ))}
      <Sign lines={['COMÍCIO — BAIRRO RESIDENCIAL', 'Propostas aqui, promessas com recibo']} w={7.6} h={1.6} pos={[0, 4.6, -1.8]} rot={Math.PI} bg="#1f9d55" fg="#fff" emissive={0.3} mount="posts" />
    </group>
  );
}

/** Seção eleitoral com urna (Missão 9). */
function Urna() {
  const [x, z] = P.urna;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9, 7]} />
        <meshStandardMaterial color="#c8c2b4" />
      </mesh>
      <mesh position={[0, 1.5, 2.6]} castShadow>
        <boxGeometry args={[6, 3, 0.15]} />
        <meshStandardMaterial color="#e8e4da" />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1, 0.9, 0.7]} />
        <meshStandardMaterial color="#6b4a2f" />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.7, 0.3, 0.5]} />
        <meshStandardMaterial color="#f1f1f1" />
      </mesh>
      <mesh position={[0, 1.21, 0.08]}>
        <boxGeometry args={[0.36, 0.02, 0.2]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <Sign lines={['SEÇÃO ELEITORAL Nº 203X', 'Apuração ao vivo']} w={5} h={1.2} pos={[0, 2.3, 2.5]} rot={Math.PI} bg="#0d3b66" fg="#fff" emissive={0.3} />
    </group>
  );
}

export function Landmarks() {
  return (
    <group>
      <Congress />
      <Planalto />
      <TaxMachine />
      <Cofre />
      <Palanque />
      <Comicio />
      <Supremo />
      <Tribunal />
      <TresPoderes />
      <CanetaGigante />
      <Impostometro />
      <Realidade />
      <Quartel />
      <Urna />
      <Plenario />
      <Estoque />
      <Posto />
      <Chimney />
    </group>
  );
}
