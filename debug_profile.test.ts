import { describe, it, expect } from 'vitest';
import { ProfileManager } from './src/core/ProfileManager';

describe('ProfileManager', () => {
  it('should add XP and level up', () => {
    const profile = {
      xp: 0,
      level: 1,
      galaxy: 1,
      upgrades: {},
      unlockedThemes: ['deepSpace'],
      achievements: [],
      settings: {
        volume: 0.7,
        theme: 'deepSpace',
        muteSfx: false,
        disableVibration: false,
      },
    } as any;

    const result = ProfileManager.addXP(profile, 150);
    expect(result.levelUp).toBe(true);
    expect(profile.level).toBe(2);
    expect(profile.xp).toBe(150);
  });
});
