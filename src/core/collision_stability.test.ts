import { describe, it, expect, vi } from 'vitest';
import { CollisionSystem, type CollisionHandler } from './CollisionSystem';
import { GameNode } from './GameNode';
import { NodeType } from '../assets/constants';

describe('CollisionSystem Stability', () => {
  it('should prevent chain-reaction merges in a single tick (Stability Check)', () => {
    const collisionSystem = new CollisionSystem();
    
    // Mock handler to track merges
    const handler: CollisionHandler = {
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
      addNode: vi.fn((_node) => {
        // In a real game, this would add to the manager's list
      }),
      removeNodeMesh: vi.fn(),
      getCurrentTheme: () => 'deepSpace',
      updateGridMap: vi.fn(),
      getGridMap: vi.fn(),
      triggerHaptic: vi.fn(),
      logEvent: vi.fn(),
      pulseHUD: vi.fn(),
      triggerFlash: vi.fn(),
      triggerTimeSlow: vi.fn(),
    };

    // 4 nodes of level 1 at the same position
    const nodes = [
      new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD),
      new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD),
      new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD),
      new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD),
    ];

    const gridMap = {
      '1,1': nodes,
    };

    // Execute one tick of collision resolution
    collisionSystem.checkAndResolveMerges(nodes, gridMap, handler);

    // With 4 nodes of lvl 1:
    // First pair merges -> 1 node of lvl 2
    // Second pair merges -> 1 node of lvl 2
    // Total merges = 2.
    // If cascading is disabled, it should NOT merge the two lvl 2 nodes into one lvl 3 node.
    
    // Each merge calls incrementCombo and playMergeSound
    expect(handler.incrementCombo).toHaveBeenCalledTimes(2);
    expect(handler.playMergeSound).toHaveBeenCalledTimes(2);
    
    // Verify we didn't reach level 3 in this tick
    const mergeSoundLevels = (handler.playMergeSound as any).mock.calls.map((call: any[]) => call[0]);
    expect(mergeSoundLevels).not.toContain(3);
    expect(mergeSoundLevels).toEqual([2, 2]);
  });
});
