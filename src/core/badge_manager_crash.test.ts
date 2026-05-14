/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { BadgeManager } from './BadgeManager';
import { Game } from './Game';

describe('BadgeManager Crash Reproduction', () => {
  it('should not throw a TypeError when evaluating achievements', () => {
    // We mock the Game object to avoid complex DOM dependencies in JSDOM
    const game = {
      getScore: () => 10,
      getCombo: () => 6,
      hasTriggeredSupernova: () => false,
      getIsWin: () => false,
    } as unknown as Game;
    
    // We expect this NOT to throw an error since game provides the new getters
    expect(() => {
      BadgeManager.checkAchievements(game);
    }).not.toThrow();
  });
});
