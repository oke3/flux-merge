export const GAME_CONFIG = {
  GRID_SIZE: 6,
  NODE_RADIUS: 30,
  MAGNETIC_PULL_STRENGTH: 0.05,
  PULSE_RADIUS: 150,
  TICK_RATE: 60,
};

export interface NodeLevelInfo {
  color: string;
  name: string;
  score: number;
}

export const NODE_LEVELS: Record<number, NodeLevelInfo> = {
  1: { color: '#00FFFF', name: 'Soft Cyan', score: 10 },
  2: { color: '#0000FF', name: 'Electric Blue', score: 20 },
  3: { color: '#8A2BE2', name: 'Vivid Purple', score: 40 },
  4: { color: '#FF00FF', name: 'Deep Magenta', score: 80 },
  5: { color: '#FFFFFF', name: 'Singularity', score: 200 },
};

export const COLORS = {
  BACKGROUND_GRADIENT: 'radial-gradient(circle, #1a1a2e 0%, #0f0f1a 100%)',
  GLASS_BG: 'rgba(255, 255, 255, 0.1)',
  GLASS_BORDER: 'rgba(255, 255, 255, 0.2)',
};
