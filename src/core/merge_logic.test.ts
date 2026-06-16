import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollisionSystem, type CollisionHandler } from './CollisionSystem';
import { GameNode } from './GameNode';
import { NodeType, GAME_CONFIG } from '../assets/constants';

describe('Mechanical Integrity: Merge Truth Table', () => {
  let collisionSystem: CollisionSystem;
  let mockHandler: CollisionHandler;
  let nodes: GameNode[];

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    nodes = [];
    
    // Minimal mock for CollisionHandler to track side effects
    mockHandler = {
      addScore: vi.fn(),
      incrementCombo: vi.fn(),
      triggerFrenzy: vi.fn(),
      playMergeSound: vi.fn(),
      spawnBurst: vi.fn(),
      addRipple: vi.fn(),
      triggerShake: vi.fn(),
      spawnNode: vi.fn(),
      transitionToWin: vi.fn(),
      checkAchievements: vi.fn(),
      updateNodeColor: vi.fn(),
      addNode: (node: GameNode) => nodes.push(node),
      removeNodeMesh: vi.fn(),
      getCurrentTheme: () => 'deepSpace',
      updateGridMap: vi.fn(),
      getGridMap: () => {
        const map: Record<string, GameNode[]> = {};
        nodes.forEach(n => {
          const key = `${n.gridX},${n.gridY}`;
          if (!map[key]) map[key] = [];
          map[key].push(n);
        });
        return map;
      },
      triggerHaptic: vi.fn(),
      logEvent: vi.fn(),
      pulseHUD: vi.fn(),
      triggerFlash: vi.fn(),
      triggerTimeSlow: vi.fn(),
    };
  });

  const createNode = (x: number, y: number, level: number, type: NodeType = NodeType.STANDARD) => {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    return new GameNode(x, y, gx, gy, level, type);
  };

  it('should merge two Level 1 nodes into one Level 2 node', () => {
    const n1 = createNode(100, 100, 1);
    const n2 = createNode(105, 105, 1);
    nodes.push(n1, n2);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    // n1 and n2 should be marked for removal
    expect(n1.pendingRemoval).toBe(true);
    expect(n2.pendingRemoval).toBe(true);
    
    // A new Level 2 node should have been added to the nodes list
    const level2Node = nodes.find(n => n.level === 2);
    expect(level2Node).toBeDefined();
    expect(level2Node?.level).toBe(2);
    
    // Verify the new node is snapped to the center of the grid cell (150, 150)
    expect(level2Node?.x).toBe(150);
    expect(level2Node?.y).toBe(150);
  });

  it('should allow a Star node to merge with any level (Wildcard logic)', () => {
    const star = createNode(100, 100, 1, NodeType.STAR);
    const n3 = createNode(105, 105, 3);
    nodes.push(star, n3);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    expect(star.pendingRemoval).toBe(true);
    expect(n3.pendingRemoval).toBe(true);
    
    // Should result in Level 4
    const level4Node = nodes.find(n => n.level === 4);
    expect(level4Node).toBeDefined();
    expect(level4Node?.level).toBe(4);
  });

  it('should handle Prism splits: merging a Prism results in two nodes of (maxLevel - 1)', () => {
    const prism = createNode(100, 100, 3, NodeType.PRISM);
    const n3 = createNode(105, 105, 3);
    nodes.push(prism, n3);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    expect(prism.pendingRemoval).toBe(true);
    expect(n3.pendingRemoval).toBe(true);
    
    // Prism merge should produce 2 nodes of level 2 (3-1)
    const level2Nodes = nodes.filter(n => n.level === 2);
    expect(level2Nodes.length).toBe(2);
  });

  it('should trigger transitionToWin when merging two Level 5 nodes', () => {
    const n5_1 = createNode(100, 100, 5);
    const n5_2 = createNode(105, 105, 5);
    nodes.push(n5_1, n5_2);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    expect(mockHandler.transitionToWin).toHaveBeenCalled();
  });

  it('should NOT merge nodes of different levels (unless one is a Star)', () => {
    const n1 = createNode(100, 100, 1);
    const n2 = createNode(105, 105, 2);
    nodes.push(n1, n2);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    expect(n1.pendingRemoval).toBe(false);
    expect(n2.pendingRemoval).toBe(false);
    expect(nodes.length).toBe(2);
  });

  it('should not merge Void or Black Hole nodes', () => {
    const voidNode = createNode(100, 100, 1, NodeType.VOID);
    const n1 = createNode(105, 105, 1);
    nodes.push(voidNode, n1);

    collisionSystem.checkAndResolveMerges(nodes, mockHandler.getGridMap(), mockHandler);

    expect(voidNode.pendingRemoval).toBe(false);
    expect(n1.pendingRemoval).toBe(false);
  });
});
