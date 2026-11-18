// Estado mutável de alta frequência (fora do React para desempenho).
export interface VehicleState {
  id: string;
  name: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  color: string;
  kind: 'sedan' | 'popular';
}

export const runtime = {
  player: { x: 70, z: -128, yaw: Math.PI, moving: false, running: false },
  cam: { yaw: 0, pitch: 0.32, dist: 8.5, lastMouse: 0 },
  keys: new Set<string>(),
  ePressed: false,
  fPressed: false,
  qPressed: false,
  dragging: false,
  pointerLocked: false,
  vehicle: null as string | null,
  vehicles: [
    { id: 'oficial', name: 'Carro Oficial', x: 150, z: -160, yaw: 0, speed: 0, color: '#15181d', kind: 'sedan' },
    { id: 'popular', name: 'Popular 1.0', x: -100, z: 112, yaw: 0, speed: 0, color: '#e0b43a', kind: 'popular' },
  ] as VehicleState[],
  peds: [] as { x: number; z: number; id: number }[],
  insideSuper: false,
  introT: 0,
  joy: { x: 0, y: 0 },
};

export function resetRuntime(px: number, pz: number) {
  runtime.player.x = px;
  runtime.player.z = pz;
  runtime.vehicle = null;
  runtime.cam.yaw = 0;
  runtime.vehicles[0].x = 150;
  runtime.vehicles[0].z = -160;
  runtime.vehicles[0].yaw = 0;
  runtime.vehicles[0].speed = 0;
  runtime.vehicles[1].x = -100;
  runtime.vehicles[1].z = 112;
  runtime.vehicles[1].yaw = 0;
  runtime.vehicles[1].speed = 0;
}
