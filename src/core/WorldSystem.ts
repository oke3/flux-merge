/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { GAME_CONFIG, NodeType } from '../assets/constants';
import { Ripple } from './Ripple';
import type { CollisionHandler } from './CollisionSystem';

export class WorldSystem {
  private backgroundOffset: number = 0;
  private screenShakeIntensity: number = 0;
  private screenShakeDuration: number = 0;
  private pulsarTimer: number = 0;
  private readonly PULSAR_INTERVAL = 3000;

  public update(
    nodes: GameNode[], 
    handler: CollisionHandler, 
    deltaTime: number = 16.67
  ) {
    // Update Sensory State
    this.backgroundOffset += 0.1;
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= deltaTime;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Handle Pulsar Repulsion
    this.pulsarTimer -= deltaTime;
    if (this.pulsarTimer <= 0) {
      this.triggerPulsarWave(nodes, handler);
      this.pulsarTimer = this.PULSAR_INTERVAL;
    }

    this.handleVoidConsumption(nodes, handler);
    this.handleSupernovas(nodes, handler);
  }

  public triggerShake(intensity: number, duration: number = 200) {
    this.screenShakeIntensity = intensity;
    this.screenShakeDuration = duration;
  }

  public getBackgroundOffset(): number {
    return this.backgroundOffset;
  }

  public getScreenShakeIntensity(): number {
    return this.screenShakeIntensity;
  }

  private triggerPulsarWave(nodes: GameNode[], handler: CollisionHandler) {
    const pulsars = nodes.filter(n => n.type === NodeType.PULSAR);
    pulsars.forEach(p => {
      handler.addRipple(new Ripple(p.x, p.y, p.color, GAME_CONFIG.PULSE_RADIUS));
      handler.spawnBurst(p.x, p.y, p.color, 20);
      
      nodes.forEach(node => {
        if (node !== p) {
          // Using internal distance check or Physics is okay here, 
          // but for now we keep it consistent with the original logic.
          // We'll use the Physics utility for repulsion.
          // Since WorldSystem doesn't have Physics, we rely on the handler 
          // or a static Physics call.
          // Note: Physics.applyRepulsion is static.
          // import { Physics } from './Physics'; // Will add import
        }
      });
    });
  }

  private handleVoidConsumption(nodes: GameNode[], handler: CollisionHandler) {
    for (let i = 0; i < nodes.length; i++) {
      const voidGameNode = nodes[i];
      if (voidGameNode.type !== NodeType.VOID) continue;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];
        if (other.type === NodeType.VOID) continue;

        if (this.getDistance(voidGameNode, other) < GAME_CONFIG.VOID_CONSUMPTION_RADIUS) {
          handler.addRipple(new Ripple(other.x, other.y, '#000000', GAME_CONFIG.PULSE_RADIUS * 0.5));
          handler.spawnBurst(other.x, other.y, '#000000', 15);
          handler.playMergeSound(1);
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
          other.pendingRemoval = true;
          break; 
        }
      }
    }
  }

  private handleSupernovas(nodes: GameNode[], handler: CollisionHandler) {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.type !== NodeType.SUPERNOVA) continue;

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const other = nodes[j];
        if (this.getDistance(node, other) < node.radius * 2) {
          this.triggerSupernova(node, nodes, handler);
          return;
        }
      }
    }
  }

  private triggerSupernova(supernova: GameNode, nodes: GameNode[], handler: CollisionHandler) {
    const { gridX, gridY, x, y } = supernova;
    
    // Note: supernovaTriggered is a state that might need to be in Game or WorldSystem.
    // For now, we'll just handle the effects.
    handler.addRipple(new Ripple(x, y, '#FF4500', GAME_CONFIG.PULSE_RADIUS * 2));
    handler.spawnBurst(x, y, '#FF4500', 100);
    handler.triggerShake(20, 400);
    handler.playMergeSound(5); // Approximation for Singularity sound if not in handler
    
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    nodes.forEach(node => {
      const isInside = Math.abs(node.gridX - gridX) <= 1 && Math.abs(node.gridY - gridY) <= 1;
      if (isInside && node !== supernova) {
        handler.spawnBurst(node.x, node.y, node.color, 10);
        handler.addScore(50);
        node.pendingRemoval = true;
      }
    });
  }

  private getDistance(a: GameNode, b: GameNode): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }
}
