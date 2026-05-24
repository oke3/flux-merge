export const NodeType = {
  STANDARD: 'STANDARD',
  VOID: 'VOID',
  STAR: 'STAR',
  SUPERNOVA: 'SUPERNOVA',
  PULSAR: 'PULSAR',
  PRISM: 'PRISM',
  BLACK_HOLE: 'BLACK_HOLE',
  NEBULA: 'NEBULA',
  LUMINOUS_NOVA: 'LUMINOUS_NOVA',
  JUNK: 'JUNK',
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];

export const GameState = {
  MENU: 'MENU',
  SETTINGS: 'SETTINGS',
  UPGRADES: 'UPGRADES',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN',
} as const;

export type GameState = typeof GameState[keyof typeof GameState];

export interface Ability {
  id: string;
  name: string;
  description: string;
  baseValue: number;
  maxLevel: number;
  costPerLevel: (level: number) => number;
}

export interface UserProfile {
  xp: number;
  level: number;
  galaxy: number;
  upgrades: Record<string, number>;
  unlockedThemes: string[];
  achievements: string[];
  settings: {
    volume: number;
    theme: string;
    muteSfx: boolean;
    disableVibration: boolean;
    powerSaver: boolean;
  };
}

export const ABILITIES: Record<string, Ability> = {
  magneticPull: {
    id: 'magneticPull',
    name: 'Magnetic Attunement',
    description: 'Increases the strength of the magnetic pull between nodes.',
    baseValue: 0.05,
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(100 + 50 * lvl * 1.2),
  },
  frenzyDuration: {
    id: 'frenzyDuration',
    name: 'Temporal Expansion',
    description: 'Extends the duration of the Frenzy mode.',
    baseValue: 5000,
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(150 + 75 * lvl * 1.2),
  },
  specialChance: {
    id: 'specialChance',
    name: 'Cosmic Luck',
    description: 'Increases the probability of special nodes spawning.',
    baseValue: 0.1,
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(200 + 100 * lvl * 1.2),
  },
  pulsarRadius: {
    id: 'pulsarRadius',
    name: 'Pulsar Resonance',
    description: 'Increases the repulsion radius of Pulsar nodes.',
    baseValue: 150,
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(150 + 50 * lvl * 1.2),
  },
  supernovaRadius: {
    id: 'supernovaRadius',
    name: 'Stellar Expansion',
    description: 'Increases the blast radius of Supernova events.',
    baseValue: 1,
    maxLevel: 10,
    costPerLevel: (lvl) => Math.floor(200 + 80 * lvl * 1.2),
  },
};

export const GAME_CONFIG = {
  CANVAS_SIZE: 600,
  GRID_SIZE: 6,
  NODE_RADIUS: 30,
  MAGNETIC_PULL_STRENGTH: 0.05,
  PULSE_RADIUS: 150,
  TICK_RATE: 60,
  VOID_CONSUMPTION_RADIUS: 80,
  SPECIAL_NODE_CHANCE: 0.1, // 10% chance to spawn a special node
  BASE_SPAWN_INTERVAL: 1200,
  MIN_SPAWN_INTERVAL: 300,
  MAX_DIFFICULTY_SCORE: 1000,
  GRAVITY_FLUX_INTERVAL: 60000,
  // Audit Additions
  SLOW_MOTION_FACTOR: 0.2,
  FRENZY_AUDIO_CHANCE: 0.02,
  FLUX_SHAKE_INTENSITY: 10,
  FLUX_SHAKE_DURATION: 500,
  SPAWN_VARIANCE_MULTIPLIER: 0.3,
  FRENZY_MAGNETIC_MULTIPLIER: 2.5,
  DEFAULT_DELTA_TIME: 16.67,
  PHYSICS_MAGNETIC_FORCE_MULT: 10,
  PHYSICS_MAGNETIC_DISTANCE_MULT: 3,
  PHYSICS_REPULSION_DISTANCE: 300,
  PHYSICS_REPULSION_FORCE_MULT: 20,
  MAX_UPDATES_PER_FRAME: 5,
  NOVA_CONFIG: {
    PULSE_INTERVAL: 4000, // Pulse every 4 seconds
    REPULSION_RADIUS: 250,
    REPULSION_FORCE: 15,
    SWELL_DURATION: 1500, // 1.5s build up
    SNAP_DURATION: 200,   // 0.2s snap
    REFRACTION_CHANCE: 1.0, // Always counter if in radius
    SHATTER_COUNT: 3,      // Split into 3 shards
  },
};

export interface NodeLevelInfo {
  color: string;
  name: string;
  score: number;
  symbol: string;
}

export interface Theme {
  name: string;
  background: string;
  glassBg: string;
  glassBorder: string;
  levels: Record<number, string>;
  requiredLevel?: number;
}

export const THEMES: Record<string, Theme> = {
  deepSpace: {
    name: 'Deep Space',
    background: 'radial-gradient(circle, #1a1a3e 0%, #0f0f1a 100%)',
    glassBg: 'rgba(255, 255, 255, 0.1)',
    glassBorder: 'rgba(255, 255, 255, 0.2)',
    levels: {
      1: '#00FFFF',
      2: '#0000FF',
      3: '#8A2BE2',
      4: '#FF00FF',
      5: '#FFFFFF',
    },
    requiredLevel: 1,
  },
  neonNight: {
    name: 'Neon Night',
    background: 'radial-gradient(circle, #2b0032 0%, #000000 100%)',
    glassBg: 'rgba(255, 0, 255, 0.05)',
    glassBorder: 'rgba(255, 0, 255, 0.3)',
    levels: {
      1: '#39FF14',
      2: '#FFFF00',
      3: '#FF00FF',
      4: '#00FFFF',
      5: '#FFFFFF',
    },
    requiredLevel: 5,
  },
  solarFlare: {
    name: 'Solar Flare',
    background: 'radial-gradient(circle, #4a1a00 0%, #1a0a00 100%)',
    glassBg: 'rgba(255, 165, 0, 0.05)',
    glassBorder: 'rgba(255, 165, 0, 0.3)',
    levels: {
      1: '#FFD700',
      2: '#FF8C00',
      3: '#FF4500',
      4: '#B22222',
      5: '#FFFFFF',
    },
    requiredLevel: 10,
  },
};

export const NODE_LEVELS: Record<number, NodeLevelInfo> = {
  1: { color: THEMES.deepSpace.levels[1], name: 'Soft Cyan', score: 10, symbol: '○' },
  2: { color: THEMES.deepSpace.levels[2], name: 'Electric Blue', score: 20, symbol: '△' },
  3: { color: THEMES.deepSpace.levels[3], name: 'Vivid Purple', score: 40, symbol: '□' },
  4: { color: THEMES.deepSpace.levels[4], name: 'Deep Magenta', score: 80, symbol: '◊' },
  5: { color: THEMES.deepSpace.levels[5], name: 'Singularity', score: 200, symbol: '★' },
};

export const SPECIAL_NODE_SYMBOLS: Record<string, string> = {
  [NodeType.VOID]: '◌',
  [NodeType.BLACK_HOLE]: '⦿',
  [NodeType.STAR]: '★',
  [NodeType.PULSAR]: '☼',
  [NodeType.PRISM]: '⬡',
  [NodeType.NEBULA]: '☁',
  [NodeType.LUMINOUS_NOVA]: '✺',
};

export const COLORS = {
  BACKGROUND_GRADIENT: THEMES.deepSpace.background,
  GLASS_BG: THEMES.deepSpace.glassBg,
  GLASS_BORDER: THEMES.deepSpace.glassBorder,
};
