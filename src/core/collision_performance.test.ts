import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState, NodeType } from '../assets/constants';

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
    loadProfile: () => ({ settings: { theme: 'deepSpace', disableVibration: true }, galaxy: 1 }),
    getAbilityValue: () => 0.05,
    ascendGalaxy: vi.fn(),
    calculateXPGain: vi.fn(() => 10),
    addXP: vi.fn(() => ({ levelUp: false, newLevel: 1 })),
    saveProfile: vi.fn(),
  }
}));

describe('Collision System Performance Analysis', () => {
  let game: any;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas>';
    vi.stubGlobal('navigator', { vibrate: vi.fn() });
    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  const measureCollisionTime = (nodeCount: number) => {
    // 1. Clear and setup nodes
    game.reset();
    const nodes: GameNode[] = [];
    
    // Place nodes far apart to avoid collisions (each in its own cell if possible)
    // Use a larger grid for this test if needed, but let's stick to GAME_CONFIG.GRID_SIZE
    // Actually, let's just place them in a way that they don't collide.
    const spacing = 100; 
    for (let i = 0; i < nodeCount; i++) {
      const x = (i % 20) * spacing;
      const y = Math.floor(i / 20) * spacing;
      const node = new GameNode(x, y, 0, 0, 1, NodeType.STANDARD);
      game.addNode(node);
      nodes.push(node);
    }
    
    // Update grid map manually for the test
    game.updateGridMap();
    
    // 2. Measure time
    const start = performance.now();
    game.collisionSystem.checkAndResolveMerges(game.nodes, game.getGridMap(), game);
    const end = performance.now();
    
    return end - start;
  };

  it('should exhibit O(N) time complexity for non-colliding nodes', () => {
    const n1 = 100;
    const n2 = 1000;
    
    const t1 = measureCollisionTime(n1);
    const t2 = measureCollisionTime(n2);
    
    console.log(`Collision Time for N=${n1}: ${t1.toFixed(4)}ms`);
    console.log(`Collision Time for N=${n2}: ${t2.toFixed(4)}ms`);
    
    const ratio = t2 / t1;
    const expectedRatio = n2 / n1;
    
    // For O(N), ratio should be close to expectedRatio (10)
    // For O(N^2), ratio would be close to expectedRatio^2 (100)
    
    // We allow some overhead, but it should definitely be much less than 100
    expect(ratio).toBeLessThan(expectedRatio * 3); 
    console.log(`Observed Ratio: ${ratio.toFixed(2)}, Expected (O(N)): ${expectedRatio}`);
  });
});
