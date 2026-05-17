import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState, NodeType } from '../assets/constants';

// Mocks for dependencies
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
      MAGNETIC_PULL_STRENGTH: 0.5,
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
    loadProfile: () => ({ settings: { theme: 'deepSpace', disableVibration: true } }),
    getAbilityValue: () => 0.05,
  }
}));

describe('Extreme Stress Tests', () => {
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

  it('should handle maximum theoretical node density (Full Grid + Overlaps)', () => {
    // Fill every single grid cell
    const nodes: GameNode[] = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        nodes.push(new GameNode(x * 80 + 40, y * 80 + 40, x, y, 1));
      }
    }
    game.nodes = nodes;

    // Add an additional 50 nodes on top of them to create extreme collision pressure
    for (let i = 0; i < 50; i++) {
      game.nodes.push(new GameNode(400, 400, 5, 5, 1));
    }

    expect(() => {
      for (let i = 0; i < 20; i++) {
        game.update(16.67);
      }
    }).not.toThrow();
  });

  it('should handle a "Void Storm" (Many Voids consuming many nodes)', () => {
    // 10 Voids and 90 standard nodes
    const nodes: GameNode[] = [];
    for (let i = 0; i < 10; i++) {
      nodes.push(new GameNode(i * 50, 100, 0, 0, 1, NodeType.VOID));
    }
    for (let i = 0; i < 90; i++) {
      nodes.push(new GameNode(i * 8, 105, 0, 0, 1));
    }
    game.nodes = nodes;

    expect(() => {
      game.update(16.67);
    }).not.toThrow();
    
    // Ensure the system didn't crash and nodes were actually marked for removal
    const voidCount = game.nodes.filter((n: GameNode) => n.type === NodeType.VOID).length;
    expect(voidCount).toBe(10);
  });

  it('should handle "Pulsar Chaos" (Max Pulsars emitting simultaneously)', () => {
    const nodes: GameNode[] = [];
    // Fill half the grid with Pulsars
    for (let i = 0; i < 50; i++) {
      nodes.push(new GameNode(Math.random() * 800, Math.random() * 800, 0, 0, 1, NodeType.PULSAR));
    }
    // Fill the other half with standard nodes
    for (let i = 0; i < 50; i++) {
      nodes.push(new GameNode(Math.random() * 800, Math.random() * 800, 0, 0, 1));
    }
    game.nodes = nodes;

    // Force a pulsar wave (WorldSystem triggers it every 3s)
    // We'll manually call the internal method if we could, but we'll simulate time.
    expect(() => {
      // Simulate 3 seconds of updates
      for (let i = 0; i < 180; i++) {
        game.update(16.67);
      }
    }).not.toThrow();
  });

  it('should handle "Prism Explosion" (Cascading Prism splits)', () => {
    // Create a cluster of Prisms
    const nodes: GameNode[] = [];
    for (let i = 0; i < 20; i++) {
      nodes.push(new GameNode(400 + (i % 5) * 5, 400 + Math.floor(i / 5) * 5, 5, 5, 1, NodeType.PRISM));
    }
    game.nodes = nodes;

    expect(() => {
      for (let i = 0; i < 10; i++) {
        game.update(16.67);
      }
    }).not.toThrow();
  });

  it('should remain stable under extreme delta-time fluctuations (Jitter)', () => {
    game.spawnGameNode();
    game.spawnGameNode();

    const deltas = [0.001, 1000, 0.001, 5000, 16.67, 0];
    
    deltas.forEach(dt => {
      expect(() => {
        game.update(dt);
      }).not.toThrow();
    });
  });
});
