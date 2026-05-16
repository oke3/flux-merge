/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { GAME_CONFIG, NodeType } from '../assets/constants';
import { Ripple } from './Ripple';

export interface CollisionHandler {
  addScore(points: number): void;
  incrementCombo(): void;
  triggerFrenzy(duration: number): void;
  playMergeSound(level: number): void;
  spawnBurst(x: number, y: number, color: string, count: number): void;
  addRipple(ripple: Ripple): void;
  triggerShake(intensity: number): void;
  spawnNode(): void;
  transitionToWin(): void;
  checkAchievements(): void;
  updateNodeColor(node: GameNode, theme: string): void;
  addNode(node: GameNode): void;
  getCurrentTheme(): string;
}

export class CollisionSystem {
  public checkAndResolveMerges(nodes: GameNode[], handler: CollisionHandler) {
    let cascadeCount = 0;
    const MAX_CASCADES = 5;

    while (cascadeCount < MAX_CASCADES) {
      let frameMerges = 0;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.pendingRemoval) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          if (b.pendingRemoval) continue;

          const canMerge = (a.level === b.level) || (a.type === NodeType.STAR) || (b.type === NodeType.STAR);
          if (canMerge && this.getDistance(a, b) < (a.radius * a.scale + b.radius * b.scale)) {
            if (a.type === NodeType.VOID || b.type === NodeType.VOID) continue;
            this.mergeGameNodes(nodes, i, j, handler);
            frameMerges++;
            break; 
          }
        }
      }
      
      if (frameMerges === 0) break;
      cascadeCount += frameMerges;
    }
  }

  private mergeGameNodes(nodes: GameNode[], indexA: number, indexB: number, handler: CollisionHandler) {
    const a = nodes[indexA];
    const b = nodes[indexB];
    
    if (a.type === NodeType.PRISM || b.type === NodeType.PRISM) {
      this.handlePrismSplit(nodes, a, b, handler);
      a.pendingRemoval = true;
      b.pendingRemoval = true;
      return;
    }

    const newLevel = a.level + 1;
    handler.incrementCombo();

    if (newLevel > 5) {
      handler.transitionToWin();
      return;
    }

    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newX / cellSize)));
    const gridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newY / cellSize)));
    const snappedX = gridX * cellSize + cellSize / 2;
    const snappedY = gridY * cellSize + cellSize / 2;

    const mergedGameNode = new GameNode(snappedX, snappedY, gridX, gridY, newLevel);
    handler.updateNodeColor(mergedGameNode, handler.getCurrentTheme());
    mergedGameNode.scale = 1.6;
    
    handler.addRipple(new Ripple(newX, newY, mergedGameNode.color, GAME_CONFIG.PULSE_RADIUS));
    handler.spawnBurst(newX, newY, mergedGameNode.color, 25);
    handler.triggerShake(newLevel * 1.5);
    handler.playMergeSound(newLevel);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(newLevel >= 4 ? 100 : 50);
    }

    // Score calculation should probably stay in ScoreManager, but we call it via handler
    // Since ScoreManager handles combo multipliers internally, we just pass the base value
    handler.addScore(mergedGameNode.scoreValue);

    a.pendingRemoval = true;
    b.pendingRemoval = true;
    handler.addNode(mergedGameNode);
    handler.spawnNode();
    handler.checkAchievements();
  }

  private handlePrismSplit(nodes: GameNode[], a: GameNode, b: GameNode, handler: CollisionHandler) {
    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;
    
    handler.addRipple(new Ripple(newX, newY, '#FF00FF', GAME_CONFIG.PULSE_RADIUS * 0.7));
    handler.spawnBurst(newX, newY, '#FF00FF', 30);
    handler.playMergeSound(1);

    const level = Math.max(a.level, b.level);
    const splitLevel = Math.max(1, level - 1);

    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const occupied = new Set(nodes.map(n => `${n.gridX},${n.gridY}`));
    
    const findNearestAvailable = (targetX: number, targetY: number) => {
      const targetGridX = Math.floor(targetX / cellSize);
      const targetGridY = Math.floor(targetY / cellSize);
      
      for (let r = 0; r < GAME_CONFIG.GRID_SIZE; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const gx = targetGridX + dx;
            const gy = targetGridY + dy;
            if (gx >= 0 && gx < GAME_CONFIG.GRID_SIZE && gy >= 0 && gy < GAME_CONFIG.GRID_SIZE) {
              if (!occupied.has(`${gx},${gy}`)) {
                return { gx, gy };
              }
            }
          }
        }
      }
      return { gx: 0, gy: 0 };
    };

    for (let i = 0; i < 2; i++) {
      const offset = (i === 0 ? -20 : 20);
      const tx = newX + offset;
      const ty = newY + offset;
      
      const { gx, gy } = findNearestAvailable(tx, ty);
      occupied.add(`${gx},${gy}`);
      
      const snappedX = gx * cellSize + cellSize / 2;
      const snappedY = gy * cellSize + cellSize / 2;
      
      const node = new GameNode(snappedX, snappedY, gx, gy, splitLevel);
      handler.updateNodeColor(node, handler.getCurrentTheme());
      handler.addNode(node);
    }
  }

  private getDistance(a: GameNode, b: GameNode): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
