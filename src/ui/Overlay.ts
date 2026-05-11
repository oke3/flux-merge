import { THEMES, type Theme } from '../assets/constants';

export class Overlay {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private gameOverModal: HTMLElement;
  private winModal: HTMLElement;
  private introScreen: HTMLElement;
  private comboElement: HTMLElement;
  private customTheme: Theme | null = null;

  constructor() {
    this.scoreElement = document.getElementById('scoreValue')!;

    if (!document.getElementById('highScoreValue')) {
      const scorePanel = this.scoreElement.parentElement!;
      const hsContainer = document.createElement('div');
      hsContainer.className = 'glass-panel score-display';
      hsContainer.style.marginLeft = '10px';
      hsContainer.innerHTML = `Best: <span id="highScoreValue">0</span>`;
      scorePanel.parentElement!.appendChild(hsContainer);
      this.highScoreElement = document.getElementById('highScoreValue')!;
    } else {
      this.highScoreElement = document.getElementById('highScoreValue')!;
    }

    this.gameOverModal = document.getElementById('gameOverModal')!;
    this.winModal = document.getElementById('winModal')!;
    this.introScreen = document.getElementById('intro-screen')!;

    // Combo Display
    this.comboElement = document.createElement('div');
    this.comboElement.className = 'glass-panel combo-display';
    this.comboElement.style.position = 'absolute';
    this.comboElement.style.top = '80px';
    this.comboElement.style.left = '50%';
    this.comboElement.style.transform = 'translateX(-50%)';
    this.comboElement.style.fontSize = '32px';
    this.comboElement.style.fontWeight = 'bold';
    this.comboElement.style.color = '#FFD700';
    this.comboElement.style.display = 'none';
    this.comboElement.style.transition = 'all 0.2s ease';
    this.comboElement.style.zIndex = '20';
    document.querySelector('.overlay')!.appendChild(this.comboElement);

    this.loadCustomTheme();
    this.setupThemeSelector();
  }

  public updateCombo(combo: number) {
    if (combo <= 1) {
      this.comboElement.style.display = 'none';
      return;
    }
    this.comboElement.style.display = 'block';
    this.comboElement.innerText = `COMBO x${combo}`;
    
    // Pulse effect
    this.comboElement.style.transform = 'translateX(-50%) scale(1.2)';
    setTimeout(() => {
      this.comboElement.style.transform = 'translateX(-50%) scale(1)';
    }, 100);
  }

  private loadCustomTheme() {
    const saved = localStorage.getItem('flux-merge-custom-theme');
    if (saved) {
      this.customTheme = JSON.parse(saved);
    }
  }

  private setupThemeSelector() {
    const container = document.createElement('div');
    container.className = 'glass-panel theme-selector';

    const label = document.createElement('span');
    label.innerText = 'Theme: ';
    label.style.marginRight = '10px';

    const select = document.createElement('select');
    select.style.background = 'transparent';
    select.style.color = 'white';
    select.style.border = '1px solid rgba(255,255,255,0.3)';
    select.style.borderRadius = '4px';
    select.style.padding = '2px 5px';

    Object.entries(THEMES).forEach(([id, theme]) => {
      const option = document.createElement('option');
      option.value = id;
      option.innerText = theme.name;
      select.appendChild(option);
    });

    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.innerText = '✨ Custom';
    select.appendChild(customOption);

    select.onchange = (e) => {
      const themeId = (e.target as HTMLSelectElement).value;
      if (themeId === 'custom') {
        this.setupThemeLab();
      } else {
        this.applyTheme(themeId);
      }
    };

    container.appendChild(label);
    container.appendChild(select);
    document.querySelector('.overlay')!.appendChild(container);
  }

  private setupThemeLab() {
    const lab = document.createElement('div');
    lab.id = 'theme-lab';
    lab.className = 'glass-panel modal';
    lab.style.display = 'flex';
    lab.style.zIndex = '200';
    lab.style.padding = '20px';
    lab.style.gap = '15px';

    const title = document.createElement('h2');
    title.innerText = 'Theme Lab';
    title.style.margin = '0 0 20px 0';
    title.style.fontSize = '24px';
    lab.appendChild(title);

    const controls = document.createElement('div');
    controls.style.display = 'grid';
    controls.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
    controls.style.gap = '10px';
    controls.style.width = '100%';

    // Current theme to seed values
    const seedTheme = this.customTheme || THEMES.deepSpace;

    for (let i = 1; i <= 5; i++) {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.flexDirection = 'column';
      row.style.alignItems = 'center';
      row.style.gap = '5px';

      const label = document.createElement('label');
      label.innerText = `Lvl ${i}`;
      label.style.fontSize = '12px';

      const picker = document.createElement('input');
      picker.type = 'color';
      picker.value = seedTheme.levels[i] || '#FFFFFF';
      picker.className = 'theme-picker';
      picker.style.width = '40px';
      picker.style.height = '40px';
      picker.style.border = 'none';
      picker.style.borderRadius = '50%';
      picker.style.cursor = 'pointer';
      picker.dataset.level = i.toString();

      row.appendChild(label);
      row.appendChild(picker);
      controls.appendChild(row);
    }

    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn';
    saveBtn.innerText = 'Apply & Save';
    saveBtn.onclick = () => {
      const newLevels: Record<number, string> = {};
      controls.querySelectorAll('input').forEach(input => {
        const lvl = parseInt((input as HTMLInputElement).dataset.level!);
        newLevels[lvl] = (input as HTMLInputElement).value;
      });

      this.customTheme = {
        name: 'My Custom Theme',
        background: THEMES.deepSpace.background,
        glassBg: THEMES.deepSpace.glassBg,
        glassBorder: THEMES.deepSpace.glassBorder,
        levels: newLevels
      };

      localStorage.setItem('flux-merge-custom-theme', JSON.stringify(this.customTheme));
      this.applyTheme('custom');
      lab.style.display = 'none';
    };

    lab.appendChild(controls);
    lab.appendChild(saveBtn);
    document.getElementById('ui-overlay')!.appendChild(lab);
  }

  private applyTheme(themeId: string) {
    let theme: Theme;

    if (themeId === 'custom' || (themeId === 'custom' && this.customTheme)) {
      if (!this.customTheme) {
        console.warn('No custom theme loaded');
        theme = THEMES.deepSpace;
      } else {
        theme = this.customTheme;
      }
    } else {
      theme = THEMES[themeId] || THEMES.deepSpace;
    }

    document.body.style.background = theme.background;

    document.querySelectorAll('.glass-panel').forEach(el => {
      (el as HTMLElement).style.background = theme.glassBg;
      (el as HTMLElement).style.borderColor = theme.glassBorder;
    });

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeId }));
    if (themeId !== 'custom') {
      localStorage.setItem('flux-merge-theme', themeId);
    }
  }

  public updateScore(score: number) {
    this.scoreElement.innerText = score.toString();
  }

  public updateHighScore(highScore: number) {
    this.highScoreElement.innerText = highScore.toString();
  }

  public showGameOver() {
    this.gameOverModal.style.display = 'flex';
  }

  public showWin() {
    this.winModal.style.display = 'flex';
  }

  public hideAll() {
    this.gameOverModal.style.display = 'none';
    this.winModal.style.display = 'none';
  }

  public hideIntro() {
    this.introScreen.classList.add('hidden');
  }
}

