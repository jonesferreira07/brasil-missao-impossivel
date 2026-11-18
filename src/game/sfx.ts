// Efeitos sonoros sintetizados (WebAudio) — sem arquivos externos.
let ctx: AudioContext | null = null;
let muted = false;
export const setMuted = (m: boolean) => (muted = m);
export const isMuted = () => muted;

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, delay = 0, slide = 0) {
  const c = ac();
  if (!c || muted) return;
  const t = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfx(kind: 'ping' | 'good' | 'bad' | 'stamp' | 'joke' | 'click' | 'radio') {
  switch (kind) {
    case 'ping':
      tone(880, 0.12, 'sine', 0.05);
      break;
    case 'click':
      tone(600, 0.05, 'square', 0.03);
      break;
    case 'good':
      tone(523, 0.15, 'triangle', 0.07);
      tone(659, 0.15, 'triangle', 0.07, 0.12);
      tone(784, 0.25, 'triangle', 0.07, 0.24);
      break;
    case 'bad':
      tone(300, 0.25, 'sawtooth', 0.04, 0, -120);
      break;
    case 'stamp':
      tone(120, 0.18, 'square', 0.08);
      tone(80, 0.25, 'sine', 0.1, 0.02);
      break;
    case 'joke':
      tone(400, 0.12, 'square', 0.05, 0, 200);
      tone(300, 0.12, 'square', 0.05, 0.14, -150);
      tone(500, 0.2, 'square', 0.05, 0.28, 300);
      break;
    case 'radio':
      tone(1200, 0.06, 'square', 0.02);
      tone(700, 0.08, 'square', 0.02, 0.07);
      break;
  }
}

// Motor do carro: um oscilador contínuo modulado pela velocidade
let engine: { o: OscillatorNode; g: GainNode } | null = null;
export function engineUpdate(active: boolean, speed: number) {
  const c = ac();
  if (!c) return;
  if (active && !muted) {
    if (!engine) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sawtooth';
      g.gain.value = 0;
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 400;
      o.connect(f).connect(g).connect(c.destination);
      o.start();
      engine = { o, g };
    }
    engine.o.frequency.setTargetAtTime(45 + Math.abs(speed) * 4, c.currentTime, 0.1);
    engine.g.gain.setTargetAtTime(0.025, c.currentTime, 0.2);
  } else if (engine) {
    engine.g.gain.setTargetAtTime(0, c.currentTime, 0.1);
  }
}
