/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { GameState } from '../assets/constants';
import { ProfileManager } from '../core/ProfileManager';
import { Game } from '../core/Game';

export class UIManager {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private comboElement!: HTMLElement;
  private game!: Game;

  // Panels
  private panels: Record<string, HTMLElement> = {};

  constructor() {
    this.scoreElement = document.getElementById('scoreValue')!;
    this.highScoreElement = document.getElementById('highScoreValue')!;
    
    this.setupComboDisplay();
    this.setupPanels();
    this.setupEventListeners();
    this.updateSettingsButtons();
  }

  public setGame(game: Game) {
    this.game = game;
  }

  public handleStateChange(state: GameState) {
    // 1. Reset all panels
    this.hideAll();
    
    // 2. Update based on state
    switch (state) {
      case GameState.MENU:
        this.showPanel('main');
        this.togglePauseButton(false);
        break;
      case GameState.PLAYING:
        this.togglePauseButton(true);
        break;
      case GameState.PAUSED:
        this.showPanel('pause');
        this.togglePauseButton(false);
        break;
      case GameState.GAME_OVER:
        this.showPanel('gameOverModal');
        this.togglePauseButton(false);
        break;
      case GameState.WIN:
        this.showPanel('winModal');
        this.togglePauseButton(false);
        break;
    }
  }

  private setupComboDisplay() {
    // Create a wrapper with fixed height to reserve space and prevent layout shift
    this.comboElement = document.createElement('div');
    this.comboElement.className = 'glass-panel combo-display';
    this.comboElement.style.cssText = 'font-size: 32px; font-weight: bold; color: #FFD700; display: none; transition: all 0.2s ease; z-index: 20; text-align: center;';

    const comboWrapper = document.createElement('div');
    comboWrapper.id = 'combo-wrapper';
    comboWrapper.style.cssText = 'height: 60px; display: flex; justify-content: center; align-items: center; margin-bottom: 10px; width: 100%;';
    comboWrapper.appendChild(this.comboElement);
    
    const wrapper = document.getElementById('main-wrapper');
    const container = document.getElementById('game-container');
    if (wrapper && container) {
      wrapper.insertBefore(comboWrapper, container);
    } else {
      document.querySelector('.overlay')!.appendChild(this.comboElement);
    }
  }

  private setupPanels() {
    const panelIds = ['main', 'settings', 'tutorial', 'gameOverModal', 'winModal', 'pause'];
    panelIds.forEach(id => {
      const el = document.getElementById(`panel-${id}`) || document.getElementById(id);
      if (el) {
        this.panels[id] = el;
      } else {
        console.warn(`[UIManager] Panel #${id} not found in DOM`);
      }
    });
  }

  private setupEventListeners() {
    const safeSetClick = (id: string, handler: () => void) => {
      const el = document.getElementById(id);
      if (el) {
        el.onclick = handler;
      } else {
        console.warn(`[UIManager] Element #${id} not found in DOM`);
      }
    };

    // Navigation
    safeSetClick('btn-settings', () => this.showPanel('settings'));
    safeSetClick('btn-tutorial', () => {
      this.showPanel('tutorial');
      this.showTutorialSlide(0);
    });
    document.querySelectorAll('#btn-back-main').forEach(btn => {
      (btn as HTMLElement).onclick = () => this.showPanel('main');
    });

    safeSetClick('btn-tutorial-prev', () => {
      const current = this.getCurrentTutorialSlide();
      this.showTutorialSlide(current - 1);
    });
    safeSetClick('btn-tutorial-next', () => {
      const current = this.getCurrentTutorialSlide();
      this.showTutorialSlide(current + 1);
    });

    // Modal Navigation
    safeSetClick('btn-menu-from-over', () => this.game.returnToMenu());
    safeSetClick('btn-menu-from-win', () => this.game.returnToMenu());
    
    safeSetClick('btn-retry', () => {
      this.game.restart();
    });
    safeSetClick('btn-retry-win', () => {
      this.game.restart();
    });

    // Settings Actions
    safeSetClick('btn-reset-score', () => {
      this.game.scoreManager.resetHighScore();
      this.showToast('High Score Reset');
    });

    safeSetClick('toggle-mute-sfx', () => {
      const profile = ProfileManager.loadProfile();
      profile.settings.muteSfx = !profile.settings.muteSfx;
      ProfileManager.saveProfile(profile);
      if (this.game && this.game.audioManager) {
        this.game.audioManager.updateProfile(profile);
      }
      this.updateSettingsButtons();
      this.showToast('SFX ' + (profile.settings.muteSfx ? 'OFF' : 'ON'));
    });
    safeSetClick('toggle-vibrate', () => {
      const profile = ProfileManager.loadProfile();
      profile.settings.disableVibration = !profile.settings.disableVibration;
      ProfileManager.saveProfile(profile);
      this.updateSettingsButtons();
      this.showToast('Haptics ' + (profile.settings.disableVibration ? 'OFF' : 'ON'));
    });

    // Pause Menu
    safeSetClick('btn-pause', () => {
      this.game.pause();
    });

    safeSetClick('btn-pause-resume', () => {
      this.game.resume();
    });

    safeSetClick('btn-pause-restart', () => {
      this.game.restart();
    });

    safeSetClick('btn-pause-settings', () => {
      this.showPanel('settings');
    });

    safeSetClick('btn-pause-menu', () => {
      this.game.returnToMenu();
    });
  }

  private updateSettingsButtons() {
    const profile = ProfileManager.loadProfile();
    const sfxBtn = document.getElementById('toggle-mute-sfx');
    if (sfxBtn) {
      sfxBtn.innerText = `SFX: ${profile.settings.muteSfx ? 'OFF' : 'ON'}`;
    }
    const vibBtn = document.getElementById('toggle-vibrate');
    if (vibBtn) {
      vibBtn.innerText = `Haptics: ${profile.settings.disableVibration ? 'OFF' : 'ON'}`;
    }
  }

  private getCurrentTutorialSlide(): number {
    const activeSlide = document.querySelector('.tutorial-slide.active');
    return activeSlide ? parseInt(activeSlide.getAttribute('data-slide') || '0') : 0;
  }

  private showTutorialSlide(index: number) {
    const slides = document.querySelectorAll('.tutorial-slide');
    if (slides.length === 0) return;

    slides.forEach((slide, i) => {
      (slide as HTMLElement).style.display = i === index ? 'block' : 'none';
      slide.classList.toggle('active', i === index);
    });

    const prevBtn = document.getElementById('btn-tutorial-prev');
    const nextBtn = document.getElementById('btn-tutorial-next');
    if (prevBtn) prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    if (nextBtn) nextBtn.style.visibility = index === slides.length - 1 ? 'hidden' : 'visible';
  }

  public showPanel(id: string) {
    Object.values(this.panels).forEach(p => {
      if (p) p.classList.remove('active');
    });
    const target = this.panels[id];
    if (target) {
      target.classList.add('active');
    } else {
      console.error(`[UIManager] Attempted to show non-existent panel: ${id}`);
    }
  }

  public updateCombo(combo: number) {
    if (combo <= 1) {
      this.comboElement.style.display = 'none';
      return;
    }
    this.comboElement.style.display = 'block';
    this.comboElement.innerText = `COMBO x${combo}`;
    
    // Pulse effect
    this.comboElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.comboElement.style.transform = 'scale(1)';
    }, 100);
  }

  public updateScore(score: number) {
    this.scoreElement.innerText = score.toString();
  }

  public updateHighScore(highScore: number) {
    this.highScoreElement.innerText = highScore.toString();
  }

  public showGameOver() { this.showPanel('gameOverModal'); }
  public showWin() { this.showPanel('winModal'); }
  public hideAll() {
    Object.values(this.panels).forEach(p => {
      if (p) p.classList.remove('active');
    });
  }
  public hideIntro() { this.showPanel('main'); } // Not used, managed by showPanel

  public togglePauseButton(visible: boolean) {
    const controls = document.getElementById('pause-controls');
    if (controls) {
      controls.style.display = visible ? 'block' : 'none';
    }
  }

  public showTutorial(text: string, duration: number = 4000) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    
    toast.innerText = text;
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
    }, duration);
  }

  private showToast(text: string) {
    this.showTutorial(text, 2000);
  }
}
