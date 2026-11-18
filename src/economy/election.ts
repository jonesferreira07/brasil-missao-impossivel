// =============================================================
// DESAFIO FINAL — ELEIÇÃO E SEGUNDO MANDATO (simulação fictícia)
// =============================================================
import { applyDelta, clamp, cloneEcon, evaluateEnding, health, stepMonth, type Delta, type Econ, type IndKey } from './model';

export type CampaignPlan = 'paraiso' | 'continuidade' | 'eficiencia' | 'ataque';

export interface Campaign {
  plan: CampaignPlan;
  bonus: number; // pontos percentuais gerais
  commerceBonus: number; // bônus extra no Centro Comercial (pequenos e médios empresários)
}

export const OPPONENT = { name: 'Dr. Teodoro Talvez', party: 'Partido do Amanhã Talvez (fictício)' };

export interface RegionResult {
  id: string;
  name: string;
  weight: number; // peso no eleitorado
  share: number; // % de votos válidos para o presidente
  note: string;
}

export interface ElectionResult {
  regions: RegionResult[];
  total: number;
  won: boolean;
}

function rng(seed: number) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

const f1 = (v: number) => v.toFixed(1).replace('.', ',');

export function runElection(e: Econ, c: Campaign, seed: number): ElectionResult {
  const i = e.ind;
  const r = rng(seed);
  const noise = () => (r() - 0.5) * 4;
  const base = 50 + (i.popularity - 38) * 0.6 + c.bonus;
  const regions: RegionResult[] = [
    {
      id: 'bairro',
      name: 'Bairro Residencial',
      weight: 0.3,
      share: base + (i.purchasingPower - 72) * 0.6 - (i.picanha - 140) * 0.06 + noise(),
      note: `Famílias olharam o carrinho: poder de compra ${i.purchasingPower.toFixed(0)}, picanha a R$ ${f1(i.picanha)}.`,
    },
    {
      id: 'comercio',
      name: 'Centro Comercial',
      weight: 0.2,
      share: base - (i.taxBurden - 33.5) * 3 + e.growth * 1.2 + c.commerceBonus + noise(),
      note: `Pequenos e médios empresários pesaram a carga tributária (${f1(i.taxBurden)}%) e o crescimento (${f1(e.growth)}% a.a.).`,
    },
    {
      id: 'industria',
      name: 'Área Industrial',
      weight: 0.15,
      share: base - (i.unemployment - 10) * 1.5 + noise(),
      note: `Operários votaram pensando no emprego: desemprego em ${f1(i.unemployment)}%.`,
    },
    {
      id: 'esplanada',
      name: 'Esplanada (servidores)',
      weight: 0.1,
      share: base + (i.services - 50) * 0.4 - (c.plan === 'eficiencia' ? 4 : 0) + noise(),
      note: c.plan === 'eficiencia' ? 'A promessa de cortar supersalários e penduricalhos dividiu a Esplanada.' : `Servidores avaliaram a qualidade dos serviços (${i.services.toFixed(0)}/100).`,
    },
    {
      id: 'entorno',
      name: 'Entorno e Periferia',
      weight: 0.25,
      share: base - (i.inflation - 6) * 1.2 + (i.services - 50) * 0.2 + noise(),
      note: `Quem mais sente a inflação (${f1(i.inflation)}%) decidiu a eleição.`,
    },
  ];
  for (const g of regions) g.share = clamp(g.share, 12, 88);
  const total = regions.reduce((a, g) => a + g.share * g.weight, 0);
  return { regions, total, won: total > 50 };
}

// ------------------------------------------------------------- Segundo mandato
export const PLAN_INFO: Record<CampaignPlan, { title: string; delta: Delta; desc: string }> = {
  paraiso: {
    title: 'Promessa do Paraíso',
    desc: 'Picanha grátis, imposto zero e aumento para todos — sem dizer como pagar.',
    delta: { ind: { taxBurden: -2, popularity: 6 }, lev: { spending: 2.5, impulse: 2.5, popBoost: 8, credibility: -16 } },
  },
  continuidade: {
    title: 'Continuidade Responsável',
    desc: 'Manter o rumo das reformas, com ajustes graduais.',
    delta: { lev: { credibility: 3, efficiency: 1 } },
  },
  eficiencia: {
    title: 'Choque de Eficiência',
    desc: 'Fim dos supersalários e penduricalhos, corte de desperdício e alívio de impostos para pequenos e médios empresários.',
    delta: { ind: { taxBurden: -1.2 }, lev: { spending: -1.1, efficiency: 2.5, growthBoost: 1.3, credibility: 6 } },
  },
  ataque: {
    title: 'Campanha do Ataque',
    desc: 'Nenhuma proposta, muitas acusações. O segundo mandato começa sem plano.',
    delta: { lev: { credibility: -6, efficiency: -0.8 } },
  },
};

export interface Snapshot {
  label: string;
  ind: Record<IndKey, number>;
  growth: number;
}

export interface ContinuityResult {
  won: boolean;
  title: string;
  desc: string;
  snapshots: Snapshot[];
  verdict: 'otimo' | 'bom' | 'regular' | 'colapso';
  life: string[];
}

export function simulateContinuity(e0: Econ, c: Campaign, won: boolean): ContinuityResult {
  const e = cloneEcon(e0);
  const info = won ? PLAN_INFO[c.plan] : { title: 'A herança que você deixou', desc: `${OPPONENT.name} assume e mantém a máquina no piloto automático.`, delta: { lev: { credibility: -2 } } as Delta };
  applyDelta(e, info.delta);
  // a guerra fictícia termina aos poucos
  e.lev.supplyShock *= 0.5;
  const snaps: Snapshot[] = [{ label: 'Início', ind: { ...e0.ind }, growth: e0.growth }];
  for (let y = 1; y <= 4; y++) {
    for (let m = 0; m < 12; m++) stepMonth(e);
    // promessa do paraíso: a conta chega em ondas
    if (won && c.plan === 'paraiso' && y <= 2) applyDelta(e, { lev: { inflationShock: 2.5, credibility: -4 } });
    snaps.push({ label: `Ano ${y}`, ind: { ...e.ind }, growth: e.growth });
  }
  const end = evaluateEnding(e);
  const verdict = end === 'milagre' ? 'otimo' : end === 'recuperacao' ? 'bom' : end === 'sobrevivencia' ? 'regular' : 'colapso';
  const a = e0.ind;
  const b = e.ind;
  const life: string[] = [];
  const du = b.unemployment - a.unemployment;
  life.push(du < -0.5 ? `Mais gente trabalhando: o desemprego caiu de ${f1(a.unemployment)}% para ${f1(b.unemployment)}%.` : du > 0.5 ? `O emprego piorou: desemprego foi de ${f1(a.unemployment)}% para ${f1(b.unemployment)}%.` : `O emprego ficou parecido: desemprego em ${f1(b.unemployment)}%.`);
  const dp = b.purchasingPower - a.purchasingPower;
  life.push(dp > 2 ? `O salário passou a render mais: poder de compra subiu de ${a.purchasingPower.toFixed(0)} para ${b.purchasingPower.toFixed(0)}.` : dp < -2 ? `O carrinho encolheu: poder de compra caiu de ${a.purchasingPower.toFixed(0)} para ${b.purchasingPower.toFixed(0)}.` : 'O poder de compra ficou praticamente parado.');
  life.push(b.inflation < 5 ? `Preços sob controle: inflação de ${f1(b.inflation)}%.` : b.inflation > 10 ? `A inflação voltou a assustar: ${f1(b.inflation)}%.` : `Inflação de ${f1(b.inflation)}% — nem crise, nem tranquilidade.`);
  life.push(b.services > a.services + 3 ? `Escolas e postos de saúde melhoraram (serviços ${b.services.toFixed(0)}/100).` : b.services < a.services - 3 ? `Serviços públicos pioraram (${b.services.toFixed(0)}/100).` : `Serviços públicos estáveis (${b.services.toFixed(0)}/100).`);
  life.push(b.taxBurden < a.taxBurden - 0.5 ? `Quem produz respirou: carga tributária caiu para ${f1(b.taxBurden)}%.` : `A carga tributária terminou em ${f1(b.taxBurden)}%.`);
  life.push(b.picanha < a.picanha ? `E a picanha? Caiu para R$ ${f1(b.picanha)}/kg.` : `E a picanha? Subiu para R$ ${f1(b.picanha)}/kg.`);
  void health;
  return { won, title: info.title, desc: info.desc, snapshots: snaps, verdict, life };
}
