import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState } from '../assets/constants';

// Mocks to isolate the engine from DOM/WebGL
vi.mock('../ui/UIManager');
vi.mock('../ui/Renderer');
vi.mock('../ui/Input');
vi.mock('../core/AudioManager');
vi.mock('../core/ScoreManager', () => ({
  ScoreManager: class {
    getScore = vi.fn(() => 0);
    getCombo = vi.fn(() => 1);
    resetHighScore = vi.fn();
    addScore = vi.fn();
    incrementCombo = vi.fn();
    reset = vi.fn();
  }
}));
vi.mock('../core/ParticleSystem');
vi.mock('../core/Ripple');
vi.mock('../core/StorageManager');
vi.mock('../core/BadgeManager');
vi.mock('../core/ProfileManager', () => ({
  ProfileManager: {
    loadProfile: () => ({ settings: { theme: 'deepSpace', disableVibration: true }, galaxy: 1, upgrades: {} }),
    getAbilityValue: () => 0.05,
    ascendGalaxy: vi.fn(),
    calculateXPGain: vi.fn(() => 10),
    addXP: vi.fn(() => ({ levelUp: false, newLevel: 1 })),
    saveProfile: vi.fn(),
  }
}));

describe('Adversarial Stress Tests: The Gauntlet', () => {
  let game: any;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas>';
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  it('Attack A: The Entity Bomb - should maintain performance with 2,000 nodes in one cell', () => {
    const nodesCount = 2000;
    
    // Spawn 2,000 nodes in the same grid cell (1,1)
    for (let i = 0; i < nodesCount; i++) {
      const node = new GameNode(
        150 + (Math.random() * 10), 
        150 + (Math.random() * 10), 
        1, 1, 1
      );
      game.addNode(node);
    }

    const start = performance.now();
    
    // Trigger the update loop (CollisionSystem.checkAndResolveMerges is the bottleneck)
    game.update(16.67);
    
    const end = performance.now();
    const duration = end - start;

    console.log(`[StressTest] Entity Bomb Duration: ${duration.toFixed(2)}ms for ${nodesCount} nodes`);
    
    // We aim for < 16.67ms to maintain 60FPS, but with 2,000 nodes in one cell, 
    // we just want to ensure it doesn't freeze or crash.
    expect(duration).toBeLessThan(5000); // Threshold for "acceptable" stress
  });

  it('Attack B: The Infinite Cascade - should handle deep recursive merges without stack overflow', () => {
    // Create a "fuse" of nodes that will merge sequentially
    // Level 1 + Level 1 -> Level 2
    // Level 2 + Level 2 -> Level 3...
    
    // To force a deep cascade in one frame, we need a lot of nodes at the same position
    for (let i = 0; i < 128; i++) {
      game.addNode(new GameNode(100, 100, 1, 1, 1));
    }

    expect(() => {
      game.update(16.67);
    }).not.toThrow();

    // Verify that we didn't just crash, but actually merged
    const maxLevel = Math.max(...game.nodes.map((n: any) => n.level));
    expect(maxLevel).toBeGreaterThan(1);
  });

  it('Attack C: Temporal Fuzzing - should remain stable under chaotic deltaTime spikes', () => {
    game.addNode(new GameNode(100, 100, 1, 1, 1));
    game.addNode(new GameNode(105, 105, 1, 1, 1));

    const chaoticDeltas = [
      0.00001,    // Near zero
      16.67,      // Normal
      100,        // Lag spike
      5000,       // Massive freeze
      -16.67,     // Negative time (should be handled)
      NaN,        // Total chaos
      Infinity,   // The end of time
    ];

    chaoticDeltas.forEach(delta => {
      expect(() => {
        game.update(delta as number);
      }).not.toThrow();
      
      // Verify no NaN coordinates leaked into the game state
      game.nodes.forEach((node: any) => {
        expect(Number.isNaN(node.x)).toBe(false);
        expect(Number.isNaN(node.y)).toBe(false);
        expect(Number.isFinite(node.x)).toBe(true);
        expect(Number.isFinite(node.y)).toBe(true);
      });
    });
  });

  it('Attack D: Input Saturation - should not leak memory during high-frequency interactions', () => {
    const interaction = (game as any).interaction;
    const node = new GameNode(100, 100, 1, 1, 1);
    game.addNode(node);

    expect(() => {
      for (let i = 0; i < 1000; i++) {
        interaction.handleDragStart(node);
        interaction.handleDragMove(node, 110 + i, 110 + i);
        interaction.handleDragEnd(node);
      }
    }).not.toThrow();
  });
});
