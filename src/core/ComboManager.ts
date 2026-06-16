// SPDX-License-Identifier: Proprietary
import { ScoreManager } from './ScoreManager';
import { UIManager } from '../ui/UIManager';
import { AudioManager } from './AudioManager';

export class ComboManager {
  private isFrenzy: boolean = false;
  private frenzyTimer: number = 0;
  private nodesMergedThisStep: number = 0;
  private tutorialStep: number = 0;
  private scoreManager: ScoreManager;
  private ui: UIManager;
  private audioManager: AudioManager;

  constructor(scoreManager: ScoreManager, ui: UIManager, audioManager: AudioManager) {
    this.scoreManager = scoreManager;
    this.ui = ui;
    this.audioManager = audioManager;
  }

  public getIsFrenzy(): boolean {
    return this.isFrenzy;
  }

  public triggerFrenzy(duration: number) {
    this.isFrenzy = true;
    this.frenzyTimer = duration;
    this.scoreManager.isFever = true;
    this.ui.showNotification('FEVER MODE!');
    this.audioManager.triggerFrenzyAudio();
  }

  public incrementCombo() {
    this.scoreManager.incrementCombo();
    if (this.scoreManager.getCombo() >= 5 && !this.isFrenzy) {
      this.triggerFrenzy(10000);
    }
    this.handleTutorialProgress();
  }

  private handleTutorialProgress() {
    this.nodesMergedThisStep++;
    if (this.tutorialStep === 0 && this.nodesMergedThisStep >= 1) {
      this.ui.showGuide('Great! Now try to merge another set of nodes to reach Level 3.');
      this.tutorialStep = 1;
      this.nodesMergedThisStep = 0;
    } else if (this.tutorialStep === 1 && this.nodesMergedThisStep >= 2) {
      this.ui.showGuide('You are mastering the flux. Keep going to reach the Singularity!');
      this.tutorialStep = 2;
      this.nodesMergedThisStep = 0;
    }
  }

  public update(deltaTime: number) {
    if (this.isFrenzy) {
      this.frenzyTimer -= deltaTime;
      if (this.frenzyTimer <= 0) {
        this.isFrenzy = false;
        this.scoreManager.isFever = false;
      }
    }
  }

  public reset() {
    this.isFrenzy = false;
    this.frenzyTimer = 0;
    this.nodesMergedThisStep = 0;
    this.tutorialStep = 0;
  }
}
