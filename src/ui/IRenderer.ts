/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { GameNode } from '../core/GameNode';
import { Ripple } from '../core/Ripple';
import { Particle } from '../core/Particle';

export interface IRenderer {
  clear(): void;
  drawBackground(offset: number): void;
  drawGrid(): void;
  drawGameNode(node: GameNode): void;
  drawRipple(ripple: Ripple): void;
  drawRipples(ripples: Ripple[]): void;
  drawParticles(particles: Particle[]): void;
  applyShake(intensity: number): void;
  resetShake(): void;
  removeGameNodeMesh?(node: GameNode): void;
  setFever(active: boolean): void;
  updateGhostNode(x: number, y: number, level: number, type?: any, currentX?: number, currentY?: number): void;
  hideGhostNode(): void;
  setPowerSaver(enabled: boolean): void;
}

