import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Game } from './Game';
import { GameNode } from './GameNode';
import { GameState, NodeType } from '../assets/constants';

// Minimal mocks for required dependencies
vi.mock('../ui/UIManager');
vi.mock('../ui/Renderer');
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


describe('Special Nodes & Complex Interactions', () => {
  let game: any;

  beforeEach(() => {
    document.body.innerHTML = '<canvas id="gameCanvas"></canvas><button id="startBtn"></button>';
    
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));
    vi.stubGlobal('performance', { now: vi.fn(() => 0) });
    vi.stubGlobal('navigator', { vibrate: vi.fn() });

    game = new Game();
    game.transitionTo(GameState.PLAYING);
  });

  it('should handle Prism split when grid is nearly full', () => {
    // Fill grid almost completely
    const nodes: GameNode[] = [];
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        if (x === 5 && y === 5) continue; // Leave one spot
        nodes.push(new GameNode(x * 80 + 40, y * 80 + 40, x, y, 1));
      }
    }
    game.nodes = nodes;

    // Add a Prism and another node to trigger split
    const prism = new GameNode(5 * 80 + 40, 5 * 80 + 40, 5, 5, 1, NodeType.PRISM);
    const other = new GameNode(5 * 80 + 42, 5 * 80 + 42, 5, 5, 1);
    game.nodes.push(prism, other);

    expect(() => {
      game.update(16.67);
    }).not.toThrow();

    // Prism split creates 2 nodes. If only 1 spot was left, it should still handle it 
    // without crashing, potentially overlapping or picking 0,0 as per implementation.
    expect(game.nodes.length).toBeGreaterThan(0);
  });

  it('should handle Void consumption of multiple nodes', () => {
    const voidNode = new GameNode(100, 100, 1, 1, 1, NodeType.VOID);
    const target1 = new GameNode(105, 105, 1, 1, 1);
    const target2 = new GameNode(95, 95, 1, 1, 1);
    
    game.nodes = [voidNode, target1, target2];

    game.update(16.67);

    // Both targets should be marked for removal
    expect(target1.pendingRemoval).toBe(true);
    expect(target2.pendingRemoval).toBe(true);
    expect(voidNode.pendingRemoval).toBe(false);
  });

  it('should trigger Supernova and clear nearby nodes', () => {
    const supernova = new GameNode(400, 400, 5, 5, 5, NodeType.SUPERNOVA);
    const nearby1 = new GameNode(410, 410, 5, 5, 1);
    const nearby2 = new GameNode(390, 390, 4, 4, 1);
    const farAway = new GameNode(100, 100, 1, 1, 1);

    game.nodes = [supernova, nearby1, nearby2, farAway];

    game.update(16.67);

    expect(nearby1.pendingRemoval).toBe(true);
    expect(nearby2.pendingRemoval).toBe(true);
    expect(farAway.pendingRemoval).toBe(false);
  });

  it('should resolve complex merge cascades (A+B -> C, C+D -> E)', () => {
    // Setup nodes such that A and B merge into C, and then C is close enough to D to merge into E
    // All must be level 1 for first merge, then the result (level 2) must merge with D (level 2)
    
    const nodeA = new GameNode(100, 100, 1, 1, 1);
    const nodeB = new GameNode(105, 105, 1, 1, 1);
    const nodeD = new GameNode(110, 110, 1, 1, 2); // Level 2 to merge with resulting C

    game.nodes = [nodeA, nodeB, nodeD];

    game.update(16.67);
    // First merge: A + B -> C (level 2)
    
    game.update(16.67);
    // Second merge: C + D -> E (level 3)
    
    console.log('Nodes after update:', game.nodes.map((n: any) => ({ level: n.level, x: n.x, y: n.y })));

    // After 1 frame, A and B should merge to create a level 2 node.
    // That level 2 node should then merge with D to create a level 3 node.
    const hasLevel3 = game.nodes.some((n: GameNode) => n.level === 3);
    expect(hasLevel3).toBe(true);
    expect(game.nodes.length).toBe(1);
  });
});
