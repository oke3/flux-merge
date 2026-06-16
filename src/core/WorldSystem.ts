// SPDX-License-Identifier: Proprietary
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
  private resonancePulseTimers: Map<string, number> = new Map();

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
      this.triggerPulsarWave(nodes, gridMap, handler, profile);
      this.pulsarTimer = this.PULSAR_INTERVAL;
    }

    this.handleBlackHoles(nodes, gridMap, handler);
    this.handleVoidConsumption(nodes, gridMap, handler);
    this.handleSupernovas(nodes, gridMap, handler, profile);
    this.handleResonance(nodes, gridMap, handler, deltaTime, isFrenzy);
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

  private triggerPulsarWave(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler, profile: UserProfile) {
    const pulsars = nodes.filter(n => n.type === NodeType.PULSAR);
    const pulseRadius = ProfileManager.getAbilityValue('pulsarRadius', profile) || GAME_CONFIG.PULSE_RADIUS;
    
    pulsars.forEach(p => {
      handler.addRipple(new Ripple(p.x, p.y, p.color, pulseRadius));
      handler.spawnBurst(p.x, p.y, p.color, 20);
      
      const nearbyNodes = Physics.getNodesInRadius(p.x, p.y, pulseRadius, gridMap);
      for (const node of nearbyNodes) {
        if (node !== p) {
          Physics.applyRepulsion(node, p.x, p.y, pulseRadius);
        }
      }
    });
  }

  private handleResonance(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler, deltaTime: number, isFrenzy: boolean) {
    const resonators = nodes.filter(n => n.type === NodeType.RESONANCE);
    const activeIds = new Set(resonators.map(n => n.id));

    // Clean up stale timer entries
    for (const id of this.resonancePulseTimers.keys()) {
      if (!activeIds.has(id)) {
        this.resonancePulseTimers.delete(id);
      }
    }

    const pulseRadius = GAME_CONFIG.RESONANCE_CONFIG.PULSE_RADIUS * (isFrenzy ? GAME_CONFIG.RESONANCE_CONFIG.FRENZY_RADIUS_MULTIPLIER : 1);
    const pulseRadiusSq = pulseRadius * pulseRadius;

    for (const resonator of resonators) {
      // Initialize or decrement pulse timer
      let timer = this.resonancePulseTimers.get(resonator.id);
      if (timer === undefined) {
        timer = GAME_CONFIG.RESONANCE_CONFIG.PULSE_INTERVAL; // Start ready to pulse
      }
      timer -= deltaTime;

      if (timer <= 0) {
        // Emit resonance pulse!
        timer = GAME_CONFIG.RESONANCE_CONFIG.PULSE_INTERVAL;

        handler.addRipple(new Ripple(resonator.x, resonator.y, '#FFAA00', pulseRadius));
        handler.spawnBurst(resonator.x, resonator.y, '#FFAA00', 15);

        // Buff nearby standard nodes only (using gridMap for spatial lookup)
        const nearbyNodes = Physics.getNodesInRadius(resonator.x, resonator.y, pulseRadius, gridMap);
        for (const target of nearbyNodes) {
          if (target === resonator || target.pendingRemoval) continue;
          if (target.type !== NodeType.STANDARD) continue;

          const distSq = Physics.getDistanceSq(resonator.x, resonator.y, target.x, target.y);
          if (distSq < pulseRadiusSq) {
            target.isResonant = true;
            target.resonanceTimer = GAME_CONFIG.RESONANCE_CONFIG.RESONANCE_DURATION;
          }
        }
      }

      this.resonancePulseTimers.set(resonator.id, timer);
    }
  }

  private handleBlackHoles(nodes: GameNode[], gridMap: Record<string, GameNode[]>, _handler: CollisionHandler) {
    const blackHoles = nodes.filter(n => n.type === NodeType.BLACK_HOLE);
    
    blackHoles.forEach(bh => {
      const pullRadius = 200;
      const nearbyNodes = Physics.getNodesInRadius(bh.x, bh.y, pullRadius, gridMap);
      
      for (const node of nearbyNodes) {
        if (node === bh || node.isDragging) continue;
        
        const distSq = Physics.getDistanceSq(bh.x, bh.y, node.x, node.y);
        
        if (distSq > 0 && distSq < pullRadius * pullRadius) {
          const dx = bh.x - node.x;
          const dy = bh.y - node.y;
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / pullRadius) * 0.5;
          
          node.targetX += (dx / dist) * force * 20;
          node.targetY += (dy / dist) * force * 20;
        }
      }
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
               handler.spawnBurst(other.x, other.y, '#000000', 20);
               handler.spawnBurst(other.x, other.y, '#440044', 12); // Void sparkles
               handler.triggerShake(15);
               handler.playMergeSound(1);
                if ('triggerHaptic' in handler) {
                  handler.triggerHaptic([30, 50, 30]);
                }

               other.pendingRemoval = true;

            }
          }
        }
      }
    }
  }

  private handleSupernovas(nodes: GameNode[], gridMap: Record<string, GameNode[]>, handler: CollisionHandler, profile: UserProfile) {
    for (const node of nodes) {
      if (node.type !== NodeType.SUPERNOVA) continue;

      // Use gridMap to only check nodes within collision radius
      const triggerRadius = node.radius * 2;
      const nearbyNodes = Physics.getNodesInRadius(node.x, node.y, triggerRadius, gridMap);
      for (const other of nearbyNodes) {
        if (node === other) continue;
        if (Physics.getDistanceSq(node.x, node.y, other.x, other.y) < triggerRadius * triggerRadius) {
          this.triggerSupernova(node, gridMap, handler, profile);
          return;
        }
      }
    }
  }

  private triggerSupernova(supernova: GameNode, gridMap: Record<string, GameNode[]>, handler: CollisionHandler, profile: UserProfile) {
    const { gridX, gridY, x, y } = supernova;
    const radiusMultiplier = ProfileManager.getAbilityValue('supernovaRadius', profile) || 1;
    
    handler.addRipple(new Ripple(x, y, '#FF4500', GAME_CONFIG.PULSE_RADIUS * 2 * radiusMultiplier));
    handler.spawnBurst(x, y, '#FF4500', 100);
    handler.triggerShake(20);
    handler.playMergeSound(5); // Approximation for Singularity sound if not in handler
    
    if ('triggerHaptic' in handler) {
      handler.triggerHaptic([100, 50, 100]);
    }

    const blastRadius = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE * Math.ceil(radiusMultiplier);
    const affectedNodes = Physics.getNodesInRadius(x, y, blastRadius, gridMap);
    for (const node of affectedNodes) {
      if (node === supernova) continue;
      const isInside = Math.abs(node.gridX - gridX) <= Math.ceil(radiusMultiplier) && Math.abs(node.gridY - gridY) <= Math.ceil(radiusMultiplier);
      if (isInside) {
        handler.spawnBurst(node.x, node.y, node.color, 10);
        if (node.type !== NodeType.BLACK_HOLE) {
          handler.addScore(50);
        }
        node.pendingRemoval = true;
      }
    }
    this.supernovaTriggered = true;
  }
}
