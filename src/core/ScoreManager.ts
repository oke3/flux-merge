/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { UIManager } from '../ui/UIManager';

/**
 * ScoreManager handles the game scoring, combo system, and high score persistence.
 */
export class ScoreManager {
  private score: number = 0;
  private highScore: number = 0;
  private comboCount: number = 1;
  private comboTimer: number = 0;
  private readonly COMBO_TIMEOUT = 1500;
  private ui: UIManager;

  constructor(ui: UIManager) {
    this.ui = ui;
    this.highScore = parseInt(localStorage.getItem('flux-merge-highscore') || '0');
    this.ui.updateHighScore(this.highScore);
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

  public addScore(points: number): void {
    this.score += points;
    this.ui.updateScore(this.score);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.ui.updateHighScore(this.highScore);
      localStorage.setItem('flux-merge-highscore', this.highScore.toString());
    }
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
    this.ui.updateHighScore(0);
    localStorage.setItem('flux-merge-highscore', '0');
  }

  public reset(): void {
    this.score = 0;
    this.comboCount = 1;
    this.comboTimer = 0;
    this.ui.updateScore(0);
    this.ui.updateCombo(1);
  }
}
