import { describe, it, expect } from 'vitest';
import { Physics } from './Physics';
import { GameNode } from './GameNode';

describe('Attack B: The Singularity (Physics)', () => {
  it('should not produce NaN or Infinity when nodes are at near-zero distance', () => {
    const nodeA = new GameNode(100, 100, 5, 5, 1);
    const nodeB = new GameNode(100.0000000001, 100, 5, 5, 1); // Extremely close

    // Test Magnetic Pull
    // We need to mock the strength multiplier
    Physics.applyMagneticPull(nodeA, [nodeB], 1);

    expect(Number.isNaN(nodeA.targetX)).toBe(false);
    expect(Number.isNaN(nodeA.targetY)).toBe(false);
    expect(Number.isFinite(nodeA.targetX)).toBe(true);
    expect(Number.isFinite(nodeA.targetY)).toBe(true);

    // Test Repulsion
    Physics.applyRepulsion(nodeA, nodeB.x, nodeB.y, 100);

    expect(Number.isNaN(nodeA.targetX)).toBe(false);
    expect(Number.isNaN(nodeA.targetY)).toBe(false);
    expect(Number.isFinite(nodeA.targetX)).toBe(true);
    expect(Number.isFinite(nodeA.targetY)).toBe(true);
  });

  it('should handle zero distance gracefully in applyRepulsion', () => {
    const nodeA = new GameNode(100, 100, 5, 5, 1);
    
    // Exactly the same position
    Physics.applyRepulsion(nodeA, 100, 100, 100);

    expect(Number.isNaN(nodeA.targetX)).toBe(false);
    expect(Number.isNaN(nodeA.targetY)).toBe(false);
    expect(Number.isFinite(nodeA.targetX)).toBe(true);
    expect(Number.isFinite(nodeA.targetY)).toBe(true);
  });
});
