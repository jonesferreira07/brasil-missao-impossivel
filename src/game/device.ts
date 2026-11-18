// Detecção simples de celular/tablet (toque) para adaptar controles, interface e gráficos.
const coarse = typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const touch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);
const forced = typeof location !== 'undefined' && new URLSearchParams(location.search).has('mobile');
export const IS_TOUCH = forced || (coarse && touch);
export const IS_MOBILE = IS_TOUCH && Math.min(window.innerWidth, window.innerHeight) < 900;
if (IS_TOUCH && typeof document !== 'undefined') document.documentElement.classList.add('touch');
