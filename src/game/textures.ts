import * as THREE from 'three';

const cache = new Map<string, THREE.CanvasTexture>();

export interface TextOpts {
  w?: number;
  h?: number;
  bg?: string;
  fg?: string;
  font?: string;
  border?: string;
  weight?: string;
  align?: 'center' | 'left';
  pad?: number;
}

/** Gera (e guarda em cache) uma textura de texto em canvas — sem fontes externas. */
export function textTexture(key: string, lines: string[], o: TextOpts = {}): THREE.CanvasTexture {
  const ck = key + '|' + lines.join('/');
  const hit = cache.get(ck);
  if (hit) return hit;
  const w = o.w ?? 512;
  const h = o.h ?? 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  g.fillStyle = o.bg ?? '#ffffff';
  g.fillRect(0, 0, w, h);
  if (o.border) {
    g.strokeStyle = o.border;
    g.lineWidth = Math.max(4, h * 0.05);
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
  }
  const pad = o.pad ?? w * 0.05;
  const font = o.font ?? 'Arial Black, Arial, Helvetica, sans-serif';
  const weight = o.weight ?? '900';
  let size = (h - pad) / lines.length / 1.15;
  g.fillStyle = o.fg ?? '#111';
  g.textBaseline = 'middle';
  g.textAlign = o.align ?? 'center';
  // ajusta o tamanho para caber na largura
  for (const l of lines) {
    g.font = `${weight} ${size}px ${font}`;
    const m = g.measureText(l).width;
    if (m > w - pad * 2) size *= (w - pad * 2) / m;
  }
  g.font = `${weight} ${size}px ${font}`;
  const lh = size * 1.15;
  const y0 = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => g.fillText(l, o.align === 'left' ? pad : w / 2, y0 + i * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(ck, t);
  return t;
}

let winTex: THREE.CanvasTexture | null = null;
/** Textura procedural de janelas para prédios. */
export function windowTexture(): THREE.CanvasTexture {
  if (winTex) return winTex;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 4; y++)
    for (let x = 0; x < 4; x++) {
      const r = Math.random();
      g.fillStyle = r < 0.12 ? '#3a3a3a' : r < 0.3 ? '#9fb4c4' : '#6f8696';
      g.fillRect(x * 32 + 6, y * 32 + 8, 20, 18);
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  winTex = t;
  return t;
}
