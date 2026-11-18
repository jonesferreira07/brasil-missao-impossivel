import type { Campaign } from '../economy/election';
import type { Delayed, Delta, Econ } from '../economy/model';

export type StepType = 'reach' | 'talk' | 'decide' | 'negotiate' | 'finale' | 'election';

export interface Step {
  type: StepType;
  text: string; // objetivo exibido no HUD
  target: [number, number];
  radius?: number;
  npc?: string; // id do NPC de missão (para destacar)
  speaker?: string;
  lines?: string[] | ((e: Econ) => string[]);
  label?: string; // texto do prompt de interação
}

export interface Outcome {
  delta: Delta;
  delayed?: Delayed[];
  messages: string[];
  headline: string;
  campaign?: Campaign;
}

export interface Option {
  id: string;
  title: string;
  desc: string;
  hint: string; // efeitos prováveis (transparência)
  joke?: boolean;
  resolve: (e: Econ) => Outcome;
}

export interface Mission {
  id: string;
  num: number;
  title: string;
  tagline: string;
  briefing: string[];
  locationName: string;
  steps: Step[];
  question?: string;
  options?: Option[];
  monthsAfter: number;
  onStart?: Delta;
  onStartMessage?: string;
}

export const later = (inMonths: number, label: string, delta: Delta, message?: string): Delayed => ({
  inMonths,
  label,
  delta,
  message,
});
