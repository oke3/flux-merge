import { THEMES } from '../assets/constants';

export class Overlay {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private gameOverModal: HTMLElement;
  private winModal: HTMLElement;
  private introScreen: HTMLElement;

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

    this.setupThemeSelector();
  }

  private setupThemeSelector() {
    const container = document.createElement('div');
    container.className = 'glass-panel';
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.pointerEvents = 'auto';

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

    select.onchange = (e) => {
      const themeId = (e.target as HTMLSelectElement).value;
      this.applyTheme(themeId);
    };

    container.appendChild(label);
    container.appendChild(select);
    document.querySelector('.overlay')!.appendChild(container);
  }

  private applyTheme(themeId: string) {
    const theme = THEMES[themeId];
    document.body.style.background = theme.background;

    document.querySelectorAll('.glass-panel').forEach(el => {
      (el as HTMLElement).style.background = theme.glassBg;
      (el as HTMLElement).style.borderColor = theme.glassBorder;
    });

    window.dispatchEvent(new CustomEvent('themeChanged', { detail: themeId }));
    localStorage.setItem('flux-merge-theme', themeId);
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

