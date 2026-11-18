// =============================================================
// MODELO ECONÔMICO SIMPLIFICADO (fictício e transparente)
// Cada mês o modelo recalcula os indicadores a partir de "alavancas"
// (gasto, impulso, credibilidade, oferta de alimentos...).
// Nenhuma opção é sempre certa: o efeito depende do contexto.
// =============================================================

export type IndKey =
  | 'inflation'
  | 'debt'
  | 'primary'
  | 'unemployment'
  | 'taxBurden'
  | 'popularity'
  | 'purchasingPower'
  | 'services'
  | 'confidence'
  | 'picanha';

export const IND_ORDER: IndKey[] = [
  'inflation',
  'debt',
  'primary',
  'unemployment',
  'taxBurden',
  'popularity',
  'purchasingPower',
  'services',
  'confidence',
  'picanha',
];

const num = (v: number, d = 1) => v.toFixed(d).replace('.', ',');
const pct = (v: number) => `${num(v)}%`;
export const brl = (v: number) => `R$ ${num(v, 2)}`;

export interface IndMeta {
  label: string;
  short: string;
  better: 'up' | 'down';
  fmt: (v: number) => string;
  desc: string;
}

export const IND_META: Record<IndKey, IndMeta> = {
  inflation: {
    label: 'Inflação (12 meses)',
    short: 'Inflação',
    better: 'down',
    fmt: pct,
    desc: 'Sobe com déficit persistente, baixa confiança, choques de oferta e economia superaquecida. Corrói o poder de compra.',
  },
  debt: {
    label: 'Dívida pública (% do PIB)',
    short: 'Dívida',
    better: 'down',
    fmt: pct,
    desc: 'Cresce com déficits primários e quando os juros reais superam o crescimento. Os juros sobem quando a confiança cai.',
  },
  primary: {
    label: 'Resultado primário (% do PIB)',
    short: 'Déficit/Superávit',
    better: 'up',
    fmt: (v) => `${v >= 0 ? '+' : ''}${num(v)}%`,
    desc: 'Arrecadação menos despesas, sem juros. Negativo = déficit. Depende de impostos, gastos e do crescimento (que mexe na arrecadação).',
  },
  unemployment: {
    label: 'Desemprego',
    short: 'Desemprego',
    better: 'down',
    fmt: pct,
    desc: 'Cai quando o PIB cresce acima de ~1,5% ao ano e sobe em recessão, com atraso.',
  },
  taxBurden: {
    label: 'Carga tributária (% do PIB)',
    short: 'Carga tributária',
    better: 'down',
    fmt: pct,
    desc: 'Mais imposto aumenta a arrecadação, mas reduz a atividade. Acima de ~36% a sonegação cresce e parte do ganho some.',
  },
  popularity: {
    label: 'Popularidade presidencial',
    short: 'Popularidade',
    better: 'up',
    fmt: pct,
    desc: 'Responde a poder de compra, emprego, inflação e serviços. Discursos e anúncios dão bônus que evaporam.',
  },
  purchasingPower: {
    label: 'Poder de compra (índice)',
    short: 'Poder de compra',
    better: 'up',
    fmt: (v) => num(v, 0),
    desc: 'Sobe quando os salários crescem mais que a inflação. Salários crescem mais com desemprego baixo.',
  },
  services: {
    label: 'Qualidade dos serviços públicos (0–100)',
    short: 'Serviços públicos',
    better: 'up',
    fmt: (v) => num(v, 0),
    desc: 'Dependem do gasto e da eficiência da máquina. Cortes indiscriminados derrubam a qualidade.',
  },
  confidence: {
    label: 'Confiança dos investidores (0–100)',
    short: 'Confiança',
    better: 'up',
    fmt: (v) => num(v, 0),
    desc: 'Reage ao resultado fiscal, à dívida, à inflação e à credibilidade dos planos anunciados.',
  },
  picanha: {
    label: 'Preço da picanha (R$/kg)',
    short: 'Picanha',
    better: 'down',
    fmt: brl,
    desc: 'Segue a inflação, a demanda por carne e a oferta de alimentos (frete, produção, guerra fictícia).',
  },
};

export interface Levers {
  spending: number; // despesa primária (% PIB)
  impulse: number; // impulso de demanda recente (decai)
  credibility: number; // credibilidade dos planos (afeta confiança)
  foodSupply: number; // oferta de alimentos (1 = normal)
  supplyShock: number; // choque estrutural de oferta (guerra, greve)
  meatDemand: number; // demanda por carne (1 = normal)
  efficiency: number; // eficiência da máquina pública
  popBoost: number; // bônus de popularidade passageiro
  growthBoost: number; // estímulo temporário ao crescimento
  inflationShock: number; // choque de expectativas/preços
  dieselSubsidy: number; // subsídio ao diesel (R$/litro)
  rateCut: number; // corte de juros forçado (p.p.) — 'na canetada'
  institutions: number; // equilíbrio entre os Poderes (-10 desequilíbrio grave … +10 instituições fortes e independentes)
}
export type LevKey = keyof Levers;

export interface Delta {
  ind?: Partial<Record<IndKey, number>>;
  lev?: Partial<Levers>;
  picanhaMult?: number;
}

export interface Delayed {
  label: string;
  inMonths: number;
  delta: Delta;
  message?: string;
}

export interface Econ {
  ind: Record<IndKey, number>;
  lev: Levers;
  month: number;
  growth: number; // PIB % a.a.
  spending0: number;
  priceLevel: number; // nível geral de preços (1 = início)
  delayed: Delayed[];
}

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function computeGrowth(e: Econ): number {
  const { ind, lev } = e;
  return (
    1.5 +
    (ind.confidence - 50) * 0.05 -
    (ind.taxBurden - 33) * 0.25 +
    lev.impulse * 0.6 -
    Math.max(0, ind.inflation - 8) * 0.15 +
    (lev.foodSupply - 1) * 10 +
    lev.growthBoost +
    lev.efficiency * 0.12 +
    (lev.institutions ?? 0) * 0.06 + // segurança jurídica
    (lev.rateCut ?? 0) * 0.35 // juro baixo estimula no curto prazo
  );
}

export function computeRevenue(e: Econ, g: number): number {
  const { ind, lev } = e;
  return (
    ind.taxBurden * (1 + 0.015 * (g - 1.5)) -
    Math.max(0, ind.taxBurden - 36) * 0.4 + // sonegação
    lev.efficiency * 0.08 // combate a desperdícios/sonegação
  );
}

export function recompute(e: Econ) {
  e.growth = computeGrowth(e);
  e.ind.primary = computeRevenue(e, e.growth) - e.lev.spending;
}

function clampAll(e: Econ) {
  const i = e.ind;
  i.inflation = clamp(i.inflation, -2, 80);
  i.debt = clamp(i.debt, 20, 250);
  i.unemployment = clamp(i.unemployment, 2, 35);
  i.taxBurden = clamp(i.taxBurden, 20, 50);
  i.popularity = clamp(i.popularity, 0, 100);
  i.purchasingPower = clamp(i.purchasingPower, 20, 150);
  i.services = clamp(i.services, 0, 100);
  i.confidence = clamp(i.confidence, 0, 100);
  i.picanha = clamp(i.picanha, 25, 999);
  const l = e.lev;
  l.foodSupply = clamp(l.foodSupply, 0.5, 1.2);
  l.supplyShock = clamp(l.supplyShock, -0.1, 0.5);
  l.meatDemand = clamp(l.meatDemand, 0.6, 1.8);
  l.credibility = clamp(l.credibility, -30, 40);
  l.institutions = clamp(l.institutions ?? 0, -10, 10);
  l.rateCut = clamp(l.rateCut ?? 0, -6, 8);
}

export function initialEcon(): Econ {
  const e: Econ = {
    ind: {
      inflation: 11.8,
      debt: 92,
      primary: 0,
      unemployment: 12.5,
      taxBurden: 34,
      popularity: 38,
      purchasingPower: 72,
      services: 45,
      confidence: 32,
      picanha: 159.9,
    },
    lev: {
      spending: 0,
      impulse: 0,
      credibility: 10,
      foodSupply: 0.88,
      supplyShock: 0.12,
      meatDemand: 1,
      efficiency: 0,
      popBoost: 0,
      growthBoost: 0,
      inflationShock: 0,
      dieselSubsidy: 0,
      institutions: 0,
      rateCut: 0,
    },
    month: 0,
    growth: 0,
    spending0: 0,
    priceLevel: 1,
    delayed: [],
  };
  const g = computeGrowth(e);
  e.lev.spending = computeRevenue(e, g) + 2.4; // começa com déficit de 2,4% do PIB
  e.spending0 = e.lev.spending;
  recompute(e);
  return e;
}

export function cloneEcon(e: Econ): Econ {
  return JSON.parse(JSON.stringify(e));
}

export function applyDelta(e: Econ, d: Delta) {
  if (d.ind) {
    for (const [k, v] of Object.entries(d.ind)) {
      if (k === 'primary' || v == null) continue; // primário é derivado
      e.ind[k as IndKey] += v;
    }
  }
  if (d.lev) {
    for (const [k, v] of Object.entries(d.lev)) {
      if (v == null) continue;
      e.lev[k as LevKey] += v;
    }
  }
  if (d.picanhaMult) e.ind.picanha *= d.picanhaMult;
  clampAll(e);
  recompute(e);
}

/** Avança um mês. Retorna mensagens de efeitos defasados que chegaram. */
export function stepMonth(e: Econ): string[] {
  const msgs: string[] = [];
  e.delayed = e.delayed.filter((d) => {
    d.inMonths -= 1;
    if (d.inMonths <= 0) {
      applyDelta(e, d.delta);
      if (d.message) msgs.push(d.message);
      return false;
    }
    return true;
  });
  recompute(e);
  const { ind, lev } = e;
  const g = e.growth;

  // Dívida: déficit primário + (juros reais - crescimento) * dívida
  const realRate = 4 + (50 - ind.confidence) * 0.08 + Math.max(0, ind.debt - 80) * 0.05 - (lev.rateCut ?? 0);
  ind.debt += (-ind.primary + ((realRate - g) * ind.debt) / 100) / 12;

  // Inflação converge para um alvo que depende de fiscal, confiança, oferta e aquecimento
  const inflT =
    3.5 +
    Math.max(0, -ind.primary - 0.5) * 0.9 +
    (50 - ind.confidence) * 0.06 +
    (1 - lev.foodSupply) * 15 +
    Math.max(0, g - 2.5) * 0.6 +
    lev.inflationShock +
    Math.max(0, lev.rateCut ?? 0) * 0.7; // juro artificialmente baixo pressiona preços
  ind.inflation += (inflT - ind.inflation) * 0.15;
  e.priceLevel *= 1 + ind.inflation / 1200;

  // Desemprego (Lei de Okun simplificada)
  const uT = 9 - (g - 1.5) * 1.1;
  ind.unemployment += (uT - ind.unemployment) * 0.1;

  // Poder de compra: salário nominal vs inflação
  const wage = 6.5 - (ind.unemployment - 9) * 0.4 + Math.max(0, g) * 0.3;
  ind.purchasingPower *= 1 + (wage - ind.inflation) / 1200;

  // Serviços dependem de gasto e eficiência
  const sT = 45 + (lev.spending - e.spending0) * 5 + lev.efficiency * 4;
  ind.services += (sT - ind.services) * 0.1;

  // Confiança
  const cT =
    50 +
    ind.primary * 6 -
    Math.max(0, ind.debt - 80) * 0.6 -
    Math.max(0, ind.inflation - 6) * 1.2 +
    lev.credibility +
    (lev.institutions ?? 0) * 0.5;
  ind.confidence += (cT - ind.confidence) * 0.12;

  // Popularidade
  const pT =
    50 +
    (ind.purchasingPower - 80) * 0.6 -
    (ind.unemployment - 9) * 2 -
    (ind.inflation - 5) * 1.5 +
    (ind.services - 50) * 0.3 +
    lev.popBoost;
  ind.popularity += (pT - ind.popularity) * 0.15;

  // Picanha: inflação + demanda vs oferta
  const picT = 110 * e.priceLevel * (1 + (lev.meatDemand - lev.foodSupply) * 2.5);
  ind.picanha += (picT - ind.picanha) * 0.12;

  // Decaimento das alavancas temporárias
  lev.impulse *= 0.85;
  lev.popBoost *= 0.75;
  lev.growthBoost *= 0.92;
  lev.inflationShock *= 0.9;
  lev.rateCut = (lev.rateCut ?? 0) * 0.96;
  lev.meatDemand += (1 - lev.meatDemand) * 0.15;
  lev.supplyShock *= 0.95;
  lev.foodSupply += (1 - lev.supplyShock - lev.foodSupply) * 0.1;

  e.month += 1;
  clampAll(e);
  recompute(e);
  return msgs;
}

/** Saúde geral da economia (0 = ruína, 1 = ótimo). Usada para o visual da cidade. */
export function health(e: Econ): number {
  const i = e.ind;
  const n = (v: number, bad: number, good: number) => clamp((v - bad) / (good - bad), 0, 1);
  return (
    (n(i.inflation, 15, 3) +
      n(i.unemployment, 15, 6) +
      n(i.purchasingPower, 60, 100) +
      n(i.services, 30, 80) +
      n(i.confidence, 20, 75)) /
    5
  );
}

export function fuelPrices(e: Econ) {
  const scarcity = 1 - e.lev.foodSupply;
  const gas = 6.89 * e.priceLevel * (1 + Math.max(0, scarcity) * 1.2);
  const diesel = Math.max(3, 6.49 * e.priceLevel * (1 + Math.max(0, scarcity) * 2) - e.lev.dieselSubsidy);
  return { gas, diesel };
}

export function groceryPrices(e: Econ) {
  const scarcity = Math.max(0, 1 - e.lev.foodSupply);
  const f = e.priceLevel * (1 + scarcity * 1.5);
  return {
    arroz: 32.9 * f,
    feijao: 12.9 * f,
    cafe: 49.9 * f,
    oleo: 11.5 * f,
    picanha: e.ind.picanha,
  };
}

export type EndingId = 'colapso' | 'sobrevivencia' | 'recuperacao' | 'milagre';

export function evaluateEnding(e: Econ): EndingId {
  const i = e.ind;
  if (
    i.inflation < 5 &&
    i.unemployment < 9 &&
    i.picanha < 145 &&
    i.popularity > 45 &&
    i.primary > 0 &&
    i.debt < 105 &&
    i.confidence > 65 &&
    i.services > 50 &&
    i.purchasingPower > 72
  )
    return 'milagre';
  if (i.inflation > 13 || i.debt > 112 || i.services < 28 || (i.confidence < 18 && i.unemployment > 14))
    return 'colapso';
  if (i.inflation < 8 && i.unemployment < 11 && i.primary > -1.5 && i.confidence > 45) return 'recuperacao';
  return 'sobrevivencia';
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export function monthLabel(m: number) {
  const y = Math.floor(m / 12);
  return `${MESES[m % 12]}/203X${y > 0 ? `+${y}` : ''}`;
}
