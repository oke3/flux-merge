import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState } from '../assets/constants';

// Minimal mocks for required dependencies
vi.mock('../ui/UIManager');
vi.mock('../ui/Renderer');
vi.mock('../ui/Input');
vi.mock('../assets/constants', async () => {
  const actual = await vi.importActual('../assets/constants');
  return {
    ...actual,
    GAME_CONFIG: {
      ...(actual.GAME_CONFIG as any),
      CANVAS_SIZE: 800,
      GRID_SIZE: 10,
      NODE_RADIUS: 10,
      PULSE_RADIUS: 50,
      VOID_CONSUMPTION_RADIUS: 30,
    }
  };
});
vi.mock('../core/AudioManager');
vi.mock('../core/ScoreManager', () => ({
  ScoreManager: class {
    getScore = vi.fn(() => 0);
    getCombo = vi.fn(() => 1);
    resetHighScore = vi.fn();
    addScore = vi.fn();
    incrementCombo = vi.fn();
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



describe('Attack A: The Cascade Storm (Merge)', () => {
  let game: any;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas><button id="startBtn"></button>';
    
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));
    vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  it('should handle a high-density cluster of nodes without crashing', () => {
    // Populate game with many nodes in the same area
    for (let i = 0; i < 50; i++) {
      const node = new GameNode(100 + i, 100 + i, 1, 1, 1);
      game.nodes.push(node);
    }

    // Run update multiple times to trigger merges
    expect(() => {
      for (let i = 0; i < 10; i++) {
        game.update();
      }
    }).not.toThrow();
  });

  it('should handle deep merge cascades if possible', () => {
    const initialNodeCount = 5;
    game.nodes = [
      new GameNode(100, 100, 1, 1, 1),
      new GameNode(100, 100, 1, 1, 1),
      new GameNode(100, 100, 1, 1, 1),
      new GameNode(100, 100, 1, 1, 1),
      new GameNode(100, 100, 1, 1, 1),
    ];

    game.update();

    const hasHigherLevelNodes = game.nodes.some((n: any) => n.level > 1);
    const nodeCountDecreased = game.nodes.length < initialNodeCount;
    
    expect(hasHigherLevelNodes || nodeCountDecreased).toBe(true);
  });
});
