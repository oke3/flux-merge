/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { THEMES, ABILITIES } from '../assets/constants';
import { ProfileManager, type UserProfile } from '../core/ProfileManager';

export class UIManager {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private comboElement!: HTMLElement;
  private profile: UserProfile;

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

  private setupComboDisplay() {
    this.comboElement = document.createElement('div');
    this.comboElement.className = 'glass-panel combo-display';
    this.comboElement.style.cssText = 'position: absolute; top: 80px; left: 50%; transform: translateX(-50%); font-size: 32px; font-weight: bold; color: #FFD700; display: none; transition: all 0.2s ease; z-index: 20;';
    document.querySelector('.overlay')!.appendChild(this.comboElement);
  }

  private setupPanels() {
    const panelIds = ['main', 'profile', 'settings', 'gameOverModal', 'winModal'];
    panelIds.forEach(id => {
      this.panels[id] = document.getElementById(`panel-${id}`) || document.getElementById(id)!;
    });
  }

  private setupTutorial() {
    this.tutorialBox = document.getElementById('tutorial-box')!;
    this.tutorialText = document.getElementById('tutorial-text')!;
  }

  private setupEventListeners() {
    // Navigation
    document.getElementById('btn-profile')!.onclick = () => this.showPanel('profile');
    document.getElementById('btn-settings')!.onclick = () => this.showPanel('settings');
    document.querySelectorAll('#btn-back-main').forEach(btn => {
      (btn as HTMLElement).onclick = () => this.showPanel('main');
    });

    // Burger Menu
    document.getElementById('btn-burger')!.onclick = () => {
      const mainPanel = this.panels['main'];
      if (mainPanel) {
        mainPanel.classList.toggle('active');
      }
    };

    // Modal Navigation
    document.getElementById('btn-menu-from-over')!.onclick = () => this.showPanel('main');
    document.getElementById('btn-menu-from-win')!.onclick = () => this.showPanel('main');
    
    document.getElementById('btn-retry')!.onclick = () => {
      this.showPanel('main');
      document.getElementById('startBtn')!.click();
    };
    document.getElementById('btn-retry-win')!.onclick = () => {
      this.showPanel('main');
      document.getElementById('startBtn')!.click();
    };

    // Settings Actions
    document.getElementById('btn-load')!.onclick = () => {
      this.profile = ProfileManager.loadProfile();
      this.showToast('Profile Loaded');
    };
    document.getElementById('btn-new-game')!.onclick = () => {
      if (confirm('Start a new game? Current progress will be lost.')) {
        this.profile = ProfileManager.resetProfile();
        ProfileManager.saveProfile(this.profile);
        this.updateProfileUI();
        this.showToast('Fresh start begun');
      }
    };
    document.getElementById('btn-delete')!.onclick = () => {
      if (confirm('Permanently delete all cosmic data?')) {
        ProfileManager.deleteProfile();
        this.profile = ProfileManager.loadProfile();
        this.updateProfileUI();
        this.showToast('Data purged');
      }
    };
    document.getElementById('btn-reset')!.onclick = () => {
      if (confirm('NUCLEAR RESET: Wipe everything?')) {
        this.profile = ProfileManager.resetProfile();
        ProfileManager.saveProfile(this.profile);
        this.updateProfileUI();
        this.showToast('Cosmos reset');
      }
    };

    // Tutorial Toggle
    document.getElementById('toggle-tutorial')!.onchange = (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      window.dispatchEvent(new CustomEvent('tutorialToggled', { detail: checked }));
    };

    // Theme Selection
    document.getElementById('themeSelect')!.onchange = (e) => {
      const themeId = (e.target as HTMLSelectElement).value;
      this.applyTheme(themeId);
    };
  }

  public showPanel(id: string) {
    Object.values(this.panels).forEach(p => p.classList.remove('active'));
    const target = this.panels[id];
    if (target) {
      target.classList.add('active');
      if (id === 'profile') this.updateProfileUI();
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

  private applyTheme(themeId: string) {
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
    this.comboElement.style.transform = 'translateX(-50%) scale(1.2)';
    setTimeout(() => {
      this.comboElement.style.transform = 'translateX(-50%) scale(1)';
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
    Object.values(this.panels).forEach(p => p.classList.remove('active'));
  }
  public hideIntro() { this.showPanel('main'); } // Not used, managed by showPanel

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
