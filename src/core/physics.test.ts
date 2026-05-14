import { describe, it, expect, beforeEach } from 'vitest';
import { Physics } from './Physics';
import { GameNode } from './GameNode';
import { GAME_CONFIG } from '../assets/constants';

describe('Flux Merge Core Physics', () => {
  let nodeA: GameNode;
  let nodeB: GameNode;

  beforeEach(() => {
    // Setup two nodes of the same level
    nodeA = new GameNode(100, 100, 1, 1, 1);
    nodeB = new GameNode(120, 100, 2, 1, 1);
  });

  it('should apply magnetic pull to nodes of the same level', () => {
    const initialTargetX_A = nodeA.targetX;
    const initialTargetX_B = nodeB.targetX;

    Physics.applyMagneticPull(nodeA, [nodeB]);

    // nodeA should move towards nodeB (increase X)
    expect(nodeA.targetX).toBeGreaterThan(initialTargetX_A);
    // nodeB should move towards nodeA (decrease X)
    expect(nodeB.targetX).toBeLessThan(initialTargetX_B);
  });

  it('should NOT apply magnetic pull to nodes of different levels', () => {
    nodeB.level = 2;
    const initialTargetX_A = nodeA.targetX;

    Physics.applyMagneticPull(nodeA, [nodeB]);

    expect(nodeA.targetX).toBe(initialTargetX_A);
  });

  it('should NOT apply magnetic pull when a node is being dragged', () => {
    nodeA.isDragging = true;
    const initialTargetX_B = nodeB.targetX;

    Physics.applyMagneticPull(nodeA, [nodeB]);

    expect(nodeB.targetX).toBe(initialTargetX_B);
  });

  it('should snap node to the nearest grid center', () => {
    // Place node slightly off-center
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    nodeA.x = cellSize * 1.1; 
    nodeA.y = cellSize * 1.1;

    Physics.snapToGrid(nodeA);

    expect(nodeA.targetX).toBe(cellSize * 1 + cellSize / 2);
    expect(nodeA.targetY).toBe(cellSize * 1 + cellSize / 2);
    expect(nodeA.gridX).toBe(1);
    expect(nodeA.gridY).toBe(1);
  });

  it('should clamp snapToGrid to boundaries', () => {
    nodeA.x = -100;
    nodeA.y = -100;
    Physics.snapToGrid(nodeA);
    expect(nodeA.gridX).toBe(0);
    expect(nodeA.gridY).toBe(0);

    nodeA.x = GAME_CONFIG.CANVAS_SIZE + 100;
    nodeA.y = GAME_CONFIG.CANVAS_SIZE + 100;
    Physics.snapToGrid(nodeA);
    expect(nodeA.gridX).toBe(GAME_CONFIG.GRID_SIZE - 1);
    expect(nodeA.gridY).toBe(GAME_CONFIG.GRID_SIZE - 1);
  });
});
