import { useEffect } from 'react';
// Evita o "clique fantasma" no celular: o toque que abre um modal não pode escolher uma opção dentro dele.
let openedAt = 0;
export function useOpenGuard(open: boolean) {
  useEffect(() => {
    if (open) openedAt = performance.now();
  }, [open]);
}
export const guard =
  <A extends unknown[]>(fn: (...a: A) => void) =>
  (...a: A) => {
    if (performance.now() - openedAt < 500) return;
    fn(...a);
  };
