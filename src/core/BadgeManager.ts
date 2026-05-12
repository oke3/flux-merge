/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  criteria: (game: any) => boolean;
  unlocked: boolean;
}

export class BadgeManager {
  private static achievements: Achievement[] = [
    {
      id: 'first-merge',
      name: 'First Spark',
      description: 'Perform your first node merge.',
      criteria: (game) => game.score > 0,
      unlocked: false,
    },
    {
      id: 'combo-king',
      name: 'Combo King',
      description: 'Reach a combo of 5 or more.',
      criteria: (game) => game.getCombo() >= 5,
      unlocked: false,
    },
    {
      id: 'void-master',
      name: 'Void Master',
      description: 'Clean the board with a Supernova.',
      criteria: (game) => game.hasTriggeredSupernova(),
      unlocked: false,
    },
    {
      id: 'singularity',
      name: 'Singularity',
      description: 'Reach the ultimate energy level.',
      criteria: (game) => game.isWin,
      unlocked: false,
    },
  ];

  public static checkAchievements(game: any) {
    this.achievements.forEach(ach => {
      if (!ach.unlocked && ach.criteria(game)) {
        ach.unlocked = true;
        console.log(`🏆 Achievement Unlocked: ${ach.name}`);
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
