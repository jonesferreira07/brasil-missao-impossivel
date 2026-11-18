import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { IS_MOBILE, IS_TOUCH } from './game/device';
import { installInput } from './game/input';
import { TouchControls } from './ui/TouchControls';
import { useGame } from './game/store';
import { ElectionModal, FinalScreen, IntroOverlay } from './ui/Election';
import { HUD } from './ui/HUD';
import { EndingScreen, History, HowToPlay, MainMenu, PauseMenu } from './ui/Menus';
import { DecisionModal, MissionIntro, NegotiationModal, OutcomeModal } from './ui/Modals';
import { Scene } from './world/Scene';

export default function App() {
  const screen = useGame((s) => s.screen);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (wrap.current) installInput(wrap.current);
  }, []);
  // autosave a cada 60 s durante o jogo
  useEffect(() => {
    const t = setInterval(() => {
      const s = useGame.getState();
      if (s.screen === 'playing' && !s.outcome) s.save(true);
    }, 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="app">
      <div className="canvas-wrap" ref={wrap}>
        <Canvas shadows={!IS_MOBILE} dpr={IS_MOBILE ? [1, 1.25] : [1, 1.5]} camera={{ fov: 60, near: 0.3, far: 1200, position: [120, 60, 60] }} gl={{ antialias: !IS_MOBILE, powerPreference: 'high-performance' }}>
          <Scene />
        </Canvas>
      </div>
      <div className="ui">
        {screen === 'menu' && <MainMenu />}
        {screen === 'playing' && <HUD />}
        <TouchControls />
        {IS_TOUCH && <div className="rotate-hint">Dica: deite o celular para jogar melhor ↻</div>}
        <IntroOverlay />
        <MissionIntro />
        <DecisionModal />
        <NegotiationModal />
        <OutcomeModal />
        <PauseMenu />
        <History />
        <HowToPlay />
        <EndingScreen />
        <ElectionModal />
        <FinalScreen />
      </div>
    </div>
  );
}
