/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { THEMES, ABILITIES, GameState } from '../assets/constants';
import { ProfileManager, type UserProfile } from '../core/ProfileManager';
import type { Game } from '../core/Game';

export class UIManager {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private comboElement!: HTMLElement;
  private profile: UserProfile;
  private game!: Game;

  // Panels
  private panels: Record<string, HTMLElement> = {};
  private tutorialBox!: HTMLElement;
  private tutorialText!: HTMLElement;

  constructor() {
    this.profile = ProfileManager.loadProfile();
    this.scoreElement = document.getElementById('scoreValue')!;
    this.highScoreElement = document.getElementById('highScoreValue')!;
    
    this.setupComboDisplay();
    this.setupPanels();
    this.setupTutorial();
    this.setupEventListeners();
    this.updateThemeSelector();
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
    const panelIds = ['main', 'profile', 'settings', 'gameOverModal', 'winModal', 'pause'];
    panelIds.forEach(id => {
      const el = document.getElementById(`panel-${id}`) || document.getElementById(id);
      if (el) {
        this.panels[id] = el;
      } else {
        console.warn(`[UIManager] Panel #${id} not found in DOM`);
      }
    });
  }

  private setupTutorial() {
    this.tutorialBox = document.getElementById('tutorial-box')!;
    this.tutorialText = document.getElementById('tutorial-text')!;
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
    safeSetClick('btn-profile', () => this.showPanel('profile'));
    safeSetClick('btn-settings', () => this.showPanel('settings'));
    document.querySelectorAll('#btn-back-main').forEach(btn => {
      (btn as HTMLElement).onclick = () => this.showPanel('main');
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
    safeSetClick('btn-load', () => {
      this.profile = ProfileManager.loadProfile();
      this.showToast('Profile Loaded');
    });
    safeSetClick('btn-new-game', () => {
      if (confirm('Start a new game? Current progress will be lost.')) {
        this.profile = ProfileManager.resetProfile();
        ProfileManager.saveProfile(this.profile);
        this.updateProfileUI();
        this.showToast('Fresh start begun');
      }
    });
    safeSetClick('btn-delete', () => {
      if (confirm('Permanently delete all cosmic data?')) {
        ProfileManager.deleteProfile();
        this.profile = ProfileManager.loadProfile();
        this.updateProfileUI();
        this.showToast('Data purged');
      }
    });
    safeSetClick('btn-reset', () => {
      if (confirm('NUCLEAR RESET: Wipe everything?')) {
        this.profile = ProfileManager.resetProfile();
        ProfileManager.saveProfile(this.profile);
        this.updateProfileUI();
        this.showToast('Cosmos reset');
      }
    });

    // Tutorial Toggle
    const tutorialToggle = document.getElementById('toggle-tutorial');
    if (tutorialToggle) {
      tutorialToggle.onchange = (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        window.dispatchEvent(new CustomEvent('tutorialToggled', { detail: checked }));
      };
    }

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

  public showPanel(id: string) {
    Object.values(this.panels).forEach(p => {
      if (p) p.classList.remove('active');
    });
    const target = this.panels[id];
    if (target) {
      target.classList.add('active');
      if (id === 'profile') this.updateProfileUI();
    } else {
      console.error(`[UIManager] Attempted to show non-existent panel: ${id}`);
    }
  }

  private updateProfileUI() {
    document.getElementById('profile-rank')!.innerText = this.profile.level.toString();
    document.getElementById('profile-xp')!.innerText = this.profile.xp.toString();

    const tree = document.getElementById('ability-tree')!;
    tree.innerHTML = '';

    Object.entries(ABILITIES).forEach(([id, ability]) => {
      const level = this.profile.upgrades[id] || 0;
      const cost = ability.costPerLevel(level);
      const canAfford = this.profile.xp >= cost && level < ability.maxLevel;

      const item = document.createElement('div');
      item.className = 'upgrade-item';
      item.innerHTML = `
        <div>
          <strong>${ability.name}</strong> (Lvl ${level}/${ability.maxLevel})<br>
          <small>${ability.description}</small>
        </div>
        <button class="btn" style="width: auto; margin: 0; padding: 5px 10px;" 
          ${!canAfford ? 'disabled' : ''} 
          id="upgrade-${id}">
          ${level >= ability.maxLevel ? 'MAX' : cost + ' XP'}
        </button>
      `;
      tree.appendChild(item);

      document.getElementById(`upgrade-${id}`)!.onclick = () => {
        const success = ProfileManager.upgradeAbility(id, this.profile);
        if (success) {
          ProfileManager.saveProfile(this.profile);
          this.updateProfileUI();
        }
      };
    });
  }

  private updateThemeSelector() {
    const select = document.getElementById('themeSelect')!;
    select.innerHTML = '';

    this.profile.unlockedThemes.forEach((themeId: string) => {
      const theme = THEMES[themeId];
      if (theme) {
        const opt = document.createElement('option');
        opt.value = themeId;
        opt.innerText = theme.name;
        if (themeId === this.profile.settings.theme) opt.selected = true;
        select.appendChild(opt);
      }
    });
  }

  public applyTheme(themeId: string) {
    const theme = THEMES[themeId] || THEMES.deepSpace;
    this.profile.settings.theme = themeId;
    ProfileManager.saveProfile(this.profile);
    
    document.body.style.background = theme.background;
    document.querySelectorAll('.glass-panel').forEach(el => {
      (el as HTMLElement).style.background = theme.glassBg;
      (el as HTMLElement).style.borderColor = theme.glassBorder;
    });

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeId }));
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
    this.tutorialText.innerText = text;
    this.tutorialBox.classList.add('visible');
    setTimeout(() => {
      this.tutorialBox.classList.remove('visible');
    }, duration);
  }

  private showToast(text: string) {
    this.showTutorial(text, 2000);
  }
}
