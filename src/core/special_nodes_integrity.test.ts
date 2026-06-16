import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorldSystem } from './WorldSystem';
import { CollisionSystem } from './CollisionSystem';
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

    const gridMap: Record<string, GameNode[]> = {};
    nodes.forEach(n => {
      const key = `${n.gridX},${n.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(n);
    });

    // Set timer to 0 to trigger wave immediately
    (worldSystem as any).pulsarTimer = 0;

    worldSystem.update(nodes, gridMap, mockHandler, profile, 16.67);

    // Target node should be pushed further right (targetX increases)
    expect(targetNode.targetX).toBeGreaterThan(120);
    expect(mockHandler.addRipple).toHaveBeenCalled();
  });

  it('Supernova Node should consume all nodes in its grid-based area of effect', () => {
    const supernova = createNode(100, 100, 1, NodeType.SUPERNOVA);
    const targetNode = createNode(110, 110, 1); // Inside AoE
    const safeNode = createNode(500, 500, 1); // Outside AoE
    nodes.push(supernova, targetNode, safeNode);

    const gridMap: Record<string, GameNode[]> = {};
    nodes.forEach(n => {
      const key = `${n.gridX},${n.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(n);
    });

    worldSystem.update(nodes, gridMap, mockHandler, profile, 16.67);

    expect(targetNode.pendingRemoval).toBe(true);
    expect(safeNode.pendingRemoval).toBe(false);
    expect(mockHandler.addScore).toHaveBeenCalledWith(50);
    expect(worldSystem.supernovaTriggered).toBe(true);
  });

  it('Black Hole should pull nearby nodes towards it', () => {
    const blackHole = createNode(100, 100, 1, NodeType.BLACK_HOLE);
    const targetNode = createNode(150, 100, 1); // To the right
    nodes.push(blackHole, targetNode);

    const gridMap: Record<string, GameNode[]> = {};
    nodes.forEach(n => {
      const key = `${n.gridX},${n.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(n);
    });

    worldSystem.update(nodes, gridMap, mockHandler, profile, 16.67);

    // Target node should be pulled left (targetX decreases)
    expect(targetNode.targetX).toBeLessThan(150);
  });

  it('Resonance Amplifier emits pulse wave to buff nearby standard nodes', () => {
    const resonator = createNode(100, 100, 1, NodeType.RESONANCE);
    const resonantTarget = createNode(120, 100, 1, NodeType.STANDARD); // Within pulse radius
    const safeTarget = createNode(400, 400, 1, NodeType.STANDARD); // Far away
    nodes.push(resonator, resonantTarget, safeTarget);

    const gridMap: Record<string, GameNode[]> = {};
    nodes.forEach(n => {
      const key = `${n.gridX},${n.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(n);
    });

    worldSystem.update(nodes, gridMap, mockHandler, profile, GAME_CONFIG.RESONANCE_CONFIG.PULSE_INTERVAL + 100); // Large deltaTime to trigger pulse

    expect(mockHandler.addRipple).toHaveBeenCalled();
    expect(resonantTarget.isResonant).toBe(true);
    expect(resonantTarget.resonanceTimer).toBe(GAME_CONFIG.RESONANCE_CONFIG.RESONANCE_DURATION);
    expect(safeTarget.isResonant).toBe(false);
    expect(mockHandler.spawnBurst).toHaveBeenCalled();
  });

  it('Two resonant nodes merge to level+2 (skip one level)', () => {
    const collisionSystem = new CollisionSystem();
    const nodeA = new GameNode(100, 100, 1, 1, 3, NodeType.STANDARD);
    const nodeB = new GameNode(110, 110, 1, 1, 3, NodeType.STANDARD);
    // Mark both as resonant (e.g. from a Resonance Amplifier pulse)
    nodeA.isResonant = true;
    nodeB.isResonant = true;

    const mergeHandler = {
      addScore: vi.fn(),
      incrementCombo: vi.fn(),
      triggerFrenzy: vi.fn(),
      playMergeSound: vi.fn(),
      spawnBurst: vi.fn(),
      addRipple: vi.fn(),
      triggerShake: vi.fn(),
      triggerHaptic: vi.fn(),
      spawnNode: vi.fn(),
      transitionToWin: vi.fn(),
      checkAchievements: vi.fn(),
      updateNodeColor: vi.fn(),
      addNode: vi.fn(),
      removeNodeMesh: vi.fn(),
      getCurrentTheme: vi.fn(() => 'deepSpace'),
      updateGridMap: vi.fn(),
      getGridMap: vi.fn(() => ({})),
      logEvent: vi.fn(),
      pulseHUD: vi.fn(),
      triggerFlash: vi.fn(),
      triggerTimeSlow: vi.fn(),
    };

    (collisionSystem as any).mergeGameNodes([nodeA, nodeB], 0, 1, mergeHandler);
    const addedNode = (mergeHandler.addNode as ReturnType<typeof vi.fn>).mock.calls[0][0] as GameNode;

    // Level should be 5 (max 3 + 2) instead of 4 (max 3 + 1)
    expect(addedNode.level).toBe(5);
  });

  it('Non-resonant nodes merge to level+1 normally when only one is resonant', () => {
    const collisionSystem = new CollisionSystem();
    const nodeA = new GameNode(100, 100, 1, 1, 3, NodeType.STANDARD);
    const nodeB = new GameNode(110, 110, 1, 1, 3, NodeType.STANDARD);
    // Only one is resonant — should merge normally
    nodeA.isResonant = true;
    nodeB.isResonant = false;

    const mergeHandler = {
      addScore: vi.fn(),
      incrementCombo: vi.fn(),
      triggerFrenzy: vi.fn(),
      playMergeSound: vi.fn(),
      spawnBurst: vi.fn(),
      addRipple: vi.fn(),
      triggerShake: vi.fn(),
      triggerHaptic: vi.fn(),
      spawnNode: vi.fn(),
      transitionToWin: vi.fn(),
      checkAchievements: vi.fn(),
      updateNodeColor: vi.fn(),
      addNode: vi.fn(),
      removeNodeMesh: vi.fn(),
      getCurrentTheme: vi.fn(() => 'deepSpace'),
      updateGridMap: vi.fn(),
      getGridMap: vi.fn(() => ({})),
      logEvent: vi.fn(),
      pulseHUD: vi.fn(),
      triggerFlash: vi.fn(),
      triggerTimeSlow: vi.fn(),
    };

    (collisionSystem as any).mergeGameNodes([nodeA, nodeB], 0, 1, mergeHandler);
    const addedNode = (mergeHandler.addNode as ReturnType<typeof vi.fn>).mock.calls[0][0] as GameNode;

    // Level should be 4 (max 3 + 1) — normal merge
    expect(addedNode.level).toBe(4);
  });
});
