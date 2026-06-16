// SPDX-License-Identifier: Proprietary
import { GameState, THEMES } from '../assets/constants';
import type { Game } from '../core/Game';
import type { GameResults, UpgradeData } from '../core/types';
import { BadgeManager } from '../core/BadgeManager';

export class UIManager {
  private game: Game | null = null;
  private panels: Map<GameState, HTMLElement> = new Map();
  private toastElement!: HTMLElement;
  private eventLogElement!: HTMLElement;
  private hudContainer!: HTMLElement;
  private hudScore!: HTMLElement;
  private hudHighScore!: HTMLElement;
  private hudCombo!: HTMLElement;
  private hudLevel!: HTMLElement;
  private xpBarFill!: HTMLElement;
  private lastScore: number = -1;
  private lastCombo: number = -1;
  private settingsFromPause: boolean = false;
  private ready: boolean = false;
  private pendingTimeouts: number[] = [];


  constructor() {
    this.toastElement = document.getElementById('toast-notification')!;
    this.eventLogElement = document.getElementById('event-log')!;
    this.hudContainer = document.getElementById('game-hud')!;
    this.hudScore = document.getElementById('hud-score')!;
    this.hudHighScore = document.getElementById('hud-highscore')!;
    this.hudCombo = document.getElementById('hud-combo')!;
    this.hudLevel = document.getElementById('hud-level')!;
    this.xpBarFill = document.getElementById('xp-bar-fill')!;
    if (!this.toastElement || !this.hudContainer) {
      console.error('[UIManager] Critical DOM elements missing — UI degraded');
      return;
    }
    this.initPanels();
    this.initListeners();
    this.populateThemeSelector();
    this.ready = true;
  }

  private initPanels() {
    this.panels.set(GameState.MENU, document.getElementById('panel-main')!);
    this.panels.set(GameState.SETTINGS, document.getElementById('panel-settings')!);
    this.panels.set(GameState.UPGRADES, document.getElementById('panel-upgrades')!);
    this.panels.set(GameState.ACHIEVEMENTS, document.getElementById('panel-achievements')!);
    this.panels.set(GameState.PAUSED, document.getElementById('panel-pause')!);
    this.panels.set(GameState.GAME_OVER, document.getElementById('gameOverModal')!);
    this.panels.set(GameState.WIN, document.getElementById('winModal')!);
  }

  private initListeners() {
    this.initMagneticButtons();
    // Main Menu
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.game?.restart();
      });
    } else {
      console.error('[UIManager] startBtn NOT FOUND in DOM');
    }
    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.settingsFromPause = false;
      this.game?.transitionTo(GameState.SETTINGS);
    });
    document.getElementById('btn-upgrades')?.addEventListener('click', () => this.game?.transitionTo(GameState.UPGRADES));
    
    // Add achievement button to main menu manually since it's not in HTML yet
    const menuPanel = document.getElementById('panel-main');
    if (menuPanel) {
      const achBtn = document.createElement('button');
      achBtn.className = 'btn btn-secondary btn-magnetic';
      achBtn.textContent = 'Achievements';
      achBtn.addEventListener('click', () => this.game?.transitionTo(GameState.ACHIEVEMENTS));
      menuPanel.appendChild(achBtn);
    }
    
    // Settings
    document.getElementById('btn-back-main')?.addEventListener('click', () => {
      if (this.settingsFromPause) {
        this.game?.transitionTo(GameState.PAUSED);
      } else {
        this.game?.transitionTo(GameState.MENU);
      }
    });
    document.getElementById('btn-tutorial')?.addEventListener('click', () => this.showPanel('panel-tutorial'));
    
    // Settings toggle buttons (game.showNotification handles state feedback)
    document.getElementById('toggle-mute-sfx')?.addEventListener('click', () => this.game?.toggleMuteSfx());
    document.getElementById('toggle-vibrate')?.addEventListener('click', () => this.game?.toggleVibration());
    document.getElementById('toggle-powersaver')?.addEventListener('click', () => this.game?.togglePowerSaver());
    
    // Reset score (key must match ScoreManager's 'flux-merge-highscore')
    document.getElementById('btn-reset-score')?.addEventListener('click', () => {
      localStorage.removeItem('flux-merge-highscore');
      this.showNotification('High score reset!');
    });
    
    // Theme selector
    const themeSelect = document.getElementById('theme-selector') as HTMLSelectElement;
    themeSelect?.addEventListener('change', () => {
      if (themeSelect.value) {
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeSelect.value }));
      }
    });
    
    // Pause Menu
    document.getElementById('btn-pause')?.addEventListener('click', () => this.game?.pause());
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.game?.resume());
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => {
      this.settingsFromPause = true;
      this.game?.transitionTo(GameState.SETTINGS);
    });
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => this.game?.returnToMenu());

    // Tutorial
    document.getElementById('btn-tutorial-back')?.addEventListener('click', () => this.game?.transitionTo(GameState.MENU));

    // Modals
    document.getElementById('btn-retry')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-menu-from-over')?.addEventListener('click', () => this.game?.returnToMenu());
    document.getElementById('btn-retry-win')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-menu-from-win')?.addEventListener('click', () => this.game?.returnToMenu());

    // Achievements
    window.addEventListener('achievementUnlocked', (e: any) => {
      const ach = e.detail;
      this.showAchievementToast(ach);
    });
    document.getElementById('btn-achievements-back')?.addEventListener('click', () => {
      this.game?.transitionTo(GameState.MENU);
    });
  }

  public setGame(game: Game) {
    this.game = game;
  }

  public updateState(state: GameState) {
    if (!this.ready) return;
    // Hide all panels
    this.panels.forEach(panel => {
      panel.classList.remove('active');
      panel.style.display = 'none';
    });

    // Toggle pause controls visibility (only show during active game)
    const pauseControls = document.getElementById('pause-controls');
    if (pauseControls) {
      pauseControls.style.display = state === GameState.PLAYING ? 'block' : 'none';
    }

    // Show/hide the in-game HUD
    if (this.hudContainer) {
      this.hudContainer.style.display = state === GameState.PLAYING ? 'flex' : 'none';
    }

    // Sync settings state when opening the settings panel
    if (state === GameState.SETTINGS) {
      this.syncSettingsButtons();
      this.syncThemeSelector();
      
      const backBtn = document.getElementById('btn-back-main');
      if (backBtn) {
        backBtn.textContent = this.settingsFromPause ? 'Back to Game' : 'Back';
      }
    }

    if (state === GameState.ACHIEVEMENTS) {
      this.renderAchievements();
    }

    // Reset score pop animation tracking when game ends
    if (state === GameState.GAME_OVER || state === GameState.WIN) {
      this.lastScore = -1;
      this.lastCombo = -1;
    }

    // Show the panel corresponding to the current state
    const activePanel = this.panels.get(state);
    if (activePanel) {
      activePanel.classList.add('active');
      activePanel.style.display = 'flex';
    }
  }

  private populateThemeSelector() {
    const select = document.getElementById('theme-selector') as HTMLSelectElement;
    if (!select) return;
    // Clear placeholder
    select.innerHTML = '';
    for (const [id, theme] of Object.entries(THEMES)) {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = `${theme.name} (Lv ${theme.requiredLevel}+)`;
      select.appendChild(option);
    }
  }

  public handleStateChange(state: GameState) {
    if (!this.ready) return;
    this.clearPendingTimeouts(); // Clear stale toast/guide timeouts
    this.updateState(state);
  }

  public showPanel(panelId: string) {
    if (!this.ready) return;
    document.querySelectorAll('.panel').forEach(p => {
      p.classList.remove('active');
      (p as HTMLElement).style.display = 'none';
    });

    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      panel.style.display = 'flex';
    }
  }

  public pulseHUD() {
    if (!this.ready) return;
    const wrapper = document.getElementById('main-wrapper');
    if (wrapper) {
      wrapper.classList.remove('hud-pulse');
      void wrapper.offsetWidth; // Force reflow
      wrapper.classList.add('hud-pulse');
    }
  }

  public triggerMergeFlash() {
    const flash = document.getElementById('merge-flash');
    if (!flash) return;
    flash.style.opacity = '0.55';
    this.setTimeout(() => { flash.style.opacity = '0'; }, 80);
  }

  public logEvent(message: string) {
    if (!this.ready) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    const timestamp = (performance.now() / 1000).toFixed(1);
    entry.textContent = `[${timestamp}s] ${message}`;
    this.eventLogElement.appendChild(entry);

    // Keep only last 10 entries
    while (this.eventLogElement.childNodes.length > 10) {
      const firstChild = this.eventLogElement.firstChild;
      if (firstChild) {
        this.eventLogElement.removeChild(firstChild);
      }
    }
  }

  /** Update the in-game HUD with current score, combo, level, and XP progress */
  public updateHUD(score: number, highScore: number, combo: number, playerLevel: number, xpProgress: number, _maxNodeLevel: number, frenzyActive: boolean = false, comboTimer: number = 0, comboTimeout: number = 1500) {
    // Score with pop animation
    if (score !== this.lastScore) {
      this.hudScore.textContent = score.toLocaleString();
      this.hudScore.classList.remove('pop');
      void this.hudScore.offsetWidth;
      this.hudScore.classList.add('pop');
      this.lastScore = score;
    }

    // High score
    this.hudHighScore.textContent = highScore.toLocaleString();

    // Combo with pop animation (only show when > 1)
    if (combo !== this.lastCombo) {
      this.hudCombo.textContent = `x${combo}`;
      if (combo > 1) {
        this.hudCombo.classList.remove('pop');
        void this.hudCombo.offsetWidth;
        this.hudCombo.classList.add('pop');
        this.hudCombo.classList.remove('hud-combo-idle');
        this.hudCombo.classList.add('hud-combo-active');
      } else {
        this.hudCombo.classList.remove('hud-combo-active');
        this.hudCombo.classList.add('hud-combo-idle');
      }
      this.lastCombo = combo;
    }

    // Update Combo Decay Ring
    const ring = document.getElementById('combo-ring-svg')?.querySelector('circle');
    if (ring) {
      if (combo > 1 && comboTimer > 0) {
        const progress = comboTimer / comboTimeout;
        const circumference = 2 * Math.PI * 18; // r=18
        ring.style.strokeDashoffset = `${circumference * (1 - progress)}`;
        ring.classList.toggle('ring-warning', progress < 0.3);
        ring.style.opacity = '0.6';
      } else {
        ring.style.strokeDashoffset = '113.1'; // Full offset = hidden
        ring.style.opacity = '0';
      }
    }

    // Player level
    this.hudLevel.textContent = `Lv ${playerLevel}`;

    // XP bar
    this.xpBarFill.style.width = `${Math.min(100, Math.round(xpProgress * 100))}%`;

    // Frenzy visual feedback
    const frenzyOverlay = document.getElementById('frenzy-overlay');
    if (frenzyOverlay) {
      frenzyOverlay.classList.toggle('active', frenzyActive);
    }
  }

  public updateCombo(_combo: number) {
    // Called by ScoreManager when combo changes
    // The visual update is handled by updateHUD which is called every frame
    // This method exists to prevent crashes from ScoreManager calling it
  }

  public showGuide(message: string, duration: number = 3000) {
    if (!this.ready) return;
    const guide = document.getElementById('tutorial-box');
    const text = document.getElementById('tutorial-text');
    if (guide && text) {
      text.textContent = message;
      guide.classList.add('visible');
      this.setTimeout(() => {
        guide.classList.remove('visible');
      }, duration);
    } else {
      // Fallback to toast if guide element not found
      this.showNotification(message, duration);
    }
  }

  public showNotification(message: string, duration: number = 3000) {
    if (!this.ready) return;
    this.toastElement.textContent = message;
    this.toastElement.style.opacity = '1';

    // Play notification chime for important messages
    if (message.includes('LEVEL UP') || message.includes('SFX') || message.includes('Haptics') || message.includes('Power Saver')) {
      this.game?.playNotificationAudio();
    }

    this.setTimeout(() => {
      this.toastElement.style.opacity = '0';
    }, duration);
  }

  public showAchievementToast(ach: any) {
    if (!this.ready) return;
    const toast = document.getElementById('achievement-toast');
    const icon = document.getElementById('achievement-toast-icon');
    const name = document.getElementById('achievement-toast-name');
    const desc = document.getElementById('achievement-toast-desc');
    
    if (toast && icon && name && desc) {
      name.textContent = ach.name;
      desc.textContent = ach.description;
      
      // Icon based on achievement ID
      const icons: Record<string, string> = {
        'first-merge': '✨',
        'combo-king': '👑',
        'void-master': '🌑',
        'singularity': '🌟',
      };
      icon.textContent = icons[ach.id] || '🏆';
      
      toast.classList.add('active');
      this.setTimeout(() => {
        toast.classList.remove('active');
      }, 5000);
    }
  }

  public renderAchievements() {
    if (!this.ready) return;
    const list = document.getElementById('achievements-list');
    if (!list) return;
    
    list.innerHTML = '';
    const allAchievements = BadgeManager.getAll();
    
    allAchievements.forEach(ach => {
      const item = document.createElement('div');
      item.className = 'badge-item';
      
      const icon = document.createElement('div');
      icon.className = `badge-icon ${ach.unlocked ? 'unlocked' : 'locked'}`;
      
      const icons: Record<string, string> = {
        'first-merge': '✨',
        'combo-king': '👑',
        'void-master': '🌑',
        'singularity': '🌟',
      };
      icon.textContent = icons[ach.id] || '🏆';
      
      const info = document.createElement('div');
      info.className = 'badge-info';
      info.innerHTML = `
        <div class="badge-name ${ach.unlocked ? 'unlocked' : 'locked'}">${ach.name}</div>
        <div class="badge-desc">${ach.description}</div>
      `;
      
      item.appendChild(icon);
      item.appendChild(info);
      list.appendChild(item);
    });
  }

  public showLevelUp(level: number) {
    if (!this.ready) return;
    const overlay = document.getElementById('levelup-overlay');
    const subtext = document.getElementById('levelup-new-level');
    if (overlay && subtext) {
      subtext.textContent = `You have reached Level ${level}!`;
      overlay.classList.add('active');
      this.setTimeout(() => {
        overlay.classList.remove('active');
      }, 1200);
    }
  }

  public showResults(results: GameResults, isWin: boolean) {
    if (!this.ready) return;
    const suffix = isWin ? '-win' : '';
    const scoreEl = document.getElementById(`result-score${suffix}`);
    const levelEl = document.getElementById(`result-level${suffix}`);
    const timeEl = document.getElementById(`result-time${suffix}`);
    const xpEl = document.getElementById(`result-xp${suffix}`);

    if (scoreEl) scoreEl.textContent = results.score.toLocaleString();
    if (levelEl) levelEl.textContent = String(results.maxLevel);
    if (xpEl) xpEl.textContent = results.xpEarned.toLocaleString();
    if (timeEl) {
      const mins = Math.floor(results.duration / 60);
      const secs = Math.floor(results.duration % 60);
      timeEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    const modal = isWin ? document.getElementById('winModal') : document.getElementById('gameOverModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }
  }

  public renderUpgrades(upgrades: UpgradeData[], onUpgrade: (abilityId: string) => void) {
    if (!this.ready) return;
    const container = document.getElementById('panel-upgrades')!;
    
    // Keep the header, clear the rest
    container.innerHTML = `
      <h2>Cosmic Upgrades</h2>
      <button class="btn btn-secondary btn-magnetic" id="btn-upgrades-back" style="width: auto; padding: 5px 15px; margin-bottom: 20px; font-size: 12px;">
        ← Back to Menu
      </button>
    `;
    
    const list = document.createElement('div');
    list.className = 'upgrade-list';
    
    upgrades.forEach(upg => {
      const item = document.createElement('div');
      item.className = 'upgrade-item';
      item.innerHTML = `
        <div>
          <strong>${upg.name}</strong><br/>
          <small>${upg.description}</small>
        </div>
        <button class="btn btn-secondary btn-magnetic" style="width: auto; padding: 5px 10px;">
          Upgrade (${upg.cost} XP)
        </button>
      `;
      
      const btn = item.querySelector('button');
      btn?.addEventListener('click', () => onUpgrade(upg.id));
      
      list.appendChild(item);
    });
    
    container.appendChild(list);
    
    // Add listener to the back button
    document.getElementById('btn-upgrades-back')?.addEventListener('click', () => {
      this.game?.transitionTo(GameState.MENU);
    });
    
    // Re-init magnetic effects for dynamically created buttons
    this.initMagneticButtons();
  }

  /** Sync settings toggle button text to match the current game state */
  public syncSettingsButtons() {
    if (!this.ready) return;
    const settings = this.game?.getSettings();
    if (!settings) return;
    const sfxBtn = document.getElementById('toggle-mute-sfx');
    const vibBtn = document.getElementById('toggle-vibrate');
    const psBtn = document.getElementById('toggle-powersaver');
    if (sfxBtn) sfxBtn.textContent = settings.muteSfx ? 'SFX: OFF' : 'SFX: ON';
    if (vibBtn) vibBtn.textContent = settings.disableVibration ? 'Haptics: OFF' : 'Haptics: ON';
    if (psBtn) psBtn.textContent = settings.powerSaver ? 'Power Saver: ON' : 'Power Saver: OFF';
  }

  /** Sync theme selector dropdown to match current game theme */
  public syncThemeSelector() {
    if (!this.ready) return;
    const select = document.getElementById('theme-selector') as HTMLSelectElement;
    if (!select || !this.game) return;
    select.value = this.game.getCurrentThemeId();
  }

  /** Track and manage timeouts to prevent stale callbacks after restart */
  private setTimeout(fn: () => void, delay: number): number {
    const id = window.setTimeout(() => { fn(); this.pendingTimeouts = this.pendingTimeouts.filter(t => t !== id); }, delay);
    this.pendingTimeouts.push(id);
    return id;
  }

  public clearPendingTimeouts() {
    this.pendingTimeouts.forEach(clearTimeout);
    this.pendingTimeouts = [];
  }

  private initMagneticButtons() {
    const magneticButtons = document.querySelectorAll('.btn-magnetic');
    
    magneticButtons.forEach(btn => {
      // Mouse Hover Effect
      btn.addEventListener('mousemove', (e) => {
        const mouseEvent = e as MouseEvent;
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = mouseEvent.clientX - centerX;
        const deltaY = mouseEvent.clientY - centerY;
        
        const pullStrength = 0.2;
        const moveX = deltaX * pullStrength;
        const moveY = deltaY * pullStrength;
        
          (btn as HTMLElement).style.transform = `scale(1.05) translate(${moveX}px, ${moveY}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
          (btn as HTMLElement).style.transform = '';
        });

        // Subtle UI click sound on any magnetic button press
        btn.addEventListener('click', () => {
          this.game?.playUIAudio();
        });

      // Touch Press Effect
      btn.addEventListener('touchstart', () => {
        (btn as HTMLElement).style.transform = 'scale(0.95)';
      }, { passive: true });
      
      btn.addEventListener('touchend', () => {
        (btn as HTMLElement).style.transform = '';
      }, { passive: true });
    });
  }
}

