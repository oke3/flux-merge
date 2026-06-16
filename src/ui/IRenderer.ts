// SPDX-License-Identifier: Proprietary
import { GameNode } from '../core/GameNode';
import { Ripple } from '../core/Ripple';
import { Particle } from '../core/Particle';
import { NodeType } from '../assets/constants';

export interface IRenderer {
  clear(): void;
  drawBackground(offset: number): void;
  drawGrid(): void;
  drawGameNode(node: GameNode, isHovered?: boolean): void;
  drawRipple(ripple: Ripple): void;
  drawRipples(ripples: Ripple[]): void;
  drawParticles(particles: Particle[]): void;
  applyShake(intensity: number): void;
  resetShake(): void;
  removeGameNodeMesh?(node: GameNode): void;
  setFever(active: boolean): void;
  updateGhostNode(x: number, y: number, level: number, type?: NodeType, currentX?: number, currentY?: number): void;
  hideGhostNode(): void;
  setPowerSaver(enabled: boolean): void;
  setTheme(themeId: string): void;
  invalidateGridCache(): void;
  drawDebugPointer(x: number, y: number): void;
  drawDebugHitboxes(nodes: GameNode[]): void;
}

