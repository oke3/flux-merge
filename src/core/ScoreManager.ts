/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { UIManager } from '../ui/UIManager';
import { ProfileManager, type UserProfile } from './ProfileManager';
import { GameNode } from './GameNode';
import { NodeType } from '../assets/constants';

/**
 * ScoreManager handles the game scoring, combo system, and high score persistence.
 */
export class ScoreManager {
  private score: number = 0;
  private highScore: number = 0;
  private comboCount: number = 1;
  private comboTimer: number = 0;
  public readonly COMBO_TIMEOUT = 1800;
  public isFever: boolean = false;
  private ui: UIManager;

  constructor(ui: UIManager) {
    this.ui = ui;
    this.highScore = parseInt(localStorage.getItem('flux-merge-highscore') || '0');
  }

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getCombo(): number {
    return this.comboCount;
  }

  public getMultiplier(): number {
    const baseMultiplier = 1 + Math.floor(this.comboCount / 3);
    return this.isFever ? baseMultiplier * 2 : baseMultiplier;
  }

  public getComboTimer(): number {
    return this.comboTimer;
  }

  public updateComboTimer(deltaTime: number): void {
    if (this.comboTimer > 0) {
      this.comboTimer -= deltaTime;
      if (this.comboTimer <= 0) {
        this.comboCount = 1;
        this.ui.updateCombo(this.comboCount);
      }
    }
  }

  public addScore(points: number, profile: UserProfile, nodes: GameNode[]): void {
    const hasNebula = nodes.some(n => n.type === NodeType.NEBULA);
    const multiplier = this.getMultiplier();
    const finalPoints = points * multiplier;
    this.score += finalPoints;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      try { localStorage.setItem('flux-merge-highscore', this.highScore.toString()); }
      catch (e) { console.warn('[ScoreManager] Failed to save high score:', e); }
    }
    
    // Process XP Gain
    const xpGain = ProfileManager.calculateXPGain(finalPoints, hasNebula);
    const { levelUp, newLevel } = ProfileManager.addXP(profile, xpGain);
    
    if (levelUp) {
      this.ui.showNotification(`LEVEL UP: ${newLevel}`);
    }
    
    ProfileManager.saveProfile(profile);
  }

  public incrementCombo(): void {
    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT;
    this.ui.updateCombo(this.comboCount);
  }

  public resetCombo(): void {
    this.comboCount = 1;
    this.comboTimer = 0;
    this.ui.updateCombo(this.comboCount);
  }

  public resetHighScore(): void {
    this.highScore = 0;
    try { localStorage.setItem('flux-merge-highscore', '0'); }
    catch (e) { console.warn('[ScoreManager] Failed to reset high score:', e); }
  }

  public reset(): void {
    this.score = 0;
    this.comboCount = 1;
    this.comboTimer = 0;
    this.ui.updateCombo(1);
  }
}
