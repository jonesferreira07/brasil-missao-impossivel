import { useEffect, useRef, useState } from 'react';
import { IS_TOUCH } from '../game/device';
import { runtime } from '../game/runtime';
import { useGame } from '../game/store';

/** Joystick virtual (esquerda) + botões de ação (direita) para celular. */
export function TouchControls() {
  const screen = useGame((s) => s.screen);
  const prompt = useGame((s) => s.prompt);
  const inV = useGame((s) => s.inVehicle);
  const dialogue = useGame((s) => s.dialogue);
  const set = useGame((s) => s.set);
  const toggle = useGame((s) => s.togglePanel);
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const tid = useRef<number | null>(null);

  useEffect(() => () => {
    runtime.joy.x = 0;
    runtime.joy.y = 0;
  }, []);

  if (!IS_TOUCH || screen !== 'playing') return null;

  const update = (cx: number, cy: number) => {
    const r = base.current!.getBoundingClientRect();
    const R = r.width / 2;
    let dx = (cx - (r.left + R)) / R;
    let dy = (cy - (r.top + R)) / R;
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    runtime.joy.x = dx;
    runtime.joy.y = dy;
    setKnob({ x: dx * R * 0.6, y: dy * R * 0.6 });
  };
  const end = () => {
    tid.current = null;
    runtime.joy.x = 0;
    runtime.joy.y = 0;
    setKnob({ x: 0, y: 0 });
  };
  const hold = (code: string) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      runtime.keys.add(code);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      runtime.keys.delete(code);
    },
  });
  const tap = (fn: () => void) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      fn();
    },
  });

  return (
    <div className="touch-ui">
      <div
        className="joy"
        ref={base}
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.changedTouches[0];
          tid.current = t.identifier;
          update(t.clientX, t.clientY);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          for (const t of Array.from(e.changedTouches)) if (t.identifier === tid.current) update(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          end();
        }}
        onTouchCancel={end}
      >
        <div className="knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
      </div>
      <div className="tbtns">
        <button className={`tb big ${prompt || dialogue ? 'hot' : ''}`} {...tap(() => (runtime.ePressed = true))}>
          {dialogue ? 'OK' : 'E'}
          <small>{dialogue ? 'continuar' : 'interagir'}</small>
        </button>
        <button className="tb" {...tap(() => (runtime.fPressed = true))}>
          {inV ? 'Sair' : 'Carro'}
        </button>
        {inV ? (
          <>
            <button className="tb" {...hold('Space')}>
              Freio
            </button>
            <button className="tb" {...tap(() => (runtime.qPressed = true))}>
              Rádio
            </button>
          </>
        ) : (
          <button className="tb" {...hold('ShiftLeft')}>
            Correr
          </button>
        )}
      </div>
      <div className="ttop">
        <button className="tb sm" {...tap(toggle)}>
          Economia
        </button>
        <button className="tb sm" {...tap(() => set({ paused: true }))}>
          ☰
        </button>
      </div>
    </div>
  );
}
