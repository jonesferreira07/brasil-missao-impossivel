// Obstáculos circulares (pessoas, carros, postes, árvores) — complementam as caixas de layout.ts.
export type ObstacleKind = 'ped' | 'car' | 'static' | 'npc';
export interface Obstacle {
  x: number;
  z: number;
  r: number;
  kind: ObstacleKind;
}

export const obstacles = new Set<Obstacle>();

export function addObstacle(x: number, z: number, r: number, kind: ObstacleKind = 'static'): Obstacle {
  const o = { x, z, r, kind };
  obstacles.add(o);
  return o;
}
export function removeObstacle(o: Obstacle) {
  obstacles.delete(o);
}

/** Empurra o círculo p para fora dos obstáculos. Retorna o obstáculo mais "importante" atingido. */
export function resolveObstacles(p: { x: number; z: number }, r: number, skip?: Set<Obstacle>): Obstacle | null {
  let hit: Obstacle | null = null;
  for (const o of obstacles) {
    if (skip && skip.has(o)) continue;
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    const min = r + o.r;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2);
      if (d < 1e-4) {
        p.x += min; // sobreposição exata: sai pela lateral
      } else {
        const push = min - d;
        p.x += (dx / d) * push;
        p.z += (dz / d) * push;
      }
      if (!hit || o.kind === 'ped' || o.kind === 'npc') hit = o;
    }
  }
  return hit;
}

/** Dois círculos ao longo do comprimento de um carro. */
export function carCircles(list: Obstacle[], x: number, z: number, yaw: number, len = 4.2, r = 1.05) {
  const off = len / 2 - r * 0.8;
  const fx = Math.sin(yaw);
  const fz = Math.cos(yaw);
  list[0].x = x + fx * off;
  list[0].z = z + fz * off;
  list[1].x = x - fx * off;
  list[1].z = z - fz * off;
}
