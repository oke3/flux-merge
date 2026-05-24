import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldSystem } from './WorldSystem';
import { GameNode } from './GameNode';
import { NodeType, GAME_CONFIG } from '../assets/constants';

describe('Mechanical Integrity: Special Node Behavior', () => {
  let worldSystem: WorldSystem;
  let mockHandler: any;
  let nodes: GameNode[];
  let profile: any;

  beforeEach(() => {
    worldSystem = new WorldSystem();
    nodes = [];
    profile = {
      galaxy: 1,
      upgrades: {},
      settings: { theme: 'deepSpace' }
    };

    mockHandler = {
      addRipple: vi.fn(),
      spawnBurst: vi.fn(),
      playMergeSound: vi.fn(),
      addScore: vi.fn(),
      triggerShake: vi.fn(),
    };
  });

  const createNode = (x: number, y: number, level: number, type: NodeType = NodeType.STANDARD) => {
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    return new GameNode(x, y, gx, gy, level, type);
  };

  it('Void Node should consume nearby nodes within VOID_CONSUMPTION_RADIUS', () => {
    const voidNode = createNode(100, 100, 1, NodeType.VOID);
    const targetNode = createNode(110, 110, 1); // Within radius
    const safeNode = createNode(300, 300, 1); // Far away
    nodes.push(voidNode, targetNode, safeNode);

    const gridMap: Record<string, GameNode[]> = {};
    nodes.forEach(n => {
      const key = `${n.gridX},${n.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(n);
    });

    worldSystem.update(nodes, gridMap, mockHandler, profile, 16.67);

    expect(targetNode.pendingRemoval).toBe(true);
    expect(safeNode.pendingRemoval).toBe(false);
    expect(mockHandler.addRipple).toHaveBeenCalled();
  });

  it('Pulsar Node should repel nearby nodes away from its center', () => {
    const pulsar = createNode(100, 100, 1, NodeType.PULSAR);
    const targetNode = createNode(120, 100, 1); // To the right
    nodes.push(pulsar, targetNode);

    // Set timer to 0 to trigger wave immediately
    (worldSystem as any).pulsarTimer = 0;

    worldSystem.update(nodes, {}, mockHandler, profile, 16.67);

    // Target node should be pushed further right (targetX increases)
    expect(targetNode.targetX).toBeGreaterThan(120);
    expect(mockHandler.addRipple).toHaveBeenCalled();
  });

  it('Supernova Node should consume all nodes in its grid-based area of effect', () => {
    const supernova = createNode(100, 100, 1, NodeType.SUPERNOVA);
    const targetNode = createNode(110, 110, 1); // Inside AoE
    const safeNode = createNode(500, 500, 1); // Outside AoE
    nodes.push(supernova, targetNode, safeNode);

    worldSystem.update(nodes, {}, mockHandler, profile, 16.67);

    expect(targetNode.pendingRemoval).toBe(true);
    expect(safeNode.pendingRemoval).toBe(false);
    expect(mockHandler.addScore).toHaveBeenCalledWith(50);
    expect(worldSystem.supernovaTriggered).toBe(true);
  });

  it('Black Hole should pull nearby nodes towards it', () => {
    const blackHole = createNode(100, 100, 1, NodeType.BLACK_HOLE);
    const targetNode = createNode(150, 100, 1); // To the right
    nodes.push(blackHole, targetNode);

    worldSystem.update(nodes, {}, mockHandler, profile, 16.67);

    // Target node should be pulled left (targetX decreases)
    expect(targetNode.targetX).toBeLessThan(150);
  });
});
