// Layout estático de Brasília fictícia. Usado para renderizar, colidir e desenhar o minimapa.
export interface Bld {
  id: string;
  x: number;
  z: number;
  w: number; // tamanho em x
  d: number; // tamanho em z
  h: number;
  color: string;
  kind: 'ministry' | 'office' | 'house' | 'warehouse' | 'generic';
  label?: string;
  face?: 'x+' | 'x-' | 'z+' | 'z-';
  damage?: number; // limiar de saúde acima do qual o prédio é restaurado
  roof?: string;
}

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const WORLD = 210; // meia-largura do mapa

// ---------------- Ruas ----------------
export interface Road {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  w: number;
}
export const ROADS: Road[] = [
  { x1: -200, z1: -138, x2: 200, z2: -138, w: 10 },
  { x1: -200, z1: 5, x2: 200, z2: 5, w: 10 },
  { x1: -200, z1: 95, x2: 200, z2: 95, w: 10 },
  { x1: -26, z1: -138, x2: -26, z2: 95, w: 10 },
  { x1: 26, z1: -138, x2: 26, z2: 95, w: 10 },
  { x1: -110, z1: -200, x2: -110, z2: 200, w: 10 },
  { x1: 110, z1: -200, x2: 110, z2: 200, w: 10 },
];

// ---------------- Ministérios ----------------
const WEST_LABELS = [
  'MINISTÉRIO DA SOLUÇÃO DOS PROBLEMAS CRIADOS ONTEM',
  'MINISTÉRIO DO JÁ VOLTO',
  'MINISTÉRIO DAS REUNIÕES SOBRE REUNIÕES',
  'MINISTÉRIO DO PLANEJAMENTO DE AMANHÃ',
  'SECRETARIA ESPECIAL DE ASSUNTOS ESPECIAIS',
  'MINISTÉRIO DA PICANHA (EM IMPLANTAÇÃO)',
  'MINISTÉRIO DO OFÍCIO Nº 4.817',
  'MINISTÉRIO DA OBRA PARADA',
];
const EAST_LABELS = [
  'MINISTÉRIO DA DESBUROCRATIZAÇÃO (SENHA 1 DE 9.999)',
  'MINISTÉRIO DA COMUNICAÇÃO DO QUE NÃO FOI FEITO',
  'MINISTÉRIO DO CAFEZINHO',
  'TESOURO NACIONAL (FICTÍCIO)',
  'MINISTÉRIO DA PROMESSA CUMPRIDA (VAZIO)',
  'MINISTÉRIO DO GRUPO DE TRABALHO',
  'MINISTÉRIO DO PRAZO PRORROGADO',
  'MINISTÉRIO DA CONTA QUE NÃO FECHA',
];
const MIN_Z = [-95, -75, -55, -35, -15, 25, 45, 65];

export const BUILDINGS: Bld[] = [];
MIN_Z.forEach((z, i) => {
  BUILDINGS.push({ id: `minW${i}`, x: -48, z, w: 14, d: 12, h: 22, color: '#d9d5c9', kind: 'ministry', label: WEST_LABELS[i], face: 'x+', damage: i % 3 === 1 ? 0.45 : i % 4 === 0 ? 0.6 : undefined });
  BUILDINGS.push({ id: i === 3 ? 'tesouro' : `minE${i}`, x: 48, z, w: 14, d: 12, h: 22, color: i === 3 ? '#c9c1a6' : '#d9d5c9', kind: 'ministry', label: EAST_LABELS[i], face: 'x-', damage: i % 3 === 2 ? 0.5 : undefined });
});

// Escritórios / torres
const offices: [number, number, number, number, number, string, number?][] = [
  [80, -100, 18, 18, 32, '#b8c4cc', 0.55],
  [80, -60, 16, 22, 20, '#cdbfae'],
  [80, -20, 18, 16, 26, '#a9b7bf', 0.4],
  [80, 40, 18, 16, 24, '#c2c9c2'],
  [80, 70, 14, 14, 16, '#d6c4a8', 0.65],
  [150, -60, 22, 22, 38, '#9fb0bb', 0.5],
  [185, -60, 14, 18, 22, '#c4b5a5'],
  [150, -100, 18, 16, 18, '#bdb4a8', 0.35],
  [180, -105, 16, 20, 28, '#aeb9c2'],
  [-80, -60, 18, 18, 24, '#c9bfb2', 0.42],
  [-80, -20, 16, 22, 18, '#b5c0c6'],
  [-80, 40, 18, 18, 30, '#a6b3ba', 0.58],
  [-80, 70, 14, 14, 15, '#d1c2ae'],
  [-160, -40, 20, 20, 16, '#c2b8a8'],
  [-185, -25, 14, 20, 12, '#b9b0a2', 0.5],
  [160, 160, 20, 20, 14, '#cbbca8'],
  [185, 185, 16, 16, 10, '#bfb3a3'],
  [-30, 160, 30, 18, 12, '#c8c0b0'],
  [30, 160, 26, 18, 18, '#b4bec4', 0.45],
  [0, 190, 22, 14, 10, '#d5cab8'],
];
offices.forEach(([x, z, w, d, h, color, dmg], i) =>
  BUILDINGS.push(i === 0 ? { id: 'bc', x, z, w, d, h, color: '#9fb3c8', kind: 'office', label: 'BANCO CENTRAL (FICTÍCIO)', face: 'x+' } : { id: `off${i}`, x, z, w, d, h, color, kind: 'office', damage: dmg }),
);

// Casas (bairro residencial)
const HOUSE_COLORS = ['#e9c46a', '#f4a261', '#90be6d', '#8ecae6', '#f28482', '#cdb4db', '#ffd6a5', '#a8dadc'];
let hi = 0;
for (const x of [-185, -165, -145, -90, -70, -50])
  for (const z of [118, 140, 162, 184]) {
    BUILDINGS.push({ id: `house${hi}`, x, z, w: 10, d: 10, h: 4.5, color: HOUSE_COLORS[hi % HOUSE_COLORS.length], kind: 'house', roof: hi % 2 ? '#9c4a32' : '#7d3b2a', damage: hi % 5 === 0 ? 0.5 : undefined });
    hi++;
  }

// Galpões (área industrial deteriorada)
const wh: [number, number, number, number, number][] = [
  [-170, -100, 24, 18, 10],
  [-138, -100, 22, 18, 9],
  [-75, -100, 24, 18, 11],
  [-175, -178, 22, 18, 10],
  [-75, -178, 26, 18, 12],
];
wh.forEach(([x, z, w, d, h], i) => BUILDINGS.push({ id: `wh${i}`, x, z, w, d, h, color: i % 2 ? '#8a7f72' : '#7b7368', kind: 'warehouse', damage: 0.62 }));
// Escola e UPA (missão O País do Futuro)
BUILDINGS.push({ id: 'escola', x: -30, z: 140, w: 22, d: 14, h: 7, color: '#e9d8a6', kind: 'generic', label: 'ESCOLA ESTADUAL FUTURO DISTANTE', face: 'z-', damage: 0.55 });
BUILDINGS.push({ id: 'upa', x: 30, z: 135, w: 20, d: 14, h: 7, color: '#dfe7ec', kind: 'generic', label: 'UPA 24H — FILA 24H', face: 'z-', damage: 0.5 });
// Barracos da periferia, à beira do esgoto a céu aberto
for (const [bx, bz, bc] of [[-75, 205, '#a1887f'], [-61, 205.5, '#8d6e63'], [-47, 204.5, '#bcaaa4'], [-120, 205, '#a1887f'], [-134, 205.5, '#90a4ae']] as [number, number, string][])
  BUILDINGS.push({ id: `barraco${bx}`, x: bx, z: bz, w: 6, d: 5, h: 3.2, color: bc, kind: 'house', roof: '#607d8b' });
// Quartel (missão das Forças Armadas) — fictício
BUILDINGS.push({ id: 'quartel', x: 155, z: -28, w: 26, d: 10, h: 6, color: '#7f8c6b', kind: 'generic', label: 'QUARTEL DA GUARNIÇÃO FICTÍCIA', face: 'z+', damage: 0.6 });
// Central de Abastecimento
BUILDINGS.push({ id: 'ceasa', x: -135, z: -177, w: 30, d: 18, h: 8, color: '#a38d6d', kind: 'warehouse', label: 'CENTRAL DE ABASTECIMENTO', face: 'z+' });

// ---------------- Lojas (centro comercial) ----------------
export interface Shop {
  id: string;
  x: number;
  z: number;
  name: string;
  color: string;
}
export const SHOPS: Shop[] = [
  { id: 's0', x: 40, z: 112, name: 'PADARIA PÃO NOSSO', color: '#e76f51' },
  { id: 's1', x: 56, z: 112, name: 'LOJA DO TUDO POR R$ 99', color: '#2a9d8f' },
  { id: 's2', x: 72, z: 112, name: 'ÓTICA VEJA O FUTURO', color: '#e9c46a' },
  { id: 's3', x: 88, z: 112, name: 'BAR DO OTIMISTA', color: '#f4a261' },
  { id: 's4', x: 132, z: 112, name: 'FARMÁCIA SÓ ALÍVIO', color: '#43aa8b' },
  { id: 's5', x: 148, z: 112, name: 'CONSERTOS CONSERTA-TUDO', color: '#577590' },
  { id: 's6', x: 164, z: 112, name: 'SAPATARIA PÉ NO CHÃO', color: '#f94144' },
  { id: 's7', x: 180, z: 112, name: 'CHURRASCARIA SAUDADE', color: '#90be6d' },
  { id: 's8', x: -30, z: 112, name: 'MERCADINHO DA ESQUINA', color: '#f8961e' },
  { id: 's9', x: -56, z: 78, name: 'LAN HOUSE 203X', color: '#4d908e' },
];
export const SHOP_W = 13;
export const SHOP_D = 11;

// ---------------- Áreas especiais ----------------
export const SUPER = { minX: 140, maxX: 182, minZ: 24, maxZ: 58, h: 9, doorMinZ: 34, doorMaxZ: 46 };
export const CONGRESS = { x: 0, z: -162 };
export const PLANALTO = { x: 70, z: -160, w: 46, d: 18 };
export const POSTO = { x: -150, z: 40 };
export const AIRPORT = { runwayX1: 118, runwayX2: 205, runwayZ: -175, planeX: 150, planeZ: -175, terminal: { x: 125, z: -153, w: 14, d: 8 } };
export const SUPREMO = { x: -50, z: -161, w: 18, d: 18 };

// ---------------- Colisões ----------------
export const COLLIDERS: AABB[] = [];
const box = (x: number, z: number, w: number, d: number) =>
  COLLIDERS.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2 });

BUILDINGS.forEach((b) => box(b.x, b.z, b.w, b.d));
SHOPS.forEach((s) => box(s.x, s.z + 1, SHOP_W, SHOP_D));
// Congresso: plataforma e torres
box(0, -162, 70, 26);
// Supremo (fictício)
box(SUPREMO.x, SUPREMO.z, SUPREMO.w - 4, SUPREMO.d - 4);
box(-50, -147.4, 12.4, 1.2); // bancada do tribunal
// Planalto (corpo de vidro)
box(PLANALTO.x, PLANALTO.z, PLANALTO.w - 6, PLANALTO.d - 6);
// Supermercado: paredes com porta no lado oeste
{
  const s = SUPER;
  const t = 0.8;
  COLLIDERS.push({ minX: s.minX, maxX: s.maxX, minZ: s.minZ, maxZ: s.minZ + t });
  COLLIDERS.push({ minX: s.minX, maxX: s.maxX, minZ: s.maxZ - t, maxZ: s.maxZ });
  COLLIDERS.push({ minX: s.maxX - t, maxX: s.maxX, minZ: s.minZ, maxZ: s.maxZ });
  COLLIDERS.push({ minX: s.minX, maxX: s.minX + t, minZ: s.minZ, maxZ: s.doorMinZ });
  COLLIDERS.push({ minX: s.minX, maxX: s.minX + t, minZ: s.doorMaxZ, maxZ: s.maxZ });
  // prateleiras e balcões
  box(158, 29.5, 20, 1.6);
  box(158, 36.5, 20, 1.6);
  box(176.5, 46, 3, 10); // açougue
  box(146, 52, 4, 2); // caixa
}
// Base aérea: avião estacionado (fuselagem + asas baixas) e terminal
box(AIRPORT.planeX, AIRPORT.planeZ, 32, 4.4);
box(AIRPORT.planeX + 1, AIRPORT.planeZ, 5, 26);
box(AIRPORT.terminal.x, AIRPORT.terminal.z, AIRPORT.terminal.w, AIRPORT.terminal.d);
box(141, -170.8, 1.8, 3.6); // escada do avião
// Objetos de cena (palanques, mesas, máquinas…)
box(0, -128, 7, 4); // palanque / debate
box(-128, 152, 8, 4); // comício
box(0, 82.6, 6, 0.3); // parede da seção eleitoral
box(0, 80, 1, 0.8); // urna
box(41, -148.5, 7.4, 2.2); // monumento dos Três Poderes
box(82, -147, 2.6, 1.8); // máquina de impostos
box(36, -29, 2, 2.6); // cofre
box(-144, -160, 4, 4); // estoques
box(7, -146, 3.2, 1.4); // mesa de negociação
box(96, -94, 1.6, 3); // mesa da caneta
box(-118, -178, 3.6, 3.6); // chaminé
for (const px of [-156, -150, -144]) box(px, 44, 1, 0.7); // bombas
for (const [cx, cz] of [[-161, 35], [-139, 35], [-161, 49], [-139, 49]]) box(cx, cz, 0.6, 0.6); // colunas do posto
box(36, -52.4, 0.3, 0.3); // postes do impostômetro
box(36, -57.6, 0.3, 0.3);
box(36, -47, 0.4, 4.8); // placa dos perdões (Refis)
box(-86, 193.5, 5, 0.4); // placa da obra
box(-58, 194.5, 6, 0.4);
box(-44, 127, 6, 0.4);
box(45, 125, 6, 0.4);
box(138, -11, 3.6, 6.4); // blindado antigo
box(160, -11, 2.6, 7.5); // caminhão quebrado
box(179, -13, 3, 9); // helicóptero sem hélice
box(130, -19.2, 4.4, 0.4); // mural do orçamento
box(172, -9, 2, 4.6); // carro de luxo
box(186, -4, 0.4, 4.8); // placa das pensões
// Posto: loja de conveniência
box(POSTO.x, POSTO.z + 18, 16, 8);
// Mundo: bordas
COLLIDERS.push({ minX: -WORLD - 5, maxX: -WORLD, minZ: -WORLD, maxZ: WORLD });
COLLIDERS.push({ minX: WORLD, maxX: WORLD + 5, minZ: -WORLD, maxZ: WORLD });
COLLIDERS.push({ minX: -WORLD, maxX: WORLD, minZ: -WORLD - 5, maxZ: -WORLD });
COLLIDERS.push({ minX: -WORLD, maxX: WORLD, minZ: WORLD, maxZ: WORLD + 5 });

/** Empurra um círculo (x,z,r) para fora de todas as caixas. Retorna se houve colisão. */
export function resolveCircle(p: { x: number; z: number }, r: number): boolean {
  let hit = false;
  for (const b of COLLIDERS) {
    const cx = Math.max(b.minX, Math.min(p.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(p.z, b.maxZ));
    const dx = p.x - cx;
    const dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 < r * r) {
      hit = true;
      if (d2 > 1e-6) {
        const d = Math.sqrt(d2);
        p.x += (dx / d) * (r - d);
        p.z += (dz / d) * (r - d);
      } else {
        // centro dentro da caixa: sai pelo lado mais próximo
        const opts = [
          [p.x - b.minX + r, -1, 0],
          [b.maxX - p.x + r, 1, 0],
          [p.z - b.minZ + r, 0, -1],
          [b.maxZ - p.z + r, 0, 1],
        ].sort((a, c) => a[0] - c[0])[0];
        p.x += opts[1] * opts[0];
        p.z += opts[2] * opts[0];
      }
    }
  }
  return hit;
}

// ---------------- Rotas de trânsito ----------------
export const TRAFFIC_LOOPS: [number, number][][] = [
  [
    [26, -138],
    [26, 95],
    [110, 95],
    [110, -138],
  ],
  [
    [-26, -138],
    [-110, -138],
    [-110, 95],
    [-26, 95],
  ],
  [
    [-110, 5],
    [110, 5],
    [110, 95],
    [-110, 95],
  ],
  [
    [-110, -138],
    [110, -138],
    [110, 5],
    [-110, 5],
  ],
];

// Zonas de passeio de pedestres [minX, maxX, minZ, maxZ]
export const PED_ZONES: [number, number, number, number][] = [
  [-20, 20, -100, 90], // gramado da Esplanada
  [30, 41, -100, 90],
  [-41, -30, -100, 90],
  [115, 138, 20, 60], // estacionamento do supermercado
  [30, 190, 100, 104], // calçada do comércio
  [-190, -40, 100, 104],
  [-190, -40, 108, 196], // bairro
  [-170, -120, 25, 52], // posto
  [-190, -60, -132, -112], // industrial
  [91, 104, -130, 90],
];
