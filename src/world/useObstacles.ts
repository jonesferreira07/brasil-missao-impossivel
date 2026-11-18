import { useEffect } from 'react';
import { addObstacle, removeObstacle, type ObstacleKind } from '../game/obstacles';

/** Registra obstáculos circulares fixos enquanto o componente estiver montado. */
export function useStaticObstacles(list: [number, number, number][], kind: ObstacleKind = 'static', deps: unknown[] = []) {
  useEffect(() => {
    const os = list.map(([x, z, r]) => addObstacle(x, z, r, kind));
    return () => os.forEach(removeObstacle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Obstáculos de um carro parado (posição, rumo e comprimento). */
export function carStatic(x: number, z: number, yaw: number, len = 4.2, r = 1.05): [number, number, number][] {
  const off = len / 2 - r * 0.8;
  return [
    [x + Math.sin(yaw) * off, z + Math.cos(yaw) * off, r],
    [x - Math.sin(yaw) * off, z - Math.cos(yaw) * off, r],
  ];
}
