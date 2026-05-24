import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState, NodeType } from '../assets/constants';

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

    // 2. Simulate a massive jump in time (e.g., 5 seconds)
    currentTime += 5000;

    // 3. Update game
    expect(() => {
      game.update();
    }).not.toThrow();

    // Check if nodes are still within reasonable bounds
    game.nodes.forEach((node: any) => {
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

  it('should yield identical results regardless of frame rate (determinism)', () => {
    // 1. Setup
    const game60 = new Game();
    game60.transitionTo(GameState.PLAYING);
    const node60 = new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD);
    game60.addNode(node60);
    
    for (let i = 0; i < 60; i++) {
      game60.update(1000 / 60);
    }
    const pos60 = { x: node60.x, y: node60.y };

    // Simulation 2: 10fps (Laggy)
    const game10 = new Game();
    game10.transitionTo(GameState.PLAYING);
    const node10 = new GameNode(100, 100, 1, 1, 1, NodeType.STANDARD);
    game10.addNode(node10);
    
    for (let i = 0; i < 10; i++) {
      game10.update(100);
    }
    const pos10 = { x: node10.x, y: node10.y };

    expect(pos60.x).toBeCloseTo(pos10.x, 5);
    expect(pos60.y).toBeCloseTo(pos10.y, 5);
  });

  it('should cap physics updates to prevent the Spiral of Death during lag spikes', () => {
    const spy = vi.spyOn(game, 'update');
    
    // 1. Simulate a huge time jump (e.g., 1 second = 60 frames)
    currentTime += 1000;
    
    // 2. Trigger the loop manually
    (game as any).gameLoop();
    
    // 3. Verify that update was called at most MAX_UPDATES_PER_FRAME times
    expect(spy.mock.calls.length).toBeLessThanOrEqual(5);
  });

});
