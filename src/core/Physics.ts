/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from '../core/GameNode';
import { GAME_CONFIG } from '../assets/constants';

export class Physics {
  /**
   * Calculates and applies a magnetic pull between a node and a list of potential targets.
   */
  public static applyMagneticPull(nodeA: GameNode, targets: GameNode[], strengthMultiplier: number = 1) {
    for (const nodeB of targets) {
      if (nodeA === nodeB) continue;
      if (nodeA.level !== nodeB.level) continue;
      if (nodeA.isDragging || nodeB.isDragging) continue;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distanceSq = dx * dx + dy * dy;

      // Use distance squared for faster comparison
      const maxPullDistance = (600 / GAME_CONFIG.GRID_SIZE) * 3;
      const maxPullDistanceSq = maxPullDistance * maxPullDistance;

      if (distanceSq > 0 && distanceSq < maxPullDistanceSq) {
        const distance = Math.sqrt(distanceSq);
        const force = GAME_CONFIG.MAGNETIC_PULL_STRENGTH * (1 - distance / maxPullDistance) * strengthMultiplier;

        // Move nodes slightly towards each other
        nodeA.targetX += (dx / distance) * force * 10;
        nodeA.targetY += (dy / distance) * force * 10;

        nodeB.targetX -= (dx / distance) * force * 10;
        nodeB.targetY -= (dy / distance) * force * 10;
      }
    }
  }

  /**
   * Snaps a node to the nearest grid center.
   */
  public static snapToGrid(node: GameNode) {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gridX = Math.floor(node.x / cellSize);
    const gridY = Math.floor(node.y / cellSize);

    // Clamp to grid boundaries
    const clampedX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, gridX));
    const clampedY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, gridY));

    node.gridX = clampedX;
    node.gridY = clampedY;
    node.targetX = clampedX * cellSize + cellSize / 2;
    node.targetY = clampedY * cellSize + cellSize / 2;
  }

  /**
   * Pushes a node away from a source point.
   */
  public static applyRepulsion(node: GameNode, sourceX: number, sourceY: number, strength: number) {
    const dx = node.x - sourceX;
    const dy = node.y - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0 && distance < 300) {
      const force = strength * (1 - distance / 300);
      node.targetX += (dx / distance) * force * 20;
      node.targetY += (dy / distance) * force * 20;
    }
  }
}
