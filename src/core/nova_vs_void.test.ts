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
    };
  });

  it('should repel nearby nodes during a Nova pulse', () => {
    const nova = new LuminousNova(400, 400, 20, 20);
    const target = new GameNode(420, 400, 21, 20, 1);
    
    // Force Nova into pulse state
    nova.pulsePhase = 'SWELL';
    nova.currentPulseRadius = 50;
    
    const nodes = [nova, target];

    const gridMap: Record<string, GameNode[]> = {
      '20,20': [nova],
      '21,20': [target],
    };

    const initialTargetX = target.targetX;
    
    collisionSystem.handleNovaInteractions(nodes, gridMap, handler);

    // Target should be pushed away from Nova (x=400) towards positive x (x=420)
    expect(target.targetX).toBeGreaterThan(initialTargetX);
  });

  it('should trigger refraction when Nova protects a node from Void consumption', () => {
    const nova = new LuminousNova(400, 400, 20, 20);
    const voidNode = new GameNode(450, 400, 22, 20, 1);
    voidNode.type = NodeType.VOID;
    
    const target = new GameNode(420, 400, 21, 20, 2);
    
    // Scenario: Void has already marked target for removal
    target.pendingRemoval = true;

    const nodes = [nova, voidNode, target];
    const gridMap: Record<string, GameNode[]> = {
      '20,20': [nova],
      '22,20': [voidNode],
      '21,20': [target],
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
    const nova = new LuminousNova(400, 400, 20, 20);
    const target = new GameNode(600, 600, 30, 30, 1);
    
    nova.pulsePhase = 'SWELL';
    nova.currentPulseRadius = 50;
    
    const nodes = [nova, target];

    const gridMap: Record<string, GameNode[]> = {
      '20,20': [nova],
      '30,30': [target],
    };

    const initialTargetX = target.targetX;
    collisionSystem.handleNovaInteractions(nodes, gridMap, handler);

    expect(target.targetX).toBe(initialTargetX);
  });
});
