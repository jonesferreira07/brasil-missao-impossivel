import { useEffect, useRef, useState } from 'react';
import { brl, fuelPrices, IND_META, IND_ORDER, monthLabel, type IndKey } from '../economy/model';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';
import { MISSIONS } from '../missions/data';
import { BUILDINGS, ROADS, SHOP_D, SHOP_W, SHOPS, SUPER, WORLD } from '../world/layout';

export const DISCLAIMER = 'Obra de ficção e sátira política. Indicadores simulados, sem caráter de previsão econômica.';

// ------------------------------------------------------------ Objetivo
function Objective() {
  const mi = useGame((s) => s.missionIndex);
  const si = useGame((s) => s.stepIndex);
  const month = useGame((s) => s.econ.month);
  const m = MISSIONS[mi];
  if (!m) return null;
  const st = m.steps[si];
  return (
    <div className="objective passive">
      <div className="mnum">MISSÃO {m.num} DE {MISSIONS.length}</div>
      <div className="mtitle">{m.title}</div>
      {st && <div className="step">{st.text}</div>}
      <div className="meta">
        <span>{m.locationName}</span>
        <span>{monthLabel(month)}</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Painel econômico
function norm(k: IndKey, v: number) {
  const r: Record<IndKey, [number, number]> = {
    inflation: [20, 2],
    debt: [130, 50],
    primary: [-6, 3],
    unemployment: [18, 4],
    taxBurden: [40, 28],
    popularity: [0, 100],
    purchasingPower: [50, 110],
    services: [0, 100],
    confidence: [0, 100],
    picanha: [250, 60],
  };
  const [bad, good] = r[k];
  return Math.max(0, Math.min(1, (v - bad) / (good - bad)));
}

function EconomyPanel() {
  const econ = useGame((s) => s.econ);
  const base = useGame((s) => s.trendBase);
  const big = useGame((s) => s.panelExpanded);
  const toggle = useGame((s) => s.togglePanel);
  return (
    <div className={`econ ${big ? 'big' : ''}`}>
      <div className="hdr">
        <span>PAINEL ECONÔMICO</span>
        <button onClick={toggle}>{big ? 'RESUMIR [TAB]' : 'DETALHAR [TAB]'}</button>
      </div>
      {IND_ORDER.map((k) => {
        const meta = IND_META[k];
        const v = econ.ind[k];
        const d = v - base[k];
        const eps = k === 'picanha' ? 0.5 : 0.05;
        const good = meta.better === 'up' ? d > 0 : d < 0;
        const n = norm(k, v);
        return (
          <div className="r" key={k} title={meta.desc}>
            <span>{big ? meta.label : meta.short}</span>
            <span className="v">{meta.fmt(v)}</span>
            <span className={`t ${Math.abs(d) < eps ? '' : good ? 'g' : 'b'}`}>{Math.abs(d) < eps ? '·' : d > 0 ? '▲' : '▼'}</span>
            <div className="bar">
              <i style={{ width: `${n * 100}%`, background: n > 0.6 ? '#3ddc84' : n > 0.35 ? '#f2c230' : '#ff5c5c' }} />
            </div>
            {big && <div className="desc">{meta.desc}</div>}
          </div>
        );
      })}
      <div className="foot">
        <span>PIB: {econ.growth >= 0 ? '+' : ''}{econ.growth.toFixed(1).replace('.', ',')}% a.a.</span>
        <span>Diesel: {brl(fuelPrices(econ).diesel)}</span>
      </div>
      <div className="foot">
        <span>
          Três Poderes:{' '}
          <b className={(econ.lev.institutions ?? 0) > 2.5 ? 'g' : (econ.lev.institutions ?? 0) < -2.5 ? 'b' : ''}>
            {(econ.lev.institutions ?? 0) > 2.5 ? 'independentes e equilibrados' : (econ.lev.institutions ?? 0) < -2.5 ? 'crise institucional' : 'equilíbrio frágil'}
          </b>
        </span>
      </div>
      {big && (
        <div className="desc" style={{ fontSize: 11.5, opacity: 0.75, marginTop: 8, lineHeight: 1.4 }}>
          <b>Como o modelo funciona:</b> cada mês, a dívida cresce com o déficit e com juros reais acima do crescimento; a inflação converge para um alvo
          que depende do déficit, da confiança, da oferta de alimentos e do aquecimento; o desemprego segue o PIB; o poder de compra é salário menos
          inflação; serviços dependem de gasto e eficiência; a popularidade reage a tudo isso. Efeitos de decisões podem chegar meses depois.
          {econ.delayed.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <b>Efeitos a caminho:</b> {econ.delayed.map((d) => `${d.label} (${d.inMonths} ${d.inMonths === 1 ? 'mês' : 'meses'})`).join(' · ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ Índices compactos (celular)
const MINI: [IndKey, string][] = [
  ['inflation', 'Inflação'],
  ['unemployment', 'Desemprego'],
  ['debt', 'Dívida'],
  ['primary', 'Primário'],
  ['taxBurden', 'Carga trib.'],
  ['popularity', 'Popularidade'],
  ['purchasingPower', 'Poder compra'],
  ['services', 'Serviços'],
  ['confidence', 'Confiança'],
  ['picanha', 'Picanha'],
];
function MiniEcon() {
  const econ = useGame((s) => s.econ);
  const base = useGame((s) => s.trendBase);
  const toggle = useGame((s) => s.togglePanel);
  return (
    <div className="mini-econ" onClick={toggle}>
      {MINI.map(([k, label]) => {
        const v = econ.ind[k];
        const d = v - base[k];
        const eps = k === 'picanha' ? 0.5 : 0.05;
        const good = IND_META[k].better === 'up' ? d > 0 : d < 0;
        const n = norm(k, v);
        const val = k === 'picanha' ? `R$${v.toFixed(0)}` : IND_META[k].fmt(v);
        return (
          <div className="mr" key={k}>
            <i style={{ background: n > 0.6 ? '#3ddc84' : n > 0.35 ? '#f2c230' : '#ff5c5c' }} />
            <span className="ml">{label}</span>
            <b>{val}</b>
            <em className={Math.abs(d) < eps ? '' : good ? 'g' : 'b'}>{Math.abs(d) < eps ? '' : d > 0 ? '▲' : '▼'}</em>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------ Minimapa
const MAP_PX = 2; // px por unidade no mapa estático
let staticMap: HTMLCanvasElement | null = null;
function getStaticMap() {
  if (staticMap) return staticMap;
  const S = WORLD * 2 * MAP_PX;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  const X = (x: number) => (x + WORLD) * MAP_PX;
  g.fillStyle = '#5e7a45';
  g.fillRect(0, 0, S, S);
  g.fillStyle = '#6f9a4e';
  g.fillRect(X(-21), X(-133), 42 * MAP_PX, 226 * MAP_PX);
  g.fillStyle = '#3a3d42';
  for (const r of ROADS) {
    const horiz = r.z1 === r.z2;
    if (horiz) g.fillRect(X(Math.min(r.x1, r.x2)), X(r.z1 - r.w / 2), Math.abs(r.x2 - r.x1) * MAP_PX, r.w * MAP_PX);
    else g.fillRect(X(r.x1 - r.w / 2), X(Math.min(r.z1, r.z2)), r.w * MAP_PX, Math.abs(r.z2 - r.z1) * MAP_PX);
  }
  for (const b of BUILDINGS) {
    g.fillStyle = b.kind === 'house' ? '#c9a27a' : b.id === 'tesouro' ? '#e0c060' : '#b9b5ab';
    g.fillRect(X(b.x - b.w / 2), X(b.z - b.d / 2), b.w * MAP_PX, b.d * MAP_PX);
  }
  g.fillStyle = '#d9a066';
  for (const s of SHOPS) g.fillRect(X(s.x - SHOP_W / 2), X(s.z + 1 - SHOP_D / 2), SHOP_W * MAP_PX, SHOP_D * MAP_PX);
  g.fillStyle = '#e5383b';
  g.fillRect(X(SUPER.minX), X(SUPER.minZ), (SUPER.maxX - SUPER.minX) * MAP_PX, (SUPER.maxZ - SUPER.minZ) * MAP_PX);
  g.fillStyle = '#f2f0ea';
  g.fillRect(X(-35), X(-175), 70 * MAP_PX, 26 * MAP_PX);
  g.fillRect(X(47), X(-169), 46 * MAP_PX, 18 * MAP_PX);
  g.fillRect(X(-59), X(-170), 18 * MAP_PX, 18 * MAP_PX);
  g.fillStyle = '#1f9d55';
  g.fillRect(X(-163), X(29), 26 * MAP_PX, 16 * MAP_PX);
  g.fillStyle = '#4a4c50';
  g.fillRect(X(118), X(-183), 87 * MAP_PX, 16 * MAP_PX);
  g.fillStyle = '#e8e8e8';
  g.fillRect(X(134), X(-177), 32 * MAP_PX, 4 * MAP_PX);
  staticMap = c;
  return c;
}

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = ref.current;
      if (!c) return;
      const g = c.getContext('2d')!;
      const W = c.width;
      const scale = 1.35; // px do canvas por unidade do mundo
      const v = runtime.vehicle ? runtime.vehicles.find((x) => x.id === runtime.vehicle) : null;
      const px = v ? v.x : runtime.player.x;
      const pz = v ? v.z : runtime.player.z;
      const yaw = v ? v.yaw : runtime.player.yaw;
      g.fillStyle = '#2b3a2b';
      g.fillRect(0, 0, W, W);
      const sm = getStaticMap();
      const k = scale / MAP_PX;
      g.drawImage(sm, W / 2 - (px + WORLD) * scale, W / 2 - (pz + WORLD) * scale, sm.width * k, sm.height * k);
      const toC = (x: number, z: number) => [W / 2 + (x - px) * scale, W / 2 + (z - pz) * scale];
      // veículos
      for (const car of runtime.vehicles) {
        if (car.id === runtime.vehicle) continue;
        const [cx, cy] = toC(car.x, car.z);
        g.fillStyle = '#4cc9f0';
        g.fillRect(cx - 4, cy - 4, 8, 8);
      }
      // alvo da missão
      const s = useGame.getState();
      const st = MISSIONS[s.missionIndex]?.steps[s.stepIndex];
      if (st) {
        let [tx, ty] = toC(st.target[0], st.target[1]);
        const dx = tx - W / 2;
        const dy = ty - W / 2;
        const d = Math.hypot(dx, dy);
        const R = W / 2 - 16;
        const edge = d > R;
        if (edge) {
          tx = W / 2 + (dx / d) * R;
          ty = W / 2 + (dy / d) * R;
        }
        g.save();
        g.translate(tx, ty);
        if (edge) g.rotate(Math.atan2(dy, dx) + Math.PI / 2);
        g.fillStyle = '#ffd60a';
        g.strokeStyle = '#000';
        g.lineWidth = 2;
        g.beginPath();
        if (edge) {
          g.moveTo(0, -12);
          g.lineTo(9, 8);
          g.lineTo(-9, 8);
        } else {
          for (let i = 0; i < 10; i++) {
            const r = i % 2 ? 5 : 12;
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
        }
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      // jogador
      g.save();
      g.translate(W / 2, W / 2);
      g.rotate(-yaw + Math.PI);
      g.fillStyle = '#fff';
      g.strokeStyle = '#000';
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(0, -11);
      g.lineTo(8, 9);
      g.lineTo(0, 4);
      g.lineTo(-8, 9);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();
      // N
      g.fillStyle = '#fff';
      g.font = 'bold 20px sans-serif';
      g.textAlign = 'center';
      g.fillText('N', W / 2, 24);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      <div className="minimap passive">
        <canvas ref={ref} width={400} height={400} />
      </div>
    </>
  );
}

// ------------------------------------------------------------ Notificações
function Notifications() {
  const list = useGame((s) => s.notifications);
  const dismiss = useGame((s) => s.dismiss);
  return (
    <div className="notifs">
      {list.map((n) => (
        <div key={n.id} className={`notif ${n.kind}`} onClick={() => dismiss(n.id)}>
          {n.text}
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ Prompt e diálogo
function Prompt() {
  const p = useGame((s) => s.prompt);
  const d = useGame((s) => s.dialogue);
  if (!p || d) return null;
  return <div className="prompt passive">{p}</div>;
}

function DialogueBox() {
  const d = useGame((s) => s.dialogue);
  const adv = useGame((s) => s.advanceDialogue);
  if (!d) return null;
  return (
    <div className="dialogue" onClick={adv}>
      <div className="who">{d.speaker}</div>
      <div className="txt">{d.lines[d.index]}</div>
      <div className="more">
        [E] ou clique {d.index + 1 < d.lines.length ? 'para continuar' : 'para encerrar'} · {d.index + 1}/{d.lines.length}
      </div>
    </div>
  );
}

// ------------------------------------------------------------ Rádio
const STATIONS = [
  'Rádio Esplanada 103,X — "A rádio que promete"',
  'Mercado FM — "A rádio que oscila"',
  'Feira Livre AM — "Preço bom é preço de ontem"',
  'Rádio Silêncio — (desligada)',
];
function radioLines(i: number) {
  const e = useGame.getState().econ;
  const f = (v: number) => v.toFixed(1).replace('.', ',');
  switch (i) {
    case 0:
      return [
        'Bom dia, Brasil! Hoje o governo anunciou um plano para anunciar um plano.',
        `Ouvintes relatam picanha a ${brl(e.ind.picanha)}. O boi foi procurado e não quis comentar.`,
        'Novo ministério criado: Ministério da Solução dos Problemas Criados Ontem. Inauguração amanhã — ou depois.',
        'Atenção motoristas: o trânsito está parado na Esplanada. As promessas também.',
        'Recado do ouvinte: "Presidente, meu salário quer saber se pode entrar no programa social também".',
        'Você sabe quanto paga de imposto e como ele é gasto? Os números reais estão em cademeuimposto.com — informação que vira cidadania.',
      ];
    case 1:
      return [
        `Confiança dos investidores em ${e.ind.confidence.toFixed(0)} pontos. Analistas consultaram a planilha e o horóscopo.`,
        `Dívida em ${f(e.ind.debt)}% do PIB. Com vista para o mar, segundo fontes do Tesouro.`,
        `Resultado primário: ${f(e.ind.primary)}% do PIB. ${e.ind.primary < 0 ? 'O Tesouro chora em silêncio.' : 'O Tesouro sorri, mas desconfiado.'}`,
        'Você cortou impostos, mas esqueceu de revisar as despesas? O Tesouro não gostou.',
        `Inflação em ${f(e.ind.inflation)}%. Lembrete: a inflação não aceita discurso como forma de pagamento.`,
        'Momento cidadania: seu dinheiro merece atenção. Acompanhe impostos e gastos públicos de verdade em cademeuimposto.com.',
      ];
    case 2:
      return [
        `Tomate hoje: preço de ontem mais ${f(e.ind.inflation / 12)}%. Freguesa, aproveita!`,
        'O feirante pergunta: "aceita Pix, cartão ou promessa de campanha?". Só os dois primeiros.',
        `Desemprego em ${f(e.ind.unemployment)}%. Na feira tem vaga: gritador de preço. Exige pulmão e otimismo.`,
        'Dica da casa: churrasco de linguiça também é churrasco. Pense nisso.',
      ];
    default:
      return ['(chiado) ...', '(o motor agradece o silêncio)'];
  }
}
function Radio() {
  const inV = useGame((s) => s.inVehicle);
  const st = useGame((s) => s.radioStation);
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inV) return;
    const t = setInterval(() => setI((x) => x + 1), 6500);
    return () => clearInterval(t);
  }, [inV]);
  if (!inV) return null;
  const lines = radioLines(st);
  return (
    <div className="radio passive">
      <div className="st">📻 {STATIONS[st]}</div>
      <div className="ln">{lines[i % lines.length]}</div>
    </div>
  );
}

// ------------------------------------------------------------ Ticker
function Ticker() {
  const h = useGame((s) => s.headlines);
  return (
    <div className="ticker passive">
      <div className="lbl">O FICTÍCIO DE BRASÍLIA</div>
      <div className="track">{h.slice(0, 8).join('   ★   ')}</div>
    </div>
  );
}

export function HUD() {
  return (
    <>
      <Objective />
      <EconomyPanel />
      <MiniEcon />
      <Minimap />
      <Notifications />
      <Prompt />
      <DialogueBox />
      <Radio />
      <div className="disclaimer passive">{DISCLAIMER}</div>
      <div className="hints passive desk-only">
        WASD mover · Shift correr · Mouse câmera (clique/arraste) · E interagir · F veículo
        <br />
        Tab painel · H histórico · Esc pausa
      </div>
      <Ticker />
    </>
  );
}
