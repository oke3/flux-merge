import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityManager } from './EntityManager';
import { GAME_CONFIG } from '../assets/constants';
import { Game } from './Game';


describe('Dynamic Spawning System', () => {
  let entityManager: EntityManager;
  let mockProfile: any;

  beforeEach(() => {
    entityManager = new EntityManager();
    mockProfile = {
      galaxy: 1,
      upgrades: {},
      settings: { theme: 'deepSpace' },
    };
  });

  it('should decrease spawn interval as score increases (increasing difficulty)', () => {
    const score0 = 0;
    const scoreMid = GAME_CONFIG.MAX_DIFFICULTY_SCORE / 2;
    const scoreMax = GAME_CONFIG.MAX_DIFFICULTY_SCORE;

    const interval0 = entityManager.calculateSpawnInterval(mockProfile, score0, false);
    const intervalMid = entityManager.calculateSpawnInterval(mockProfile, scoreMid, false);
    const intervalMax = entityManager.calculateSpawnInterval(mockProfile, scoreMax, false);

    expect(intervalMid).toBeLessThan(interval0);
    expect(intervalMax).toBeLessThan(intervalMid);
    expect(intervalMax).toBeCloseTo(GAME_CONFIG.MIN_SPAWN_INTERVAL, 1);
  });

  it('should decrease spawn interval as galaxy level increases', () => {
    mockProfile.galaxy = 1;
    const intervalG1 = entityManager.calculateSpawnInterval(mockProfile, 0, false);
    
    mockProfile.galaxy = 5;
    const intervalG5 = entityManager.calculateSpawnInterval(mockProfile, 0, false);
    
    expect(intervalG5).toBeLessThan(intervalG1);
  });

  it('should spawn a node when the spawn interval has passed', () => {
    const mockGame = {
      profile: mockProfile,
      scoreManager: { getScore: () => 0 },
      comboManager: { getIsFrenzy: () => false },
      getCurrentTheme: () => 'deepSpace',
      transitionTo: vi.fn(),
    } as unknown as Game;

    entityManager.initGrid();
    const startTime = 1000;
    
    // Force lastSpawnTime to be consistent
    (entityManager as any).lastSpawnTime = startTime - GAME_CONFIG.BASE_SPAWN_INTERVAL;
    (entityManager as any).spawnVariance = 0;

    // Process spawning at startTime
    entityManager.processSpawning(mockGame, startTime);
    
    expect(entityManager.allNodes.length).toBe(1);
    expect((entityManager as any).lastSpawnTime).toBe(startTime);
  });

  it('should NOT spawn a node if the interval has not passed', () => {
    const mockGame = {
      profile: mockProfile,
      scoreManager: { getScore: () => 0 },
      comboManager: { getIsFrenzy: () => false },
      getCurrentTheme: () => 'deepSpace',
      transitionTo: vi.fn(),
    } as unknown as Game;

    entityManager.initGrid();
    const startTime = 1000;
    
    (entityManager as any).lastSpawnTime = startTime - (GAME_CONFIG.BASE_SPAWN_INTERVAL / 2);
    (entityManager as any).spawnVariance = 0;

    entityManager.processSpawning(mockGame, startTime);
    
    expect(entityManager.allNodes.length).toBe(0);
  });
});
