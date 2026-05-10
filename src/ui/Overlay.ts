export class Overlay {
  private scoreElement: HTMLElement;
  private gameOverModal: HTMLElement;
  private winModal: HTMLElement;

  constructor() {
    this.scoreElement = document.getElementById('scoreValue')!;
    this.gameOverModal = document.getElementById('gameOverModal')!;
    this.winModal = document.getElementById('winModal')!;
  }

  public updateScore(score: number) {
    this.scoreElement.innerText = score.toString();
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
}
