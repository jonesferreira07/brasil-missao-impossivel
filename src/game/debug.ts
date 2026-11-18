import { runtime } from './runtime';
import { useGame } from './store';
// Gancho de depuração: abra o jogo com ?debug para acessar window.__BRASIL__
export function installDebug() {
  try {
    if (new URLSearchParams(location.search).has('debug')) (window as unknown as Record<string, unknown>).__BRASIL__ = { runtime, useGame };
  } catch {
    /* ignore */
  }
}
