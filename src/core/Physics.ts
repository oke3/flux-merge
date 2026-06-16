// SPDX-License-Identifier: Proprietary
import { GameNode } from '../core/GameNode';
import { GAME_CONFIG } from '../assets/constants';
import { ProfileManager } from './ProfileManager';
import type { UserProfile } from './ProfileManager';

export class Physics {
  /**
   * Calculates the squared distance between two points.
   * Used for performance optimization to avoid Math.sqrt().
   */
  public static getDistanceSq(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return dx * dx + dy * dy;
  }

  /**
   * Calculates and applies a magnetic pull between a node and a list of potential targets.
   * 
   * @param nodeA The node being pulled.
   * @param targets A list of nearby nodes.
   * @param strengthMultiplier A multiplier for the strength of the pull.
   * @param profile The user profile, used to get the base magnetic pull strength.
   */
  public static applyMagneticPull(nodeA: GameNode, targets: GameNode[], strengthMultiplier: number = 1, profile?: UserProfile) {
    if (nodeA.pendingRemoval) return;
    let baseStrength = GAME_CONFIG.MAGNETIC_PULL_STRENGTH;
    if (profile) {
      baseStrength = ProfileManager.getAbilityValue('magneticPull', profile);
    }

    for (const nodeB of targets) {
      if (nodeA === nodeB || nodeB.pendingRemoval) continue;
      if (nodeA.level !== nodeB.level) continue;
      if (nodeA.isDragging || nodeB.isDragging) continue;

      const dx = nodeB.x - nodeA.x;
      const dy = nodeB.y - nodeA.y;
      const distanceSq = dx * dx + dy * dy;

        // Use distance squared for faster comparison
        const maxPullDistance = (GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE) * GAME_CONFIG.PHYSICS_MAGNETIC_DISTANCE_MULT;
        const maxPullDistanceSq = maxPullDistance * maxPullDistance;

        if (distanceSq > 0 && distanceSq < maxPullDistanceSq) {
          const distance = Math.sqrt(distanceSq);
          const force = baseStrength * (1 - distance / maxPullDistance) * strengthMultiplier;

          const nextX = nodeA.targetX + (dx / distance) * force * GAME_CONFIG.PHYSICS_MAGNETIC_FORCE_MULT;
          const nextY = nodeA.targetY + (dy / distance) * force * GAME_CONFIG.PHYSICS_MAGNETIC_FORCE_MULT;

          if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
            nodeA.targetX = nextX;
            nodeA.targetY = nextY;
          }
        }

    }
  }

  public static applyMagneticPullToAll(nodes: GameNode[], gridMap: Record<string, GameNode[]>, multiplier: number, profile?: UserProfile) {
    for (const node of nodes) {
      const nearbyGameNodes: GameNode[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cellNodes = gridMap[`${node.gridX + dx},${node.gridY + dy}`];
          if (cellNodes) {
            nearbyGameNodes.push(...cellNodes);
          }
        }
      }
      this.applyMagneticPull(node, nearbyGameNodes, multiplier, profile);
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

    if (distance > 0 && distance < GAME_CONFIG.PHYSICS_REPULSION_DISTANCE) {
      const force = strength * (1 - distance / GAME_CONFIG.PHYSICS_REPULSION_DISTANCE);
      node.targetX += (dx / distance) * force * GAME_CONFIG.PHYSICS_REPULSION_FORCE_MULT;
      node.targetY += (dy / distance) * force * GAME_CONFIG.PHYSICS_REPULSION_FORCE_MULT;
    }
  }

  /**
   * Returns all nodes within a given radius of (cx, cy) using gridMap spatial lookup.
   * O(G) where G = grid cells in the radius area, instead of O(N) full array scan.
   */
  public static getNodesInRadius(
    cx: number, cy: number,
    radius: number,
    gridMap: Record<string, GameNode[]>
  ): GameNode[] {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gridRange = Math.ceil(radius / cellSize);
    const centerGX = Math.floor(cx / cellSize);
    const centerGY = Math.floor(cy / cellSize);
    const radiusSq = radius * radius;
    const result: GameNode[] = [];

    for (let dx = -gridRange; dx <= gridRange; dx++) {
      for (let dy = -gridRange; dy <= gridRange; dy++) {
        const cellKey = `${centerGX + dx},${centerGY + dy}`;
        const cellNodes = gridMap[cellKey];
        if (!cellNodes) continue;
        for (const node of cellNodes) {
          const distSq = (node.x - cx) ** 2 + (node.y - cy) ** 2;
          if (distSq <= radiusSq) {
            result.push(node);
          }
        }
      }
    }
    return result;
  }
}
