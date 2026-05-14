/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { ProfileManager } from './ProfileManager';

import { Game } from './Game';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: (game: Game) => boolean;
  unlocked: boolean;
  reward?: string; // Theme ID or Ability ID
}

export class BadgeManager {
  private static achievements: Achievement[] = [
    {
      id: 'first-merge',
      name: 'First Spark',
      description: 'Perform your first node merge.',
      criteria: (game) => game.getScore() > 0,
      unlocked: false,
    },
    {
      id: 'combo-king',
      name: 'Combo King',
      description: 'Reach a combo of 5 or more.',
      criteria: (game) => game.getCombo() >= 5,
      unlocked: false,
      reward: 'neonNight',
    },
    {
      id: 'void-master',
      name: 'Void Master',
      description: 'Clean the board with a Supernova.',
      criteria: (game) => game.hasTriggeredSupernova(),
      unlocked: false,
      reward: 'solarFlare',
    },
    {
      id: 'singularity',
      name: 'Singularity',
      description: 'Reach the ultimate energy level.',
      criteria: (game) => game.getIsWin(),
      unlocked: false,
    },
  ];

  public static checkAchievements(game: Game) {
    this.achievements.forEach(ach => {
      if (!ach.unlocked && ach.criteria(game)) {
        ach.unlocked = true;
        console.log(`🏆 Achievement Unlocked: ${ach.name}`);
        
        if (ach.reward) {
          console.log(`🎁 Reward Unlocked: ${ach.reward}`);
          const profile = ProfileManager.loadProfile();
          ProfileManager.unlockTheme(profile, ach.reward);
          ProfileManager.saveProfile(profile);
        }
        
        window.dispatchEvent(new CustomEvent('achievementUnlocked', { detail: ach }));
      }
    });
  }

  public static getUnlocked() {
    return this.achievements.filter(a => a.unlocked);
  }

  public static getAll() {
    return this.achievements;
  }
}
