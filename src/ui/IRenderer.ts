/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { Node } from '../core/Node';

export interface IRenderer {
  clear(): void;
  drawBackground(offset: number): void;
  drawGrid(): void;
  drawNode(node: Node): void;
  drawRipple(ripple: any): void;
  drawParticles(particles: any[]): void;
  applyShake(intensity: number): void;
  resetShake(): void;
  removeNodeMesh?(node: Node): void;
}
