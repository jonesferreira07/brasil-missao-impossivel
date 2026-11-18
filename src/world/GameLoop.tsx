import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { releasePointer } from '../game/input';
import { runtime } from '../game/runtime';
import { sfx } from '../game/sfx';
import { useGame } from '../game/store';
import { citizenLine } from '../missions/citizens';
import { MISSIONS } from '../missions/data';
import type { Step } from '../missions/types';
import { resolveCircle } from './layout';
import { isBlocked } from './Player';

export const MONTH_SECONDS = 80;

let ladyIdx = 0;
const FIRST_LADY = [
  ['Querido, vai procurar a picanha? Aproveita e vê se o supermercado aceita cartão internacional.'],
  ['Comprei só o essencial: catorze sacolas. Uma delas é de economia — um livro sobre austeridade, edição de luxo.'],
  ['Na Europa todo mundo perguntou do Brasil. Eu disse que estava ótimo. Mentir em francês nem parece mentira.'],
  ['Me avisa quando a inflação baixar. Aí eu volto a fazer compras aqui também.'],
];

function doStep(st: Step) {
  const s = useGame.getState();
  if (st.type === 'talk') {
    const lines = typeof st.lines === 'function' ? st.lines(s.econ) : st.lines ?? [];
    s.openDialogue(st.speaker ?? '', lines, () => useGame.getState().advanceStep());
  } else if (st.type === 'decide') {
    releasePointer();
    s.set({ decisionOpen: true });
    sfx('click');
  } else if (st.type === 'negotiate') {
    releasePointer();
    s.set({ negotiationOpen: true });
    sfx('click');
  } else if (st.type === 'election') {
    releasePointer();
    s.openElection();
  } else if (st.type === 'finale') {
    releasePointer();
    s.finale();
  }
}

/** Lógica por quadro: tempo econômico, interações, entrar/sair de veículos, rádio. */
export function GameLoop() {
  const monthAcc = useRef(0);
  const pedSeed = useRef(0);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05);
    const s = useGame.getState();
    if (s.screen !== 'playing') {
      runtime.ePressed = runtime.fPressed = runtime.qPressed = false;
      return;
    }
    const blocked = isBlocked();
    if (!blocked) {
      monthAcc.current += dt;
      if (monthAcc.current > MONTH_SECONDS) {
        monthAcc.current = 0;
        s.tickMonth();
      }
    }

    // Diálogo aberto: E avança
    if (s.dialogue) {
      if (runtime.ePressed) s.advanceDialogue();
      runtime.ePressed = runtime.fPressed = runtime.qPressed = false;
      return;
    }
    if (blocked) {
      if (s.prompt) s.set({ prompt: null });
      runtime.ePressed = runtime.fPressed = runtime.qPressed = false;
      return;
    }

    const v = runtime.vehicle ? runtime.vehicles.find((c) => c.id === runtime.vehicle)! : null;
    const px = v ? v.x : runtime.player.x;
    const pz = v ? v.z : runtime.player.z;
    let prompt: string | null = null;
    let action: (() => void) | null = null;

    const m = MISSIONS[s.missionIndex];
    const st = m?.steps[s.stepIndex];
    if (st) {
      const d = Math.hypot(px - st.target[0], pz - st.target[1]);
      if (st.type === 'reach') {
        if (d < (st.radius ?? 6)) s.advanceStep();
      } else if (!v && d < (st.radius ?? 3)) {
        prompt = `[E] ${st.label ?? 'Interagir'}`;
        action = () => doStep(st);
      }
    }

    let nearCar: typeof v = null;
    if (!v) {
      let best = 4;
      for (const c of runtime.vehicles) {
        const d = Math.hypot(px - c.x, pz - c.z);
        if (d < best) {
          best = d;
          nearCar = c;
        }
      }
      if (nearCar && !prompt) prompt = `[F] Dirigir: ${nearCar.name}`;
      if (!prompt && Math.hypot(px - 139, pz + 164.2) < 2.6) {
        prompt = '[E] Falar com a Primeira-Dama';
        action = () => s.openDialogue('Primeira-Dama (fictícia)', FIRST_LADY[(ladyIdx++) % FIRST_LADY.length]);
      }
      if (!prompt) {
        let bestP = 2.8;
        let ped: { x: number; z: number; id: number } | null = null;
        for (const p of runtime.peds) {
          const d = Math.hypot(px - p.x, pz - p.z);
          if (d < bestP) {
            bestP = d;
            ped = p;
          }
        }
        if (ped) {
          const id = ped.id;
          prompt = '[E] Conversar com cidadão';
          action = () => {
            const c = citizenLine(s.econ, id * 7 + pedSeed.current++);
            s.openDialogue(c.speaker, c.lines);
          };
        }
      }
    } else {
      prompt = `[F] Sair do veículo · [Q] Trocar rádio · ${Math.round(Math.abs(v.speed) * 3.6)} km/h`;
    }

    if (prompt !== s.prompt) s.set({ prompt });

    if (runtime.ePressed && action) action();
    if (runtime.fPressed) {
      if (v) {
        if (Math.abs(v.speed) < 6) {
          runtime.vehicle = null;
          v.speed = 0;
          runtime.player.x = v.x + Math.cos(v.yaw) * 2.3;
          runtime.player.z = v.z - Math.sin(v.yaw) * 2.3;
          resolveCircle(runtime.player, 0.5);
          s.set({ inVehicle: null });
        } else s.notify('Reduza a velocidade antes de sair do carro, presidente.', 'info');
      } else if (nearCar) {
        runtime.vehicle = nearCar.id;
        s.set({ inVehicle: nearCar.id });
        sfx('radio');
      }
    }
    if (runtime.qPressed && v) {
      s.set({ radioStation: (s.radioStation + 1) % 4 });
      sfx('radio');
    }
    runtime.ePressed = runtime.fPressed = runtime.qPressed = false;
  });
  return null;
}
