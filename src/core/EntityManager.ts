/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { GAME_CONFIG, NodeType, THEMES } from '../assets/constants';
import { ProfileManager } from './ProfileManager';
import type { UserProfile } from './ProfileManager';

export class EntityManager {
  private nodes: GameNode[] = [];

  public get allNodes(): GameNode[] {
    return this.nodes;
  }

  public addNode(node: GameNode) {
    this.nodes.push(node);
  }

  public findNodeAt(x: number, y: number): GameNode | null {
    return this.nodes.find(n => this.getDistance({x, y}, n) < n.radius * 1.5) || null;
  }

  public spawnNode(profile: UserProfile, currentTheme: string): GameNode | null {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const occupied = new Set(this.nodes.map(n => `${n.gridX},${n.gridY}`));

    const availableCells = [];
    for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
      for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length === 0) {
      return null;
    }

    const cell = availableCells[Math.floor(Math.random() * availableCells.length)];
    const x = cell.x * cellSize + cellSize / 2;
    const y = cell.y * cellSize + cellSize / 2;

    let type: NodeType = NodeType.STANDARD;
    const specialChance = ProfileManager.getAbilityValue('specialChance', profile);
    if (Math.random() < specialChance) {
      const rand = Math.random();
      if (rand < 0.1) {
        type = NodeType.SUPERNOVA;
      } else if (rand < 0.3) {
        type = NodeType.PULSAR;
      } else if (rand < 0.6) {
        type = NodeType.VOID;
      } else {
        type = NodeType.STAR;
      }
    }

    const node = new GameNode(x, y, cell.x, cell.y, 1, type);
    this.updateNodeColor(node, currentTheme);
    this.nodes.push(node);
    return node;
  }

  public updateAllColors(currentTheme: string) {
    this.nodes.forEach(node => this.updateNodeColor(node, currentTheme));
  }

  public updateNodeColor(node: GameNode, currentTheme: string) {
    if (node.type === NodeType.VOID) {
      node.color = '#000000';
    } else if (node.type === NodeType.STAR) {
      node.color = '#FFD700';
    } else if (node.type === NodeType.SUPERNOVA) {
      node.color = '#FF4500';
    } else if (node.type === NodeType.PULSAR) {
      node.color = '#00FFCC';
    } else if (node.type === NodeType.PRISM) {
      node.color = '#FF00FF';
    } else {
      const theme = THEMES[currentTheme] || THEMES.deepSpace;
      node.color = theme.levels[node.level] || '#FFFFFF';
    }
  }

  public cleanup() {
    this.nodes = this.nodes.filter(node => !node.pendingRemoval);
  }

  public reset() {
    this.nodes = [];
  }

  private getDistance(a: {x: number, y: number}, b: GameNode): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
