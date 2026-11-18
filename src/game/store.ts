import { create } from 'zustand';
import {
  applyDelta,
  cloneEcon,
  evaluateEnding,
  initialEcon,
  monthLabel,
  stepMonth,
  type EndingId,
  type Econ,
  type IndKey,
} from '../economy/model';
import { runElection, simulateContinuity, type Campaign, type ContinuityResult, type ElectionResult } from '../economy/election';
import { ELECTION_INDEX, MISSIONS, resolveNegotiation } from '../missions/data';
import type { Outcome } from '../missions/types';
import { P } from './places';
import { resetRuntime, runtime } from './runtime';
import { sfx } from './sfx';

const SAVE_KEY = 'brasil-missao-impossivel-save-v1';

export interface Notif {
  id: number;
  text: string;
  kind: 'info' | 'good' | 'bad' | 'joke' | 'mission';
}
export interface DecisionRecord {
  missionId: string;
  missionTitle: string;
  optionId: string;
  optionTitle: string;
  month: number;
  headline: string;
}
export interface OutcomeView {
  missionId: string;
  optionTitle: string;
  headline: string;
  messages: string[];
  before: Record<IndKey, number>;
  after: Record<IndKey, number>;
  phase: 'now' | 'later';
  months: number;
  laterMessages: string[];
  laterAfter?: Record<IndKey, number>;
  joke?: boolean;
}
export interface Dialogue {
  speaker: string;
  lines: string[];
  index: number;
  onDone?: () => void;
}

type Screen = 'menu' | 'intro' | 'playing' | 'ending' | 'final';

interface SaveData {
  v: 1;
  econ: Econ;
  missionIndex: number;
  stepIndex: number;
  history: DecisionRecord[];
  headlines: string[];
  startedMissions: string[];
  player: { x: number; z: number };
  savedAt: number;
  campaign?: Campaign | null;
  ending?: EndingId | null;
}

export interface GameState {
  screen: Screen;
  paused: boolean;
  showHowTo: boolean;
  showHistory: boolean;
  panelExpanded: boolean;
  missionIntro: boolean;
  econ: Econ;
  trendBase: Record<IndKey, number>;
  missionIndex: number;
  stepIndex: number;
  startedMissions: string[];
  history: DecisionRecord[];
  headlines: string[];
  notifications: Notif[];
  dialogue: Dialogue | null;
  decisionOpen: boolean;
  negotiationOpen: boolean;
  outcome: OutcomeView | null;
  ending: EndingId | null;
  prompt: string | null;
  inVehicle: string | null;
  radioStation: number;
  hasSave: boolean;
  lastSaved: number;
  campaign: Campaign | null;
  election: ElectionResult | null;
  electionOpen: boolean;
  continuity: ContinuityResult | null;
  /** Econ no fim do primeiro mandato (antes da campanha) */
  mandateEcon: Econ | null;
  introLine: { speaker: string; text: string } | null;

  set: (p: Partial<GameState>) => void;
  togglePanel: () => void;
  newGame: () => void;
  continueGame: () => void;
  save: (silent?: boolean) => void;
  toMenu: () => void;
  notify: (text: string, kind?: Notif['kind']) => void;
  dismiss: (id: number) => void;
  tickMonth: () => void;
  beginMission: () => void;
  advanceStep: () => void;
  openDialogue: (speaker: string, lines: string[], onDone?: () => void) => void;
  advanceDialogue: () => void;
  decide: (optionId: string) => void;
  negotiate: (accepted: string[], appealed: boolean) => { votes: number; approved: boolean };
  outcomeContinue: () => void;
  finale: () => void;
  startElection: () => void;
  openElection: () => void;
  runContinuity: () => void;
  finishIntro: () => void;
}

let nid = 1;

function readSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    return d && d.v === 1 ? d : null;
  } catch {
    return null;
  }
}

const INITIAL_HEADLINES = [
  'O FICTÍCIO DE BRASÍLIA: PICANHA É VISTA PELA ÚLTIMA VEZ EM 203X-1',
  'DÍVIDA PÚBLICA SOBE TANTO QUE GANHA VISTA PARA O MAR',
  'GUERRA FICTÍCIA ENTRE PETROLÂNDIA E FERTILIZÂNIA ENCARECE COMBUSTÍVEIS',
  'CONGRESSO FUNCIONA EM CONDIÇÕES PRECÁRIAS; CAFEZINHO É RACIONADO',
];

const RANDOM_HEADLINES = (e: Econ) => [
  `INFLAÇÃO EM ${e.ind.inflation.toFixed(1).replace('.', ',')}%: FEIRANTE PEDE PAGAMENTO EM DISCURSO, NÃO ACEITAM`,
  `DESEMPREGO EM ${e.ind.unemployment.toFixed(1).replace('.', ',')}%: FILAS DE CURRÍCULO DOBRAM O QUARTEIRÃO`,
  `CONFIANÇA DO MERCADO EM ${e.ind.confidence.toFixed(0)} PONTOS; ANALISTAS CONSULTAM HORÓSCOPO`,
  'NOVO MINISTÉRIO CRIADO: MINISTÉRIO DA SOLUÇÃO DOS PROBLEMAS CRIADOS ONTEM',
  `PICANHA A R$ ${e.ind.picanha.toFixed(2).replace('.', ',')}: CHURRASQUEIROS FAZEM VAQUINHA`,
  'ESTUDO FICTÍCIO: 9 EM CADA 10 PROMESSAS AINDA ESTÃO "EM ESTUDO"',
];

export const useGame = create<GameState>((set, get) => {
  const econ = initialEcon();
  return {
    screen: 'menu',
    paused: false,
    showHowTo: false,
    showHistory: false,
    panelExpanded: false,
    missionIntro: false,
    econ,
    trendBase: { ...econ.ind },
    missionIndex: 0,
    stepIndex: 0,
    startedMissions: [],
    history: [],
    headlines: [...INITIAL_HEADLINES],
    notifications: [],
    dialogue: null,
    decisionOpen: false,
    negotiationOpen: false,
    outcome: null,
    ending: null,
    prompt: null,
    inVehicle: null,
    radioStation: 0,
    hasSave: !!readSave(),
    lastSaved: 0,
    campaign: null,
    election: null,
    electionOpen: false,
    continuity: null,
    mandateEcon: null,
    introLine: null,

    set: (p) => set(p),
    togglePanel: () => set({ panelExpanded: !get().panelExpanded }),

    newGame: () => {
      const e = initialEcon();
      resetRuntime(P.spawn[0], P.spawn[1]);
      runtime.introT = 0;
      set({
        screen: 'intro',
        introLine: null,
        paused: false,
        econ: e,
        trendBase: { ...e.ind },
        missionIndex: 0,
        stepIndex: 0,
        startedMissions: [],
        history: [],
        headlines: [...INITIAL_HEADLINES],
        notifications: [],
        dialogue: null,
        decisionOpen: false,
        negotiationOpen: false,
        outcome: null,
        ending: null,
        inVehicle: null,
        campaign: null,
        election: null,
        electionOpen: false,
        continuity: null,
        mandateEcon: null,
      });
    },

    continueGame: () => {
      const d = readSave();
      if (!d) return get().newGame();
      resetRuntime(d.player.x, d.player.z);
      d.econ.lev.institutions ??= 0;
      d.econ.lev.rateCut ??= 0;
      set({
        screen: 'playing',
        paused: false,
        econ: d.econ,
        trendBase: { ...d.econ.ind },
        missionIndex: d.missionIndex,
        stepIndex: d.stepIndex,
        startedMissions: d.startedMissions,
        history: d.history,
        headlines: d.headlines,
        notifications: [],
        dialogue: null,
        decisionOpen: false,
        negotiationOpen: false,
        outcome: null,
        ending: d.ending ?? null,
        inVehicle: null,
        campaign: d.campaign ?? null,
        election: null,
        electionOpen: false,
        continuity: null,
        mandateEcon: d.ending ? d.econ : null,
      });
      get().notify('Governo retomado. Bem-vindo de volta, presidente.', 'info');
      if (d.missionIndex < MISSIONS.length && d.stepIndex === 0) set({ missionIntro: true });
    },

    save: (silent) => {
      const s = get();
      const data: SaveData = {
        v: 1,
        econ: s.econ,
        missionIndex: s.missionIndex,
        stepIndex: s.stepIndex,
        history: s.history,
        headlines: s.headlines.slice(0, 20),
        startedMissions: s.startedMissions,
        player: { x: runtime.player.x, z: runtime.player.z },
        savedAt: Date.now(),
        campaign: s.campaign,
        ending: s.ending,
      };
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(data));
        set({ hasSave: true, lastSaved: Date.now() });
        if (!silent) get().notify('Progresso salvo.', 'info');
      } catch {
        if (!silent) get().notify('Não foi possível salvar neste navegador.', 'bad');
      }
    },

    toMenu: () => {
      get().save(true);
      set({ screen: 'menu', paused: false, outcome: null, decisionOpen: false, negotiationOpen: false, dialogue: null });
    },

    notify: (text, kind = 'info') => {
      const id = nid++;
      set({ notifications: [...get().notifications.slice(-4), { id, text, kind }] });
      sfx(kind === 'bad' ? 'bad' : kind === 'good' ? 'good' : 'ping');
      setTimeout(() => get().dismiss(id), 7000);
    },
    dismiss: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),

    tickMonth: () => {
      const s = get();
      const e = cloneEcon(s.econ);
      const before = { ...e.ind };
      const msgs = stepMonth(e);
      set({ econ: e, trendBase: before });
      for (const m of msgs) get().notify(m, 'info');
      const pool = RANDOM_HEADLINES(e);
      const h = pool[Math.floor(Math.random() * pool.length)];
      set({ headlines: [h, ...get().headlines].slice(0, 20) });
      get().notify(`${monthLabel(e.month)} — o tempo passa e a economia reage.`, 'info');
    },

    beginMission: () => {
      const s = get();
      const m = MISSIONS[s.missionIndex];
      if (!m) return;
      if (!s.startedMissions.includes(m.id)) {
        const e = cloneEcon(s.econ);
        if (m.onStart) applyDelta(e, m.onStart);
        set({ econ: e, startedMissions: [...s.startedMissions, m.id] });
        if (m.onStartMessage) get().notify(m.onStartMessage, 'bad');
      }
      set({ missionIntro: true });
    },

    advanceStep: () => {
      const s = get();
      const m = MISSIONS[s.missionIndex];
      if (!m) return;
      const next = s.stepIndex + 1;
      set({ stepIndex: next });
      const st = m.steps[next];
      if (st) get().notify(`Objetivo: ${st.text}`, 'mission');
    },

    openDialogue: (speaker, lines, onDone) => set({ dialogue: { speaker, lines, index: 0, onDone } }),
    advanceDialogue: () => {
      const d = get().dialogue;
      if (!d) return;
      if (d.index + 1 < d.lines.length) set({ dialogue: { ...d, index: d.index + 1 } });
      else {
        set({ dialogue: null });
        d.onDone?.();
      }
    },

    decide: (optionId) => {
      const s = get();
      const m = MISSIONS[s.missionIndex];
      const opt = m?.options?.find((o) => o.id === optionId);
      if (!m || !opt) return;
      const res = opt.resolve(cloneEcon(s.econ));
      applyOutcome(m.id, m.title, opt.id, opt.title, res, m.monthsAfter, !!opt.joke);
    },

    negotiate: (accepted, appealed) => {
      const s = get();
      const m = MISSIONS[s.missionIndex];
      const r = resolveNegotiation(cloneEcon(s.econ), accepted, appealed);
      const title = r.approved ? `Pacote aprovado (${r.votes} votos)` : `Pacote rejeitado (${r.votes} votos)`;
      applyOutcome(m.id, m.title, 'NEG', title, r.outcome, m.monthsAfter, false);
      return { votes: r.votes, approved: r.approved };
    },

    outcomeContinue: () => {
      const s = get();
      const o = s.outcome;
      if (!o) return;
      if (o.phase === 'now' && o.months > 0) {
        const e = cloneEcon(s.econ);
        const lm: string[] = [];
        for (let i = 0; i < o.months; i++) lm.push(...stepMonth(e));
        set({ econ: e, trendBase: { ...o.after }, outcome: { ...o, phase: 'later', laterMessages: lm, laterAfter: { ...e.ind } } });
        sfx('ping');
        return;
      }
      const mission = MISSIONS[s.missionIndex];
      if (mission && s.stepIndex < mission.steps.length - 1) {
        set({ outcome: null });
        get().advanceStep();
        get().save(true);
        return;
      }
      // missão concluída
      const nextIndex = s.missionIndex + 1;
      set({ outcome: null, missionIndex: nextIndex, stepIndex: 0 });
      get().notify(`Missão concluída: ${MISSIONS[s.missionIndex].title}`, 'good');
      get().beginMission();
      get().save(true);
    },

    finale: () => {
      const e = get().econ;
      const ending = evaluateEnding(e);
      // o desafio final (Missão 9) fica pronto para começar
      set({ ending, screen: 'ending', missionIndex: ELECTION_INDEX, stepIndex: 0, mandateEcon: cloneEcon(e), dialogue: null });
      get().save(true);
      sfx('good');
    },

    finishIntro: () => {
      if (get().screen !== 'intro') return;
      runtime.player.x = P.spawn[0];
      runtime.player.z = P.spawn[1];
      runtime.player.yaw = 0;
      runtime.cam.yaw = Math.PI;
      runtime.cam.pitch = 0.3;
      set({ screen: 'playing', introLine: null });
      get().beginMission();
    },

    startElection: () => {
      set({ screen: 'playing', paused: false, missionIndex: ELECTION_INDEX, stepIndex: 0 });
      get().beginMission();
    },

    openElection: () => {
      const s = get();
      const c = s.campaign ?? { plan: 'continuidade', bonus: 0, commerceBonus: 0 };
      const result = runElection(s.econ, c, Date.now() % 100000);
      set({ election: result, electionOpen: true, campaign: c });
      sfx('stamp');
    },

    runContinuity: () => {
      const s = get();
      if (!s.election) return;
      const c = s.campaign ?? { plan: 'continuidade', bonus: 0, commerceBonus: 0 };
      const cont = simulateContinuity(s.econ, c, s.election.won);
      set({ continuity: cont, electionOpen: false, screen: 'final' });
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {
        /* ignore */
      }
      set({ hasSave: false });
      sfx(s.election.won ? 'good' : 'bad');
    },
  };

  function applyOutcome(missionId: string, missionTitle: string, optionId: string, optionTitle: string, res: Outcome, months: number, joke: boolean) {
    const s = get();
    const e = cloneEcon(s.econ);
    const before = { ...e.ind };
    applyDelta(e, res.delta);
    if (res.delayed) e.delayed.push(...res.delayed.map((d) => ({ ...d })));
    const rec: DecisionRecord = { missionId, missionTitle, optionId, optionTitle, month: e.month, headline: res.headline };
    if (res.campaign) set({ campaign: res.campaign });
    set({
      econ: e,
      trendBase: before,
      decisionOpen: false,
      negotiationOpen: false,
      history: [...s.history, rec],
      headlines: [res.headline, ...s.headlines].slice(0, 20),
      outcome: {
        missionId,
        optionTitle,
        headline: res.headline,
        messages: res.messages,
        before,
        after: { ...e.ind },
        phase: 'now',
        months,
        laterMessages: [],
        joke,
      },
    });
    sfx(joke ? 'joke' : 'stamp');
  }
});
