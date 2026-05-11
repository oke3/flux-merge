/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { Node } from '../core/Node';
import { GAME_CONFIG } from '../assets/constants';

export class Physics {
  /**
   * Calculates and applies a magnetic pull between two nodes of the same level.
   */
  public static applyMagneticPull(nodeA: Node, nodeB: Node, strengthMultiplier: number = 1) {
    if (nodeA.level !== nodeB.level) return;
    if (nodeA.isDragging || nodeB.isDragging) return;

    const dx = nodeB.x - nodeA.x;
    const dy = nodeB.y - nodeA.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Only apply pull if nodes are relatively close (e.g., within 3 grid cells)
    const maxPullDistance = (600 / GAME_CONFIG.GRID_SIZE) * 3;

    if (distance > 0 && distance < maxPullDistance) {
      const force = GAME_CONFIG.MAGNETIC_PULL_STRENGTH * (1 - distance / maxPullDistance) * strengthMultiplier;
      
      // Move nodes slightly towards each other
      nodeA.targetX += (dx / distance) * force * 10;
      nodeA.targetY += (dy / distance) * force * 10;
      
      nodeB.targetX -= (dx / distance) * force * 10;
      nodeB.targetY -= (dy / distance) * force * 10;
    }
  }

  /**
   * Snaps a node to the nearest grid center.
   */
  public static snapToGrid(node: Node) {
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
}
