import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
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
      CANVAS_SIZE: 800,
      GRID_SIZE: 10,
      NODE_RADIUS: 10,
      PULSE_RADIUS: 50,
      VOID_CONSUMPTION_RADIUS: 30,
    }
  };
});
vi.mock('../core/AudioManager');
vi.mock('../core/ScoreManager');
vi.mock('../core/ParticleSystem');
vi.mock('../core/Ripple');
vi.mock('../core/StorageManager');
vi.mock('../core/BadgeManager');
vi.mock('../core/ProfileManager', () => ({
  ProfileManager: {
    loadProfile: () => ({ settings: { theme: 'deepSpace' } }),
    getAbilityValue: () => 0.05,
  }
}));

describe('Attack C: The Temporal Fracture (Timing)', () => {
  let game: any;
  let currentTime = 0;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas><button id="startBtn"></button>';
    
    currentTime = 0;
    vi.stubGlobal('performance', { now: vi.fn(() => currentTime) });
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  it('should handle massive delta-time spikes without exploding', () => {
    // 1. Spawn initial nodes
    game.spawnGameNode();
    const initialNodes = [...game.nodes];

    // 2. Simulate a massive jump in time (e.g., 5 seconds)
    currentTime += 5000;

    // 3. Update game
    expect(() => {
      game.update();
    }).not.toThrow();

    // Check if nodes are still within reasonable bounds
    game.nodes.forEach(node => {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(800);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(800);
    });
  });

  it('should handle extremely small delta-times (near zero)', () => {
    game.spawnGameNode();
    
    // 1. Simulate almost no time passing
    currentTime += 0.00001;

    expect(() => {
      game.update();
    }).not.toThrow();
  });
});
