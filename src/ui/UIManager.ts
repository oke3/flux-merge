/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameState } from '../assets/constants';
import type { Game } from '../core/Game';

export class UIManager {
  private game: Game | null = null;
  private panels: Map<GameState, HTMLElement> = new Map();
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private toastElement: HTMLElement;
  private eventLogElement: HTMLElement;

  constructor() {
    this.scoreElement = document.getElementById('scoreValue')!;
    this.highScoreElement = document.getElementById('highScoreValue')!;
    this.toastElement = document.getElementById('toast-notification')!;
    this.eventLogElement = document.getElementById('event-log')!;
    this.initPanels();
    this.initListeners();
  }

  private initPanels() {
    this.panels.set(GameState.MENU, document.getElementById('panel-main')!);
    this.panels.set(GameState.SETTINGS, document.getElementById('panel-settings')!);
    this.panels.set(GameState.UPGRADES, document.getElementById('panel-upgrades')!);
    this.panels.set(GameState.PAUSED, document.getElementById('panel-pause')!);
    this.panels.set(GameState.GAME_OVER, document.getElementById('gameOverModal')!);
    this.panels.set(GameState.WIN, document.getElementById('winModal')!);
  }

  private initListeners() {
    console.log('[UIManager] Initializing listeners...');
    this.initMagneticButtons();
    // Main Menu
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      console.log('[UIManager] Found startBtn, attaching listener');
      startBtn.addEventListener('click', () => {
        console.log('[UIManager] Start button clicked');
        this.game?.restart();
      });
    } else {
      console.error('[UIManager] startBtn NOT FOUND in DOM');
    }
    document.getElementById('btn-settings')?.addEventListener('click', () => this.game?.transitionTo(GameState.SETTINGS));
    document.getElementById('btn-upgrades')?.addEventListener('click', () => this.game?.transitionTo(GameState.UPGRADES));


    // Settings
    document.getElementById('btn-back-main')?.addEventListener('click', () => this.game?.transitionTo(GameState.MENU));
    document.getElementById('btn-reset-score')?.addEventListener('click', () => {
      localStorage.removeItem('flux-merge-high-score');
      this.updateScore(0);
      this.updateHighScore(0);
    });
    document.getElementById('btn-tutorial')?.addEventListener('click', () => this.showPanel('panel-tutorial'));
    
    document.getElementById('toggle-mute-sfx')?.addEventListener('click', () => this.game?.toggleMuteSfx());
    document.getElementById('toggle-vibrate')?.addEventListener('click', () => this.game?.toggleVibration());
    document.getElementById('toggle-powersaver')?.addEventListener('click', () => this.game?.togglePowerSaver());

    // Pause Menu

    // Pause Menu
    document.getElementById('btn-pause')?.addEventListener('click', () => this.game?.pause());
    document.getElementById('btn-pause-resume')?.addEventListener('click', () => this.game?.resume());
    document.getElementById('btn-pause-restart')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-pause-settings')?.addEventListener('click', () => this.game?.transitionTo(GameState.SETTINGS));
    document.getElementById('btn-pause-menu')?.addEventListener('click', () => this.game?.returnToMenu());

    // Modals
    document.getElementById('btn-retry')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-menu-from-over')?.addEventListener('click', () => this.game?.returnToMenu());
    document.getElementById('btn-retry-win')?.addEventListener('click', () => this.game?.restart());
    document.getElementById('btn-menu-from-win')?.addEventListener('click', () => this.game?.returnToMenu());
  }

  public setGame(game: Game) {
    this.game = game;
  }

  public updateState(state: GameState) {
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

    // Show the panel corresponding to the current state
    const activePanel = this.panels.get(state);
    if (activePanel) {
      activePanel.classList.add('active');
      activePanel.style.display = 'flex';
    }
  }

  public handleStateChange(state: GameState) {
    this.updateState(state);
  }

  public showPanel(panelId: string) {
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

  public updateScore(score: number) {
    this.scoreElement.textContent = score.toString();
    
    // Trigger "pop" animation
    this.scoreElement.classList.remove('score-pop');
    void this.scoreElement.offsetWidth; // Force reflow
    this.scoreElement.classList.add('score-pop');
  }

  public pulseHUD() {
    const wrapper = document.getElementById('main-wrapper');
    if (wrapper) {
      wrapper.classList.remove('hud-pulse');
      void wrapper.offsetWidth; // Force reflow
      wrapper.classList.add('hud-pulse');
    }
  }

  public updateHighScore(highScore: number) {
    this.highScoreElement.textContent = highScore.toString();
  }

  public logEvent(message: string) {
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

  public updateCombo(combo: number) {
    // Combo element not yet in HTML, but method provided to prevent crashes
    // Potential future: add a combo multiplier display to the UI
    console.log(`[UIManager] Combo updated: ${combo}`);
  }

  public showGuide(message: string, duration: number = 3000) {
    this.showNotification(message, duration);
  }

  public showNotification(message: string, duration: number = 3000) {
    this.toastElement.textContent = message;
    this.toastElement.style.opacity = '1';

    setTimeout(() => {
      this.toastElement.style.opacity = '0';
    }, duration);
  }

  public showResults(_results: any, isWin: boolean) {
    const modal = isWin ? document.getElementById('winModal') : document.getElementById('gameOverModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
    }
  }

  public renderUpgrades(upgrades: any[], onUpgrade: (abilityId: string) => void) {
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

