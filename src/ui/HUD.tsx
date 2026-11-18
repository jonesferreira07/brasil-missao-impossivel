import { useEffect, useRef, useState } from 'react';
import { brl, fuelPrices, IND_META, IND_ORDER, monthLabel, type IndKey } from '../economy/model';
import { IS_TOUCH } from '../game/device';
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
  g.fillStyle = '#d8d4c8';
  for (const r of ROADS) {
    const horiz = r.z1 === r.z2;
    const e = 1.5;
    if (horiz) g.fillRect(X(Math.min(r.x1, r.x2)), X(r.z1 - r.w / 2 - e), Math.abs(r.x2 - r.x1) * MAP_PX, (r.w + e * 2) * MAP_PX);
    else g.fillRect(X(r.x1 - r.w / 2 - e), X(Math.min(r.z1, r.z2)), (r.w + e * 2) * MAP_PX, Math.abs(r.z2 - r.z1) * MAP_PX);
  }
  g.fillStyle = '#34373c';
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

const MAP_LABELS: [string, number, number][] = [
  ['Planalto', 70, -160],
  ['Congresso', 0, -162],
  ['Supremo', -50, -161],
  ['Base Aérea', 160, -180],
  ['Supermercado', 161, 41],
  ['Posto', -150, 40],
  ['Tesouro', 48, -35],
  ['Banco Central', 80, -100],
  ['Quartel', 155, -28],
  ['Escola', -30, 140],
  ['UPA', 30, 135],
  ['Comércio', 110, 112],
  ['Bairro', -118, 150],
  ['Indústria', -125, -110],
  ['Esplanada', 0, -40],
];

function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [big, setBig] = useState(false);
  const bigRef = useRef(false);
  bigRef.current = big;
  useEffect(() => {
    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const c = ref.current;
      if (!c) return;
      const g = c.getContext('2d')!;
      const W = c.width;
      const css = c.clientWidth || 200;
      const k = (W / css) * 0.75; // tamanhos em pixels de tela (iguais no PC, no celular e no mapa ampliado)
      const fk = W / css; // fonte em px de tela
      const isBig = bigRef.current;
      const scale = isBig ? 1.25 : IS_TOUCH ? 2.6 : 2.0; // px do canvas por metro
      const v = runtime.vehicle ? runtime.vehicles.find((x) => x.id === runtime.vehicle) : null;
      const px = v ? v.x : runtime.player.x;
      const pz = v ? v.z : runtime.player.z;
      const pyaw = v ? v.yaw : runtime.player.yaw;
      const rot = runtime.cam.yaw; // mapa gira com a câmera: "para cima" = para onde a câmera olha
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#25331f';
      g.fillRect(0, 0, W, W);
      // mundo rotacionado
      g.save();
      g.translate(W / 2, W / 2);
      g.rotate(rot);
      const sm = getStaticMap();
      const kk = scale / MAP_PX;
      g.drawImage(sm, -(px + WORLD) * scale, -(pz + WORLD) * scale, sm.width * kk, sm.height * kk);
      const P2 = (x: number, z: number) => [(x - px) * scale, (z - pz) * scale];
      // carros dirigíveis
      for (const car of runtime.vehicles) {
        if (car.id === runtime.vehicle) continue;
        const [cx, cy] = P2(car.x, car.z);
        g.fillStyle = '#4cc9f0';
        g.strokeStyle = '#000';
        g.lineWidth = 2 * k;
        g.beginPath();
        g.arc(cx, cy, 6 * k, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
      // nomes dos lugares (sempre de pé)
      g.font = `700 ${Math.round((isBig ? 12 : 9.5) * fk)}px Inter, Arial, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const [name, x, z] of MAP_LABELS) {
        const [lx, ly] = P2(x, z);
        if (Math.hypot(lx, ly) > W * 0.72) continue;
        g.save();
        g.translate(lx, ly);
        g.rotate(-rot);
        g.lineWidth = 3 * fk;
        g.strokeStyle = 'rgba(0,0,0,.75)';
        g.strokeText(name, 0, 0);
        g.fillStyle = '#ffffff';
        g.fillText(name, 0, 0);
        g.restore();
      }
      g.restore();

      // objetivo: linha tracejada + estrela (ou seta na borda) + distância
      const s = useGame.getState();
      const st = MISSIONS[s.missionIndex]?.steps[s.stepIndex];
      const R = W / 2 - 14 * k;
      if (st) {
        const dxw = (st.target[0] - px) * scale;
        const dyw = (st.target[1] - pz) * scale;
        const cr = Math.cos(rot);
        const sr = Math.sin(rot);
        let tx = dxw * cr - dyw * sr;
        let ty = dxw * sr + dyw * cr;
        const d = Math.hypot(tx, ty);
        const edge = d > R;
        if (edge) {
          tx = (tx / d) * R;
          ty = (ty / d) * R;
        }
        g.save();
        g.translate(W / 2, W / 2);
        g.setLineDash([8 * k, 6 * k]);
        g.strokeStyle = 'rgba(255,214,10,.9)';
        g.lineWidth = 3 * k;
        g.beginPath();
        g.moveTo(0, 0);
        g.lineTo(tx, ty);
        g.stroke();
        g.setLineDash([]);
        g.translate(tx, ty);
        g.fillStyle = '#ffd60a';
        g.strokeStyle = '#000';
        g.lineWidth = 2.5 * k;
        g.beginPath();
        if (edge) {
          g.rotate(Math.atan2(ty, tx) + Math.PI / 2);
          g.moveTo(0, -13 * k);
          g.lineTo(10 * k, 9 * k);
          g.lineTo(-10 * k, 9 * k);
        } else {
          for (let i = 0; i < 10; i++) {
            const r = (i % 2 ? 6 : 14) * k;
            const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
            g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          }
        }
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
        // distância
        const meters = Math.round(Math.hypot(st.target[0] - px, st.target[1] - pz));
        const label = meters > 999 ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` : `${meters} m`;
        g.font = `800 ${Math.round((isBig ? 15 : 11) * fk)}px Inter, Arial, sans-serif`;
        g.textAlign = 'center';
        g.lineWidth = 4 * k;
        g.strokeStyle = 'rgba(0,0,0,.85)';
        g.strokeText(`★ ${label}`, W / 2, 30 * fk);
        g.fillStyle = '#ffd60a';
        g.fillText(`★ ${label}`, W / 2, 30 * fk);
      }

      // jogador (seta) no centro
      g.save();
      g.translate(W / 2, W / 2);
      g.rotate(rot - pyaw + Math.PI);
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#d62828';
      g.lineWidth = 3 * k;
      g.beginPath();
      g.moveTo(0, -15 * k);
      g.lineTo(11 * k, 12 * k);
      g.lineTo(0, 6 * k);
      g.lineTo(-11 * k, 12 * k);
      g.closePath();
      g.fill();
      g.stroke();
      g.restore();

      // Norte (gira junto)
      const nx = W / 2 + Math.sin(rot) * (W / 2 - 16 * k);
      const ny = W / 2 - Math.cos(rot) * (W / 2 - 16 * k);
      g.beginPath();
      g.fillStyle = '#c1121f';
      g.arc(nx, ny, 11 * k, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#fff';
      g.font = `900 ${Math.round(13 * k)}px Inter, Arial, sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('N', nx, ny + 1);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <>
      {big && <div className="map-backdrop" onClick={() => setBig(false)} />}
      <div className={`minimap ${big ? 'big' : ''}`} onClick={() => setBig((b) => !b)} title="Toque para ampliar">
        <canvas ref={ref} width={big ? 720 : 400} height={big ? 720 : 400} />
        {big && <div className="map-hint">Toque para fechar · ★ objetivo · ● carros</div>}
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
