/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { LuminousNova } from './LuminousNova';
import { GAME_CONFIG, NodeType } from '../assets/constants';
import { Ripple } from './Ripple';
import { Physics } from './Physics';

export interface CollisionHandler {
  addScore(points: number): void;
  incrementCombo(): void;
  triggerFrenzy(duration: number): void;
  playMergeSound(level: number): void;
  spawnBurst(x: number, y: number, color: string, count: number): void;
  addRipple(ripple: Ripple): void;
  triggerShake(intensity: number, duration?: number): void;
  spawnNode(): void;
  transitionToWin(): void;
  checkAchievements(): void;
  updateNodeColor(node: GameNode, theme: string): void;
  addNode(node: GameNode): void;
  removeNodeMesh(node: GameNode): void;
  getCurrentTheme(): string;
  updateGridMap(): void;
  getGridMap(): Record<string, GameNode[]>;
  logEvent(message: string): void;
  pulseHUD(): void;
}

export class CollisionSystem {
  private readonly MAX_MERGES_PER_FRAME = 50;

  public checkAndResolveMerges(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler) {
    this.handleNovaInteractions(nodes, gridMap, handler);

    const snapshot = new Set(nodes);
    let totalMergesThisFrame = 0;

    for (const a of snapshot) {
      if (totalMergesThisFrame >= this.MAX_MERGES_PER_FRAME) break;
      if (a.pendingRemoval) continue;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cellKey = `${a.gridX + dx},${a.gridY + dy}`;
          const nearbyNodes = gridMap[cellKey];
          if (!nearbyNodes) continue;

          for (const b of nearbyNodes) {
            if (totalMergesThisFrame >= this.MAX_MERGES_PER_FRAME) break;
            if (a === b || b.pendingRemoval || !snapshot.has(b)) continue;

            const canMerge = (a.level === b.level) || (a.type === NodeType.STAR) || (b.type === NodeType.STAR);
            const combinedRadius = a.radius * a.scale + b.radius * b.scale;
            if (canMerge && Physics.getDistanceSq(a.x, a.y, b.x, b.y) < combinedRadius * combinedRadius) {
              if (a.type === NodeType.VOID || b.type === NodeType.VOID || a.type === NodeType.BLACK_HOLE || b.type === NodeType.BLACK_HOLE || a.type === NodeType.JUNK || b.type === NodeType.JUNK) continue;
              
              const indexA = nodes.indexOf(a);
              const indexB = nodes.indexOf(b);
              
              if (indexA !== -1 && indexB !== -1) {
                this.mergeGameNodes(nodes, indexA, indexB, handler);
                totalMergesThisFrame++;
                break; 
              }
            }
          }
          if (a.pendingRemoval) break;
        }
        if (a.pendingRemoval) break;
      }
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

    // Check for Luminous Nova Refraction
    // If either is a Nova, and the other is being 'consumed' by a Void in the same frame, 
    // we would need to know who is consuming. 
    // But here we are handling MERGES. 
    // Void nodes are excluded from merges in line 53.
    
    const newLevel = Math.max(a.level, b.level) + 1;

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
    
    const rippleRadius = newLevel >= 3 ? GAME_CONFIG.PULSE_RADIUS * 1.5 : GAME_CONFIG.PULSE_RADIUS;
    handler.addRipple(new Ripple(newX, newY, mergedGameNode.color, rippleRadius));
    handler.spawnBurst(newX, newY, mergedGameNode.color, 20 + (newLevel * 10));
    if (newLevel >= 3) {
      handler.spawnBurst(newX, newY, '#FFFFFF', 15); // Golden white highlight burst
    }
    if (newLevel >= 4) {
      handler.spawnBurst(newX, newY, '#FFD700', 25); // Gold supernova burst
    }
    handler.triggerShake(newLevel * 2.5);
    handler.playMergeSound(newLevel);
    
    if ('vibrate' in navigator) {
      navigator.vibrate(newLevel >= 4 ? 100 : 50);
    }

    handler.addScore(mergedGameNode.scoreValue);
    handler.logEvent(`MERGE: Lvl ${a.level} → ${mergedGameNode.level}`);

    if (mergedGameNode.level >= 3) {
      handler.pulseHUD();
    }

    a.pendingRemoval = true;
    b.pendingRemoval = true;
    handler.removeNodeMesh(a);
    handler.removeNodeMesh(b);
    handler.addNode(mergedGameNode);
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

  public handleNovaInteractions(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler) {
    const novas = nodes.filter(n => n.type === NodeType.LUMINOUS_NOVA) as LuminousNova[];
    const voids = nodes.filter(n => n.type === NodeType.VOID || n.type === NodeType.BLACK_HOLE);

    for (const nova of novas) {
      // 1. Repulsion Pulse
      if (nova.isActivePulse) {
        const radiusSq = nova.currentPulseRadius * nova.currentPulseRadius;
        
        // Use gridMap to only check nearby cells for efficiency
        const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
        const gridRange = Math.ceil(nova.currentPulseRadius / cellSize);
        
        for (let dx = -gridRange; dx <= gridRange; dx++) {
          for (let dy = -gridRange; dy <= gridRange; dy++) {
            const cellKey = `${nova.gridX + dx},${nova.gridY + dy}`;
            const cellNodes = gridMap[cellKey];
            if (!cellNodes) continue;

            for (const node of cellNodes) {
              if (node === nova) continue;
              
              const distSq = Physics.getDistanceSq(nova.x, nova.y, node.x, node.y);
              if (distSq < radiusSq) {
                const dist = Math.sqrt(distSq);
                const force = (nova.currentPulseRadius - dist) / nova.currentPulseRadius;
                const angle = Math.atan2(node.y - nova.y, node.x - nova.x);
                
                const pushX = Math.cos(angle) * force * GAME_CONFIG.PHYSICS_REPULSION_FORCE_MULT;
                const pushY = Math.sin(angle) * force * GAME_CONFIG.PHYSICS_REPULSION_FORCE_MULT;
                
                node.targetX += pushX;
                node.targetY += pushY;
              }
            }
          }
        }
      }

      // 2. Refraction Logic (Void Counter)
      // We check if any Void node is trying to consume a node that is inside the Nova's range.
      for (const voidNode of voids) {
        const voidRadius = NodeType.VOID === voidNode.type ? GAME_CONFIG.VOID_CONSUMPTION_RADIUS : GAME_CONFIG.VOID_CONSUMPTION_RADIUS * 1.5;
        const voidRadiusSq = voidRadius * voidRadius;

        for (const node of nodes) {
          if (node === voidNode || node === nova) continue;

          const distToVoidSq = Physics.getDistanceSq(voidNode.x, voidNode.y, node.x, node.y);
          if (distToVoidSq < voidRadiusSq) {
            // Void wants to eat this node. Is the Nova protecting it?
            const distToNovaSq = Physics.getDistanceSq(nova.x, nova.y, node.x, node.y);
               if (distToNovaSq < GAME_CONFIG.NOVA_CONFIG.REPULSION_RADIUS * GAME_CONFIG.NOVA_CONFIG.REPULSION_RADIUS) {
                 // REFRACTION TRIGGERED!
                 if (node.pendingRemoval) {
                   node.pendingRemoval = false; // Save the node!
                   handler.logEvent(`REFRACTION: Node Saved!`);
                   this.handleRefractionShatter(node, handler);
                   
                   // Visuals for the refraction burst

                handler.spawnBurst(node.x, node.y, '#FFFFFF', 40);
                handler.addRipple(new Ripple(node.x, node.y, '#00FFFF', GAME_CONFIG.PULSE_RADIUS * 0.5));
                handler.playMergeSound(1); // Crystalline chime
              }
            }
          }
        }
      }
    }
  }

  private handleRefractionShatter(node: GameNode, handler: CollisionHandler) {
    const originalLevel = node.level;
    const splitLevel = Math.max(1, originalLevel - 1);
    const count = GAME_CONFIG.NOVA_CONFIG.SHATTER_COUNT;
    
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random();
      const dist = 20 + Math.random() * 30;
      const tx = node.x + Math.cos(angle) * dist;
      const ty = node.y + Math.sin(angle) * dist;
      
      const gx = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(tx / cellSize)));
      const gy = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(ty / cellSize)));
      
      const shard = new GameNode(tx, ty, gx, gy, splitLevel);
      handler.updateNodeColor(shard, handler.getCurrentTheme());
      handler.addNode(shard);
    }
    // Note: the original node remains but is 'saved' from removal. 
    // To avoid infinite node growth, we might want to lower its level.
    node.level = Math.max(1, originalLevel - 1);
  }
}

