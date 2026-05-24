/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { GAME_CONFIG, NodeType } from '../assets/constants';
import { Ripple } from './Ripple';
import type { CollisionHandler } from './CollisionSystem';
import { Physics } from './Physics';
import { ProfileManager } from './ProfileManager';
import type { UserProfile } from './ProfileManager';
import type { Game } from './Game';

export class WorldSystem {
  private pulsarTimer: number = 0;
  private readonly PULSAR_INTERVAL = 3000;
  public supernovaTriggered: boolean = false;

  public update(
    nodes: GameNode[], 
    gridMap: Record<string, GameNode[]>,
    handler: CollisionHandler, 
    profile: UserProfile,
    deltaTime: number = 16.67,
    isFrenzy: boolean = false
  ) {
    // Handle Pulsar Repulsion
    this.pulsarTimer -= deltaTime;
    if (this.pulsarTimer <= 0) {
      this.triggerPulsarWave(nodes, handler, profile);
      this.pulsarTimer = this.PULSAR_INTERVAL;
    }

    this.handleBlackHoles(nodes, handler);
    this.handleVoidConsumption(nodes, gridMap, handler);
    this.handleSupernovas(nodes, handler, profile);
    this.handleMagneticPull(nodes, gridMap, profile, isFrenzy);
  }

  private handleMagneticPull(nodes: GameNode[], gridMap: Record<string, GameNode[]>, profile: UserProfile, isFrenzy: boolean) {
    const strengthMultiplier = isFrenzy ? GAME_CONFIG.FRENZY_MAGNETIC_MULTIPLIER : 1;

    Physics.applyMagneticPullToAll(
      nodes, 
      gridMap, 
      strengthMultiplier,
      profile
    );
  }

  public triggerGravityFlux(game: Game) {
    console.log('[WorldSystem] GRAVITY FLUX EVENT!');
    game.ui.showNotification('GRAVITY FLUX!');
    
    const directions = [
      { dx: 1, dy: 0, label: 'Right' },
      { dx: -1, dy: 0, label: 'Left' },
      { dx: 0, dy: 1, label: 'Down' },
      { dx: 0, dy: -1, label: 'Up' },
    ];
    const dir = directions[Math.floor(Math.random() * directions.length)];
    
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    
    game.nodes.forEach(node => {
      if (node.isDragging) return;
      
      const newGridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, node.gridX + dir.dx));
      const newGridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, node.gridY + dir.dy));
      
      node.gridX = newGridX;
      node.gridY = newGridY;
      node.targetX = newGridX * cellSize + cellSize / 2;
      node.targetY = newGridY * cellSize + cellSize / 2;
    });
    
    game.effects.triggerShake(GAME_CONFIG.FLUX_SHAKE_INTENSITY, GAME_CONFIG.FLUX_SHAKE_DURATION);
  }

  private triggerPulsarWave(nodes: GameNode[], handler: CollisionHandler, profile: UserProfile) {
    const pulsars = nodes.filter(n => n.type === NodeType.PULSAR);
    const pulseRadius = ProfileManager.getAbilityValue('pulsarRadius', profile) || GAME_CONFIG.PULSE_RADIUS;
    
    pulsars.forEach(p => {
      handler.addRipple(new Ripple(p.x, p.y, p.color, pulseRadius));
      handler.spawnBurst(p.x, p.y, p.color, 20);
      
      nodes.forEach(node => {
        if (node !== p) {
          Physics.applyRepulsion(node, p.x, p.y, pulseRadius);
        }
      });
    });
  }

  private handleBlackHoles(nodes: GameNode[], _handler: CollisionHandler) {
    const blackHoles = nodes.filter(n => n.type === NodeType.BLACK_HOLE);
    
    blackHoles.forEach(bh => {
      nodes.forEach(node => {
        if (node === bh || node.isDragging) return;
        
        const distSq = Physics.getDistanceSq(bh.x, bh.y, node.x, node.y);
        const pullRadius = 200;
        
        if (distSq > 0 && distSq < pullRadius * pullRadius) {
          const dx = bh.x - node.x;
          const dy = bh.y - node.y;
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / pullRadius) * 0.5;
          
          node.targetX += (dx / dist) * force * 20;
          node.targetY += (dy / dist) * force * 20;
        }
      });
    });
  }

  private handleVoidConsumption(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler) {
    for (let i = 0; i < nodes.length; i++) {
      const voidGameNode = nodes[i];
      if (voidGameNode.type !== NodeType.VOID) continue;

      // Use gridMap to find nearby nodes
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const cellKey = `${voidGameNode.gridX + dx},${voidGameNode.gridY + dy}`;
          const nearbyNodes = gridMap[cellKey];
          if (!nearbyNodes) continue;

          for (const other of nearbyNodes) {
            if (voidGameNode === other || other.type === NodeType.VOID) continue;

            if (Physics.getDistanceSq(voidGameNode.x, voidGameNode.y, other.x, other.y) < Math.pow(GAME_CONFIG.VOID_CONSUMPTION_RADIUS, 2)) {
              handler.addRipple(new Ripple(other.x, other.y, '#000000', GAME_CONFIG.PULSE_RADIUS * 0.5));
              handler.spawnBurst(other.x, other.y, '#000000', 15);
              handler.playMergeSound(1);
              if ('vibrate' in navigator) {
                navigator.vibrate([30, 50, 30]);
              }
              other.pendingRemoval = true;
            }
          }
        }
      }
    }
  }

  private handleSupernovas(nodes: GameNode[], handler: CollisionHandler, profile: UserProfile) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type !== NodeType.SUPERNOVA) continue;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];
        if (Physics.getDistanceSq(node.x, node.y, other.x, other.y) < Math.pow(node.radius * 2, 2)) {
          this.triggerSupernova(node, nodes, handler, profile);
          return;
        }
      }
    }
  }

  private triggerSupernova(supernova: GameNode, nodes: GameNode[], handler: CollisionHandler, profile: UserProfile) {
    const { gridX, gridY, x, y } = supernova;
    const radiusMultiplier = ProfileManager.getAbilityValue('supernovaRadius', profile) || 1;
    
    handler.addRipple(new Ripple(x, y, '#FF4500', GAME_CONFIG.PULSE_RADIUS * 2 * radiusMultiplier));
    handler.spawnBurst(x, y, '#FF4500', 100);
    handler.triggerShake(20);
    handler.playMergeSound(5); // Approximation for Singularity sound if not in handler
    
    if ('vibrate' in navigator && profile.settings.disableVibration === false) {
      navigator.vibrate([100, 50, 100]);
    }

    nodes.forEach(node => {
      const isInside = Math.abs(node.gridX - gridX) <= Math.ceil(radiusMultiplier) && Math.abs(node.gridY - gridY) <= Math.ceil(radiusMultiplier);
      if (isInside && node !== supernova) {
        handler.spawnBurst(node.x, node.y, node.color, 10);
        if (node.type !== NodeType.BLACK_HOLE) {
          handler.addScore(50);
        }
        node.pendingRemoval = true;
      }
    });
    this.supernovaTriggered = true;
  }
}
