import { IS_TOUCH } from './device';
import { runtime } from './runtime';
import { useGame } from './store';

let installed = false;

function uiBlocking() {
  const s = useGame.getState();
  return s.screen !== 'playing' || s.paused || s.decisionOpen || s.negotiationOpen || !!s.outcome || s.showHowTo || s.showHistory || s.electionOpen;
}

export function installInput(canvasParent: HTMLElement) {
  if (installed) return;
  installed = true;

  window.addEventListener('keydown', (e) => {
    const s = useGame.getState();
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    runtime.keys.add(e.code);
    if (e.code === 'KeyE' || e.code === 'Enter') runtime.ePressed = true;
    if (e.code === 'KeyF') runtime.fPressed = true;
    if (e.code === 'KeyQ') runtime.qPressed = true;
    if (s.screen === 'intro' && ['Escape', 'Space', 'Enter'].includes(e.code)) s.finishIntro();
    if (s.screen === 'playing') {
      if (e.code === 'Tab') s.togglePanel();
      if (e.code === 'KeyH') s.set({ showHistory: !s.showHistory });
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (s.showHowTo || s.showHistory) s.set({ showHowTo: false, showHistory: false });
        else if (!s.decisionOpen && !s.negotiationOpen && !s.outcome) s.set({ paused: !s.paused });
      }
    }
  });
  window.addEventListener('keyup', (e) => runtime.keys.delete(e.code));
  window.addEventListener('blur', () => runtime.keys.clear());

  canvasParent.addEventListener('mousedown', (e) => {
    if (uiBlocking() || IS_TOUCH) return;
    runtime.dragging = true;
    if (e.button === 0) {
      try {
        const r = (canvasParent.querySelector('canvas') as HTMLCanvasElement | null)?.requestPointerLock?.() as unknown;
        if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => {});
      } catch {
        /* sem pointer lock: usa arrastar */
      }
    }
  });
  window.addEventListener('mouseup', () => (runtime.dragging = false));
  // Toque: arrastar na tela gira a câmera
  let camTouch: number | null = null;
  let lx = 0,
    ly = 0;
  canvasParent.addEventListener(
    'touchstart',
    (e) => {
      if (uiBlocking()) return;
      const t = e.changedTouches[0];
      if (camTouch === null) {
        camTouch = t.identifier;
        lx = t.clientX;
        ly = t.clientY;
      }
      e.preventDefault();
    },
    { passive: false },
  );
  canvasParent.addEventListener(
    'touchmove',
    (e) => {
      for (const t of Array.from(e.changedTouches)) {
        if (t.identifier !== camTouch) continue;
        runtime.cam.yaw -= (t.clientX - lx) * 0.006;
        runtime.cam.pitch = Math.max(0.05, Math.min(1.25, runtime.cam.pitch + (t.clientY - ly) * 0.004));
        runtime.cam.lastMouse = performance.now();
        lx = t.clientX;
        ly = t.clientY;
      }
      e.preventDefault();
    },
    { passive: false },
  );
  const endTouch = (e: TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) if (t.identifier === camTouch) camTouch = null;
  };
  canvasParent.addEventListener('touchend', endTouch);
  canvasParent.addEventListener('touchcancel', endTouch);
  document.addEventListener('pointerlockchange', () => {
    runtime.pointerLocked = !!document.pointerLockElement;
  });
  window.addEventListener('mousemove', (e) => {
    if (uiBlocking()) return;
    if (!runtime.pointerLocked && !runtime.dragging) return;
    runtime.cam.yaw -= e.movementX * 0.0032;
    runtime.cam.pitch = Math.max(0.05, Math.min(1.25, runtime.cam.pitch + e.movementY * 0.0026));
    runtime.cam.lastMouse = performance.now();
  });
  window.addEventListener(
    'wheel',
    (e) => {
      if (uiBlocking()) return;
      runtime.cam.dist = Math.max(4, Math.min(18, runtime.cam.dist + e.deltaY * 0.01));
    },
    { passive: true },
  );
}

export function releasePointer() {
  try {
    if (document.pointerLockElement) document.exitPointerLock();
  } catch {
    /* ignore */
  }
}
