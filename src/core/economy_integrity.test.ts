import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScoreManager } from './ScoreManager';
import { ProfileManager } from './ProfileManager';

describe('Mechanical Integrity: Economy & Progression', () => {
  let scoreManager: ScoreManager;
  let mockUI: any;
  let profile: any;

  beforeEach(() => {
    mockUI = {
      updateScore: vi.fn(),
      updateHighScore: vi.fn(),
      updateCombo: vi.fn(),
      showNotification: vi.fn(),
    };
    scoreManager = new ScoreManager(mockUI);
    profile = {
      xp: 0,
      level: 1,
      galaxy: 1,
      upgrades: {},
      settings: { theme: 'deepSpace' }
    };
  });

  describe('ScoreManager Multipliers', () => {
    it('should use a x1 multiplier for combos 1-2', () => {
      // Combo 1
      expect(scoreManager.getMultiplier()).toBe(1);
      
      // Combo 2
      scoreManager.incrementCombo();
      expect(scoreManager.getMultiplier()).toBe(1);
    });

    it('should increase multiplier every 3 combo increments', () => {
      // Combo 3: 1 + floor(3/3) = 2
      scoreManager.incrementCombo();
      scoreManager.incrementCombo(); 
      expect(scoreManager.getMultiplier()).toBe(2);
    });

    it('should double the multiplier during Fever mode', () => {
      scoreManager.incrementCombo();
      scoreManager.incrementCombo(); // Combo 3, mult = 2
      
      scoreManager.isFever = true;
      expect(scoreManager.getMultiplier()).toBe(4);
    });
  });

  describe('Progression & XP', () => {
    it('should calculate XP gain correctly with and without Nebula', () => {
      const points = 100;
      
      // No nebula: floor((100 / 5) * 1) = 20
      const xpNormal = ProfileManager.calculateXPGain(points, false);
      expect(xpNormal).toBe(20);

      // Nebula: floor((100 / 5) * 1.5) = 30
      const xpNebula = ProfileManager.calculateXPGain(points, true);
      expect(xpNebula).toBe(30);
    });

    it('should trigger level up based on the square root formula', () => {
      // Level = floor(sqrt(XP / 100)) + 1
      // For Level 2, we need sqrt(XP/100) >= 1 => XP >= 100
      const { levelUp, newLevel } = ProfileManager.addXP(profile, 100);
      
      expect(levelUp).toBe(true);
      expect(newLevel).toBe(2);
      expect(profile.level).toBe(2);
    });

    it('should correctly deduct XP when upgrading abilities', () => {
      profile.xp = 1000;
      const abilityId = 'magneticPull';
      
      const initialXP = profile.xp;
      const success = ProfileManager.upgradeAbility(abilityId, profile);
      
      expect(success).toBe(true);
      expect(profile.xp).toBeLessThan(initialXP);
      expect(profile.upgrades[abilityId]).toBe(1);
    });
  });

  describe('Integrated Scoring Flow', () => {
    it('should correctly apply multipliers to final score and trigger XP gain', () => {
      // Setup: Combo 3 (multiplier x2)
      scoreManager.incrementCombo();
      scoreManager.incrementCombo(); 
      
      const basePoints = 100;
      scoreManager.addScore(basePoints, profile, []);

      // Final points = 100 * 2 = 200
      expect(scoreManager.getScore()).toBe(200);
      
      // XP gain = floor((200 / 5) * 1) = 40
      expect(profile.xp).toBe(40);
    });
  });
});
