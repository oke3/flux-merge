import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CollisionSystem } from './CollisionSystem';
import { GameNode } from './GameNode';
import { LuminousNova } from './LuminousNova';
import { NodeType } from '../assets/constants';

describe('Nova vs Void: Adversarial Balance Tests', () => {
  let collisionSystem: CollisionSystem;
  let handler: any;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    handler = {
      addNode: vi.fn(),
      updateNodeColor: vi.fn(),
      addRipple: vi.fn(),
      spawnBurst: vi.fn(),
      playMergeSound: vi.fn(),
      logEvent: vi.fn(),
      getCurrentTheme: vi.fn(() => ({})),
      triggerFlash: vi.fn(),
      triggerShake: vi.fn(),
    };
  });

  it('should repel nearby nodes during a Nova pulse', () => {
    const nova = new LuminousNova(400, 400, 5, 5);
    const target = new GameNode(420, 400, 5, 5, 1);
    
    // Force Nova into pulse state
    nova.pulsePhase = 'SWELL';
    nova.currentPulseRadius = 50;
    
    const nodes = [nova, target];

    const gridMap: Record<string, GameNode[]> = {
      '5,5': [nova, target],
    };

    const initialTargetX = target.targetX;
    
    collisionSystem.handleNovaInteractions(nodes, gridMap, handler);

    // Target should be pushed away from Nova (x=400) towards positive x (x=420)
    expect(target.targetX).toBeGreaterThan(initialTargetX);
  });

  it('should trigger refraction when Nova protects a node from Void consumption', () => {
    const nova = new LuminousNova(400, 400, 5, 5);
    const voidNode = new GameNode(450, 400, 6, 5, 1);
    voidNode.type = NodeType.VOID;
    
    const target = new GameNode(420, 400, 5, 5, 2);
    
    // Scenario: Void has already marked target for removal
    target.pendingRemoval = true;

    const nodes = [nova, voidNode, target];
    const gridMap: Record<string, GameNode[]> = {
      '5,5': [nova, target],
      '6,5': [voidNode],
    };

    collisionSystem.handleNovaInteractions(nodes, gridMap, handler);

    // 1. Target should be saved from removal
    expect(target.pendingRemoval).toBe(false);
    
    // 2. Refraction should shatter the node into new nodes
    expect(handler.addNode).toHaveBeenCalled();
    
    // 3. Target level should be reduced
    expect(target.level).toBeLessThan(3);
  });

  it('should not repel nodes outside of the pulse radius', () => {
    const nova = new LuminousNova(400, 400, 5, 5);
    const target = new GameNode(600, 50, 8, 0, 1);
    
    nova.pulsePhase = 'SWELL';
    nova.currentPulseRadius = 50;
    
    const nodes = [nova, target];

    const gridMap: Record<string, GameNode[]> = {
      '5,5': [nova],
      '8,0': [target],
    };

    const initialTargetX = target.targetX;
    collisionSystem.handleNovaInteractions(nodes, gridMap, handler);

    expect(target.targetX).toBe(initialTargetX);
  });
});
