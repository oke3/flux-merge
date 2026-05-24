/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { ABILITIES, type UserProfile } from '../assets/constants';
import { UserProfileSchema } from './schemas';

export type { UserProfile };

export class ProfileManager {
  private static readonly PROFILE_KEY = 'flux-merge-user-profile';

  private static defaultProfile(): UserProfile {
    return {
      xp: 0,
      level: 1,
      galaxy: 1,
      upgrades: {
        magneticPull: 0,
        frenzyDuration: 0,
        specialChance: 0,
      },
      unlockedThemes: ['deepSpace'],
      achievements: [],
      settings: {
        volume: 0.7,
        theme: 'deepSpace',
        muteSfx: false,
        disableVibration: false,
      },
    };
  }

  public static loadProfile(): UserProfile {
    const saved = localStorage.getItem(this.PROFILE_KEY);
    if (!saved) return this.defaultProfile();
    try {
      return UserProfileSchema.parse(JSON.parse(saved));
    } catch (e) {
      console.error('[ProfileManager] Failed to load profile or schema violation, resetting...', e);
      return this.defaultProfile();
    }
  }

  public static saveProfile(profile: UserProfile) {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profile));
  }

  public static resetProfile() {
    localStorage.removeItem(this.PROFILE_KEY);
    return this.defaultProfile();
  }

  public static deleteProfile() {
    localStorage.removeItem(this.PROFILE_KEY);
  }

  public static unlockTheme(profile: UserProfile, themeId: string) {
    if (!profile.unlockedThemes.includes(themeId)) {
      profile.unlockedThemes.push(themeId);
      return true;
    }
    return false;
  }

  public static calculateXPGain(points: number, hasNebula: boolean): number {
    let xpMultiplier = 1;
    if (hasNebula) {
      xpMultiplier = 1.5;
    }
    return Math.floor((points / 5) * xpMultiplier);
  }

  public static addXP(profile: UserProfile, amount: number): { levelUp: boolean; newLevel: number } {

    profile.xp += amount;
    
    // Simple leveling formula: Level = floor(sqrt(XP / 100)) + 1
    const newLevel = Math.floor(Math.sqrt(profile.xp / 100)) + 1;
    const levelUp = newLevel > profile.level;
    
    profile.level = newLevel;
    return { levelUp, newLevel };
  }

  public static getAbilityValue(abilityId: string, profile: UserProfile): number {
    const ability = ABILITIES[abilityId];
    const level = profile.upgrades[abilityId] || 0;
    
    if (!ability) return 0;

    // Scale value based on level
    // For magneticPull and specialChance, we add a percentage of baseValue per level
    // For frenzyDuration, we add a flat increase
    if (abilityId === 'frenzyDuration') {
      return ability.baseValue + (level * 1000);
    }
    
    return ability.baseValue * (1 + level * 0.2);
  }

  public static canUpgrade(abilityId: string, profile: UserProfile): boolean {
    const ability = ABILITIES[abilityId];
    const level = profile.upgrades[abilityId] || 0;
    
    if (!ability || level >= ability.maxLevel) return false;
    
    return profile.xp >= ability.costPerLevel(level);
  }

  public static upgradeAbility(abilityId: string, profile: UserProfile): boolean {
    if (!this.canUpgrade(abilityId, profile)) return false;
    
    const ability = ABILITIES[abilityId];
    const level = profile.upgrades[abilityId] || 0;
    
    profile.xp -= ability.costPerLevel(level);
    profile.upgrades[abilityId] = level + 1;
    
    return true;
  }

  public static ascendGalaxy(profile: UserProfile) {
    profile.galaxy += 1;
    // Bonus: increment cosmic luck
    profile.upgrades.specialChance = (profile.upgrades.specialChance || 0) + 1;
    this.saveProfile(profile);
  }
}
