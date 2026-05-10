/**
 * Flux Merge Core Game Engine
 * Version: 1.0.1 - Stability Update
 */
import { Node } from './Node';
import { Renderer } from '../ui/Renderer';
import { Input } from '../ui/Input';
import { Physics } from './Physics';
import { Ripple } from './Ripple';
import { Overlay } from '../ui/Overlay';
import { GAME_CONFIG, THEMES } from '../assets/constants';

export class Game {
  private nodes: Node[] = [];
  private ripples: Ripple[] = [];
  private renderer: Renderer;
  private input: Input;
  private overlay: Overlay;
  private score: number = 0;
  private highScore: number = 0;
  private currentTheme: string = 'deepSpace';
  private isGameOver: boolean = false;
  private isWin: boolean = false;
  private isPlaying: boolean = false;

  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.input = new Input('gameCanvas', (node, x, y) => this.handleNodeDrag(node, x, y));
    this.overlay = new Overlay();
    
    window.addEventListener('themeChanged', (e: any) => {
      this.currentTheme = e.detail;
      this.updateNodeColors();
    });

    const savedTheme = localStorage.getItem('flux-merge-theme');
    if (savedTheme) {
      this.currentTheme = savedTheme;
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: savedTheme }));
    }
  }

  public start() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        this.overlay.hideIntro();
        this.isPlaying = true;
        this.initGame();
        this.setupInput();
        this.gameLoop();
      };
    }
  }

  private setupInput() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    
    const handleStart = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      }

      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const node = this.nodes.find(n => this.getDistance({x, y} as any, n) < n.radius * 1.5);
      if (node) {
        this.input.setDraggedNode(node);
        node.isDragging = true;
      }
    };

    const handleEnd = () => {
      this.nodes.forEach(n => {
        if (n.isDragging) {
          Physics.snapToGrid(n);
        }
        n.isDragging = false;
      });
      this.input.setDraggedNode(null);
    };

    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchend', handleEnd);
  }

  private handleNodeDrag(node: Node, x: number, y: number) {
    node.targetX = x;
    node.targetY = y;
  }

  private initGame() {
    this.highScore = parseInt(localStorage.getItem('flux-merge-highscore') || '0');
    this.overlay.updateHighScore(this.highScore);

    for (let i = 0; i < 4; i++) {
      this.spawnNode();
    }
  }

  private spawnNode() {
    const cellSize = 600 / GAME_CONFIG.GRID_SIZE;
    const occupied = new Set(this.nodes.map(n => `${n.gridX},${n.gridY}`));

    const availableCells = [];
    for (let x = 0; x < GAME_CONFIG.GRID_SIZE; x++) {
      for (let y = 0; y < GAME_CONFIG.GRID_SIZE; y++) {
        if (!occupied.has(`${x},${y}`)) {
          availableCells.push({ x, y });
        }
      }
    }

    if (availableCells.length === 0) {
      console.log('[Game] Grid Full - Game Over');
      this.isGameOver = true;
      this.overlay.showGameOver();
      return;
    }

    const cell = availableCells[Math.floor(Math.random() * availableCells.length)];
    const x = cell.x * cellSize + cellSize / 2;
    const y = cell.y * cellSize + cellSize / 2;

    const node = new Node(x, y, cell.x, cell.y);
    this.updateNodeColor(node);
    this.nodes.push(node);
  }

  private updateNodeColors() {
    this.nodes.forEach(node => this.updateNodeColor(node));
  }

  private updateNodeColor(node: Node) {
    const theme = THEMES[this.currentTheme];
    node.color = theme.levels[node.level];
  }

  private update() {
    if (!this.isPlaying || this.isGameOver || this.isWin) return;

    // Apply magnetic attraction
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        Physics.applyMagneticPull(this.nodes[i], this.nodes[j]);
      }
    }

    this.nodes.forEach(node => node.update());
    this.ripples.forEach(ripple => ripple.update());
    this.ripples = this.ripples.filter(r => !r.isDead);
    
    this.checkMerges();
  }

  private checkMerges() {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];

        if (a.level === b.level && this.getDistance(a, b) < a.radius * 2) {
          this.mergeNodes(i, j);
          return; 
        }
      }
    }
  }

  private mergeNodes(indexA: number, indexB: number) {
    const a = this.nodes[indexA];
    const b = this.nodes[indexB];
    const newLevel = a.level + 1;

    console.log(`[Game] Merging Lvl ${a.level} nodes into Lvl ${newLevel}. Score: ${this.score}`);

    if (newLevel > 5) {
      this.isWin = true;
      this.overlay.showWin();
      return;
    }

    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;
    
    const cellSize = 600 / GAME_CONFIG.GRID_SIZE;
    const gridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newX / cellSize)));
    const gridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newY / cellSize)));

    const mergedNode = new Node(newX, newY, gridX, gridY, newLevel);
    this.updateNodeColor(mergedNode);
    
    mergedNode.scale = 1.4;
    this.ripples.push(new Ripple(newX, newY, mergedNode.color, GAME_CONFIG.PULSE_RADIUS));

    this.score += mergedNode.scoreValue;
    this.overlay.updateScore(this.score);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.overlay.updateHighScore(this.highScore);
      localStorage.setItem('flux-merge-highscore', this.highScore.toString());
    }

    this.nodes = this.nodes.filter((_, idx) => idx !== indexA && idx !== indexB);
    this.nodes.push(mergedNode);

    this.spawnNode();
  }

  private getDistance(a: any, b: any): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private gameLoop() {
    try {
      this.update();
      this.renderer.clear();
      this.renderer.drawGrid();
      this.nodes.forEach(node => this.renderer.drawNode(node));
      this.ripples.forEach(ripple => this.renderer.drawRipple(ripple));

      requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
      console.error('[Game] Critical loop error:', e);
    }
  }
}
