import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { brl, clamp, groceryPrices } from '../economy/model';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { textTexture } from '../game/textures';
import { SUPER } from './layout';
import { Sign } from './Landmarks';
import { SimplePerson } from './Person';
import { useStaticObstacles } from './useObstacles';

const PRODUCT_COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#457b9d', '#f1faee', '#8d5a97', '#90be6d'];

function Products({ fill }: { fill: number }) {
  const slots = useMemo(() => {
    const a: [number, number, number, number][] = [];
    for (const sz of [29.5, 36.5])
      for (const side of [-0.55, 0.55])
        for (let lvl = 0; lvl < 3; lvl++)
          for (let x = 148.6; x < 167.6; x += 0.62) a.push([x, 0.55 + lvl * 0.72, sz + side, Math.floor(Math.random() * PRODUCT_COLORS.length)]);
    // embaralha para que o esvaziamento pareça aleatório
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }, []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = new THREE.Object3D();
    const c = new THREE.Color();
    slots.forEach(([x, y, z, ci], i) => {
      m.position.set(x, y, z);
      m.scale.set(1, 0.8 + (ci % 3) * 0.15, 1);
      m.updateMatrix();
      ref.current!.setMatrixAt(i, m.matrix);
      ref.current!.setColorAt(i, c.set(PRODUCT_COLORS[ci]));
    });
    ref.current!.instanceMatrix.needsUpdate = true;
    if (ref.current!.instanceColor) ref.current!.instanceColor.needsUpdate = true;
  }, [slots]);
  useLayoutEffect(() => {
    if (ref.current) ref.current.count = Math.floor(slots.length * fill);
  }, [fill, slots.length]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, slots.length]} castShadow>
      <boxGeometry args={[0.45, 0.5, 0.35]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

export function Supermarket() {
  const econ = useGame((s) => s.econ);
  const prices = groceryPrices(econ);
  const fill = Math.round(clamp(0.2 + (econ.ind.purchasingPower - 60) / 80 + (econ.lev.foodSupply - 0.85) * 2.5, 0.08, 1) * 20) / 20;
  const meatCount = Math.round(clamp((econ.lev.foodSupply - 0.75) * 30, 1, 10));
  const pic = prices.picanha;
  const picColor = pic > 150 ? '#c1121f' : pic < 120 ? '#2a9d55' : '#e09f3e';
  const picTex = useMemo(() => textTexture('pic', ['AÇOUGUE', `PICANHA ${brl(pic)}/kg`], { w: 1024, h: 256, bg: picColor, fg: '#fff' }), [pic.toFixed(1), picColor]);

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0e6d2' }), []);
  useFrame(() => {
    const m = wallMat;
    const target = runtime.insideSuper ? 0.15 : 1;
    m.opacity += (target - m.opacity) * 0.15;
    m.transparent = m.opacity < 0.99;
    m.depthWrite = m.opacity > 0.5;
  });

  const s = SUPER;
  const cx = (s.minX + s.maxX) / 2;
  const cz = (s.minZ + s.maxZ) / 2;
  const W = s.maxX - s.minX;
  const D = s.maxZ - s.minZ;
  const queue = Math.round(clamp((0.95 - econ.lev.foodSupply) * 60, 0, 9));
  useStaticObstacles(Array.from({ length: queue }).map((_, i) => [134 - i * 1.1, 38 + (i % 2) * 0.4, 0.38]), 'npc', [queue]);

  return (
    <group>
      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0.04, cz]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#d9d6cf" />
      </mesh>
      {/* paredes */}
      <mesh position={[cx, s.h / 2, s.minZ + 0.4]} castShadow material={wallMat}>
        <boxGeometry args={[W, s.h, 0.8]} />
      </mesh>
      <mesh position={[cx, s.h / 2, s.maxZ - 0.4]} castShadow material={wallMat}>
        <boxGeometry args={[W, s.h, 0.8]} />
      </mesh>
      <mesh position={[s.maxX - 0.4, s.h / 2, cz]} castShadow material={wallMat}>
        <boxGeometry args={[0.8, s.h, D]} />
      </mesh>
      <mesh position={[s.minX + 0.4, s.h / 2, (s.minZ + s.doorMinZ) / 2]} castShadow material={wallMat}>
        <boxGeometry args={[0.8, s.h, s.doorMinZ - s.minZ]} />
      </mesh>
      <mesh position={[s.minX + 0.4, s.h / 2, (s.doorMaxZ + s.maxZ) / 2]} castShadow material={wallMat}>
        <boxGeometry args={[0.8, s.h, s.maxZ - s.doorMaxZ]} />
      </mesh>
      <mesh position={[s.minX + 0.4, s.h - 1.5, (s.doorMinZ + s.doorMaxZ) / 2]} material={wallMat}>
        <boxGeometry args={[0.8, 3, s.doorMaxZ - s.doorMinZ]} />
      </mesh>
      {/* teto visível só por baixo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[cx, s.h, cz]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#c9c4b8" />
      </mesh>
      <pointLight position={[cx, s.h - 1, cz]} intensity={60} distance={40} color="#fff7e6" />
      {/* fachada */}
      <Sign lines={['SUPERMERCADO BOM PREÇO', '(TALVEZ)']} w={18} h={3.2} pos={[s.minX - 0.1, s.h + 1.8, cz]} rot={-Math.PI / 2} bg="#d62828" fg="#fff7d6" border="#f2c230" emissive={0.5} />
      <mesh position={[s.minX + 0.3, s.h + 1.8, cz]} castShadow>
        <boxGeometry args={[0.6, 3.6, 18.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* prateleiras */}
      {[29.5, 36.5].map((z) => (
        <group key={z}>
          <mesh position={[158, 1.1, z]} castShadow>
            <boxGeometry args={[20, 2.2, 0.5]} />
            <meshStandardMaterial color="#8d99ae" />
          </mesh>
          {[0.3, 1.02, 1.74].map((y) => (
            <mesh key={y} position={[158, y, z]}>
              <boxGeometry args={[20, 0.06, 1.6]} />
              <meshStandardMaterial color="#adb5bd" />
            </mesh>
          ))}
        </group>
      ))}
      <Products fill={fill} />
      <Sign lines={[`ARROZ 5kg ${brl(prices.arroz)}`, `FEIJÃO 1kg ${brl(prices.feijao)}`]} w={6} h={1.6} pos={[152, 3.4, 33]} bg="#fff3b0" fg="#222" emissive={0.3} mount="hang" hangTo={9} />
      <Sign lines={[`CAFÉ 500g ${brl(prices.cafe)}`, `ÓLEO 900ml ${brl(prices.oleo)}`]} w={6} h={1.6} pos={[164, 3.4, 33]} bg="#fff3b0" fg="#222" emissive={0.3} mount="hang" hangTo={9} />
      {fill < 0.35 && <Sign lines={['PRODUTO EM FALTA', 'VOLTE AMANHÃ (OU EM 203X+1)']} w={5} h={1.2} pos={[158, 1.7, 40]} bg="#222" fg="#ff595e" emissive={0.5} mount="posts" />}
      {/* açougue */}
      <group position={[176.5, 0, 46]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[3, 1.2, 10]} />
          <meshStandardMaterial color="#f8f9fa" />
        </mesh>
        <mesh position={[-0.6, 1.55, 0]}>
          <boxGeometry args={[1.6, 0.7, 9.6]} />
          <meshStandardMaterial color="#a8dadc" transparent opacity={0.3} />
        </mesh>
        {Array.from({ length: meatCount }).map((_, i) => (
          <group key={i} position={[-0.6, 1.3, -4.2 + i * 0.9]}>
            <mesh>
              <boxGeometry args={[0.9, 0.18, 0.6]} />
              <meshStandardMaterial color="#c0392b" />
            </mesh>
            <mesh position={[0, 0.1, -0.22]}>
              <boxGeometry args={[0.9, 0.06, 0.15]} />
              <meshStandardMaterial color="#f5e6d3" />
            </mesh>
          </group>
        ))}
        <mesh position={[0.9, 3.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[9, 2.2]} />
          <meshStandardMaterial map={picTex} emissive="#ffffff" emissiveMap={picTex} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.97, 3.8, 0]}>
          <boxGeometry args={[0.1, 2.4, 9.2]} />
          <meshStandardMaterial color="#2b2d31" />
        </mesh>
        {[-4.2, 4.2].map((wz) => (
          <mesh key={wz} position={[0.95, 6.95, wz]}>
            <cylinderGeometry args={[0.015, 0.015, 4.1, 4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </group>
      {/* caixa */}
      <mesh position={[146, 0.55, 52]} castShadow>
        <boxGeometry args={[4, 1.1, 2]} />
        <meshStandardMaterial color="#3d405b" />
      </mesh>
      {/* fila (desabastecimento) */}
      {Array.from({ length: queue }).map((_, i) => (
        <SimplePerson key={i} shirt={PRODUCT_COLORS[i % PRODUCT_COLORS.length]} position={[134 - i * 1.1, 0, 38 + (i % 2) * 0.4]} rotation={Math.PI / 2} />
      ))}
      {queue > 3 && <Sign lines={['FILA DO ARROZ', 'senha nº 1.245']} w={3} h={1} pos={[132, 2.4, 33]} bg="#fff" fg="#c1121f" mount="posts" />}
    </group>
  );
}
