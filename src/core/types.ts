/**
 * Core interfaces for visual entities.
 * These are used to ensure type safety between the core engine and rendering layers.
 */

export interface IRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  color: string;
  isDead: boolean;
}

export interface IParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  isDead: boolean;
}

export interface GameResults {
  score: number;
  maxLevel: number;
  duration: number;
  xpEarned: number;
}

export interface UpgradeData {
  id: string;
  name: string;
  description: string;
  cost: number;
  level: number;
  maxLevel: number;
}
