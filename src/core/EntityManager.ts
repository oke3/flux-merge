// SPDX-License-Identifier: Proprietary
import { GameNode } from './GameNode';
import { Game } from './Game';
import { GAME_CONFIG, NodeType, THEMES, GameState } from '../assets/constants';
import { ProfileManager } from './ProfileManager';
import type { UserProfile } from './ProfileManager';
import { Physics } from './Physics';

export class EntityManager {
  private nodes: GameNode[] = [];
  public gridMap: Record<string, GameNode[]> = {};
  private availableCells: Set<string> = new Set();
  private lastSpawnTime: number = -GAME_CONFIG.BASE_SPAWN_INTERVAL;
  private spawnVariance: number = 0;
  private maxNodeLevel: number = 1;


  public get allNodes(): GameNode[] {
    return this.nodes;
  }

  /** Returns the highest node level on the board (maintained incrementally). O(1). */
  public getMaxNodeLevel(): number {
    return this.maxNodeLevel;
  }

  public getNodeById(id: string): GameNode | null {
    return this.nodes.find(n => n.id === id) || null;
  }

  public initGrid() {
    this.availableCells.clear();
    for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
      for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
        this.availableCells.add(`${x},${y}`);
      }
    }
  }

  public addNode(node: GameNode) {
    this.nodes.push(node);
    if (node.level > this.maxNodeLevel) {
      this.maxNodeLevel = node.level;
    }
    
    const key = `${node.gridX},${node.gridY}`;
    if (!this.gridMap[key]) this.gridMap[key] = [];
    this.gridMap[key].push(node);
    this.availableCells.delete(key);
  }

  public findNodeAt(x: number, y: number): GameNode | null {
    // Search for all nodes within the hit area and pick the one with the highest level (Z-order)
    let bestNode: GameNode | null = null;
    let maxLevel = -1;

    const hitRadiusSq = (GAME_CONFIG.NODE_RADIUS * 2.5) ** 2;

    for (const node of this.nodes) {
      if (Physics.getDistanceSq(x, y, node.x, node.y) < hitRadiusSq) {
        if (node.level > maxLevel) {
          maxLevel = node.level;
          bestNode = node;
        }
      }
    }
    return bestNode;
  }

  public calculateSpawnInterval(profile: UserProfile, score: number, hasNebula: boolean, timeSlowMultiplier: number = 1): number {
    const galaxyMultiplier = Math.max(0.5, 1 - (profile.galaxy - 1) * 0.1);
    const base = GAME_CONFIG.BASE_SPAWN_INTERVAL * galaxyMultiplier;
    const min = GAME_CONFIG.MIN_SPAWN_INTERVAL * galaxyMultiplier;
    
    const reduction = (score / GAME_CONFIG.MAX_DIFFICULTY_SCORE) * (base - min);
    let interval = Math.max(min, base - reduction);
    
    if (hasNebula) {
      interval *= 1.5;
    }
    
    interval *= timeSlowMultiplier;
    
    return interval;
  }

  public spawnJunkNode() {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const node = new GameNode(
      Math.random() * GAME_CONFIG.CANVAS_SIZE,
      Math.random() * GAME_CONFIG.CANVAS_SIZE,
      0, 0, 1, NodeType.JUNK
    );
    node.gridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(node.x / cellSize)));
    node.gridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(node.y / cellSize)));
    
    this.addNode(node);
    
    // Immediately update grid map to prevent overlapping spawns in the same frame
    const key = `${node.gridX},${node.gridY}`;
    if (!this.gridMap[key]) this.gridMap[key] = [];
    this.gridMap[key].push(node);
    
    return node;
  }

  public spawnNode(profile: UserProfile, currentTheme: string, isFrenzy: boolean = false): GameNode | null {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    
    if (this.availableCells.size === 0) {
      return null;
    }
    
    // O(1) Selection: Pick a random cell from the set
    const cellsArray = Array.from(this.availableCells);
    const cellKey = cellsArray[Math.floor(Math.random() * cellsArray.length)];
    const [cx, cy] = cellKey.split(',').map(Number);
    
    const x = cx * cellSize + cellSize / 2;
    const y = cy * cellSize + cellSize / 2;
    
    let type: NodeType = NodeType.STANDARD;
    let specialChance = ProfileManager.getAbilityValue('specialChance', profile);
    if (isFrenzy) specialChance *= 2;
    
    if (Math.random() < specialChance) {
      const rand = Math.random();
      if (rand < 0.03) {
        type = NodeType.LUMINOUS_NOVA;
      } else if (rand < 0.08) {
        type = NodeType.BLACK_HOLE;
      } else if (rand < 0.13) {
        type = NodeType.NEBULA;
      } else if (rand < 0.18) {
        type = NodeType.PRISM;
      } else if (rand < 0.28) {
        type = NodeType.SUPERNOVA;
      } else if (rand < 0.48) {
        type = NodeType.PULSAR;
      } else if (rand < 0.63) {
        type = NodeType.RESONANCE;
      } else if (rand < 0.68) {
        type = NodeType.TIME_CRYSTAL;
      } else {
        type = NodeType.STAR;
      }
    }
    
    const node = new GameNode(x, y, cx, cy, 1, type);
    this.updateNodeColor(node, currentTheme);
    this.addNode(node);
    
    return node;
  }
  
  public updateAllColors(currentTheme: string) {
    this.nodes.forEach(node => this.updateNodeColor(node, currentTheme));
  }

  public updateNodeColor(node: GameNode, currentTheme: string) {
    if (node.type === NodeType.VOID) {
      node.color = '#000000';
    } else if (node.type === NodeType.BLACK_HOLE) {
      node.color = '#110022';
    } else if (node.type === NodeType.NEBULA) {
      node.color = '#4400FF';
    } else if (node.type === NodeType.JUNK) {
      node.color = '#555555';
    } else if (node.type === NodeType.STAR) {
      node.color = '#FFD700';
    } else if (node.type === NodeType.SUPERNOVA) {
      node.color = '#FF4500';
    } else if (node.type === NodeType.PULSAR) {
      node.color = '#00FFCC';
    } else if (node.type === NodeType.RESONANCE) {
      node.color = '#FFAA00';
    } else if (node.type === NodeType.TIME_CRYSTAL) {
      node.color = '#00BFFF';
    } else if (node.type === NodeType.PRISM) {
      node.color = '#FF00FF';
    } else {
      const theme = THEMES[currentTheme] || THEMES.deepSpace;
      node.color = theme.levels[node.level] || '#FFFFFF';
    }
  }

  public updateNodes(cellSize: number, gridSize: number, delta: number) {
    this.nodes.forEach(node => {
      node.update(cellSize, gridSize, delta);
      
      // Incremental Grid Update
      if (node.gridX !== node.prevGridX || node.gridY !== node.prevGridY) {
        const oldKey = `${node.prevGridX},${node.prevGridY}`;
        const newKey = `${node.gridX},${node.gridY}`;
        
        // Remove from old cell
        const oldCell = this.gridMap[oldKey];
        if (oldCell) {
          const idx = oldCell.indexOf(node);
          if (idx !== -1) oldCell.splice(idx, 1);
          if (oldCell.length === 0) {
            delete this.gridMap[oldKey];
            this.availableCells.add(oldKey);
          }
        }
        
        // Add to new cell
        if (!this.gridMap[newKey]) this.gridMap[newKey] = [];
        this.gridMap[newKey].push(node);
        this.availableCells.delete(newKey);
        
        node.prevGridX = node.gridX;
        node.prevGridY = node.gridY;
      }
    });
  }

  public cleanup() {
    let maxRemoved = false;

    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (node.pendingRemoval) {
        if (node.level >= this.maxNodeLevel) {
          maxRemoved = true;
        }

        // Remove from grid map
        const key = `${node.gridX},${node.gridY}`;
        const cell = this.gridMap[key];
        if (cell) {
          const idx = cell.indexOf(node);
          if (idx !== -1) cell.splice(idx, 1);
          if (cell.length === 0) delete this.gridMap[key];
        }
        
        // Mark cell as available
        this.availableCells.add(key);
        
        this.nodes.splice(i, 1);
      }
    }

    // Recompute max level only when the previous max-level node was removed (rare)
    if (maxRemoved) {
      let newMax = 1;
      for (const n of this.nodes) {
        if (n.level > newMax) newMax = n.level;
      }
      this.maxNodeLevel = newMax;
    }
  }

  public updateGridMap() {
    // No-op: Grid map is now updated incrementally in updateNodes, addNode, and cleanup.
    // Retained for compatibility with CollisionHandler interface.
  }

  public getNodesInCell(gridX: number, gridY: number): GameNode[] {
    return this.gridMap[`${gridX},${gridY}`] || [];
  }

  public reset() {
    this.nodes = [];
    this.maxNodeLevel = 1;
    this.lastSpawnTime = performance.now() - GAME_CONFIG.BASE_SPAWN_INTERVAL;
    this.spawnVariance = 0;
  }

  public processSpawning(
    game: Game, 
    now: number
  ): void {
    const interval = this.calculateSpawnInterval(
      game.profile, 
      game.scoreManager.getScore(), 
      this.allNodes.some(n => n.type === NodeType.NEBULA),
      game.timeSlowMultiplier
    ) + this.spawnVariance;
    
    const timeSinceLastSpawn = now - this.lastSpawnTime;
    
    if (timeSinceLastSpawn >= interval + this.spawnVariance) {
      const node = this.spawnNode(game.profile, game.getCurrentTheme(), game.comboManager.getIsFrenzy());
      if (!node) {
        game.transitionTo(GameState.GAME_OVER);
      } else {
        this.lastSpawnTime = now;
        this.spawnVariance = (Math.random() - 0.5) * (interval * GAME_CONFIG.SPAWN_VARIANCE_MULTIPLIER);
      }
    }
  }
}
