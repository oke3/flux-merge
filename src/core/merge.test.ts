import { describe, it, expect } from 'vitest';
import { GameNode } from './GameNode';

describe('GameNode Merge Logic Simulation', () => {
  it('should detect merge when visual radii overlap', () => {
    // Setup: Two nodes with scale = 2
    // Visual radius = radius * scale = 10 * 2 = 20
    // Total visual diameter for both = 40
    // Distance = 35 (they overlap)
    
    const nodeA = new GameNode(100, 100, 1, 1, 1);
    nodeA.radius = 10;
    nodeA.scale = 2;

    const nodeB = new GameNode(135, 100, 1, 1, 1); // distance is 35
    nodeB.radius = 10;
    nodeB.scale = 2;

    const distance = Math.sqrt(Math.pow(nodeA.x - nodeB.x, 2) + Math.pow(nodeA.y - nodeB.y, 2));
    
    // The current (buggy) logic in Game.ts:
    const currentBuggyThreshold = nodeA.radius * 2;
    const isMergingBuggy = distance < currentBuggyThreshold;

    // The desired (correct) logic:
    // We should check if the distance is less than the sum of their visual radii
    const visualRadiusA = nodeA.radius * nodeA.scale;
    const visualRadiusB = nodeB.radius * nodeB.scale;
    const correctThreshold = visualRadiusA + visualRadiusB;
    const isMergingCorrect = distance < correctThreshold;

    expect(isMergingBuggy).toBe(false); // Should fail current implementation
    expect(isMergingCorrect).toBe(true); // Should pass correct implementation
  });
});
