import { describe, it, expect } from 'vitest';
import { Physics } from './Physics';
import { GameNode } from './GameNode';

describe('Physics Bug Reproduction', () => {
  it('should not apply magnetic pull twice for the same pair of nodes', () => {
    // Setup: two nodes of the same level
    const nodeA = new GameNode(100, 100, 1, 1, 1);
    const nodeB = new GameNode(110, 100, 1, 1, 1);

    const initialTargetX_A = nodeA.targetX;

    // In the current buggy implementation in Game.ts:
    // The loop iterates over all nodes, and for each node, it checks its neighbors.
    // For a pair (A, B), when nodeA is the 'current' node, B is in its neighbors, so pull is applied.
    // When nodeB is the 'current' node, A is in its neighbors, so pull is applied AGAIN.
    
    // Simulation of the current buggy behavior:
    // Pass 1: nodeA is current, nodeB is neighbor
    Physics.applyMagneticPull(nodeA, [nodeB]);
    // Pass 2: nodeB is current, nodeA is neighbor
    Physics.applyMagneticPull(nodeB, [nodeA]);

    const totalMoveA = Math.abs(nodeA.targetX - initialTargetX_A);

    // A single call should have moved them:
    const singleCallA = new GameNode(100, 100, 1, 1, 1);
    const singleCallB = new GameNode(110, 100, 1, 1, 1);
    Physics.applyMagneticPull(singleCallA, [singleCallB]);
    const singleMoveA = Math.abs(singleCallA.targetX - 100);

    // With the fix, processing symmetrically should result in exactly 1x the single movement for node A
    expect(totalMoveA).toBeCloseTo(singleMoveA, 5);
  });
});
