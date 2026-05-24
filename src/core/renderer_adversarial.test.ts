import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameState } from '../assets/constants';
import { Renderer } from '../ui/Renderer';
import { ThreeRenderer } from '../ui/ThreeRenderer';

// Minimal mocks for required dependencies
vi.mock('../ui/UIManager');
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


// Mock the renderers correctly as classes
vi.mock('../ui/Renderer', () => {
  return {
    Renderer: class {
      clear = vi.fn();
      drawBackground = vi.fn();
      drawGrid = vi.fn();
      drawGameNode = vi.fn();
      drawRipple = vi.fn();
      drawParticles = vi.fn();
      applyShake = vi.fn();
      resetShake = vi.fn();
    }
  };
});

vi.mock('../ui/ThreeRenderer', () => {
  return {
    ThreeRenderer: class {
      clear = vi.fn();
      drawBackground = vi.fn();
      drawGrid = vi.fn();
      drawGameNode = vi.fn();
      drawRipple = vi.fn();
      drawParticles = vi.fn();
      applyShake = vi.fn();
      resetShake = vi.fn();
    }
  };
});

describe('Attack D: The Rendering Desync', () => {
  let game: any;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas><button id="startBtn"></button>';
    vi.stubGlobal('requestAnimationFrame', vi.fn());
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) });
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  it('should maintain logical state consistency when switching renderers', () => {
    // 1. Add some nodes to the game
    game.spawnGameNode();
    game.spawnGameNode();
    const initialNodeCount = game.nodes.length;
    const initialNodePositions = game.nodes.map((n: any) => ({ x: n.x, y: n.y }));

    // 2. Simulate rapid renderer switching
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) {
        game.renderer = new Renderer('gameCanvas');
      } else {
        game.renderer = new ThreeRenderer('gameCanvas');
      }
      
      game.update();
    }

    // 3. Verify logical state (nodes) hasn't changed unexpectedly
    expect(game.nodes.length).toBe(initialNodeCount);
    for (let i = 0; i < initialNodeCount; i++) {
      expect(Math.abs(game.nodes[i].x - initialNodePositions[i].x)).toBeLessThan(5);
      expect(Math.abs(game.nodes[i].y - initialNodePositions[i].y)).toBeLessThan(5);
    }
  });
});
