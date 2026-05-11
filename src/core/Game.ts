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

interface Point {
  x: number;
  y: number;
}

export class Game {
  private nodes: Node[] = [];
  private ripples: Ripple[] = [];
  private renderer: Renderer;
  private overlay: Overlay;
  private score: number = 0;
  private highScore: number = 0;
  private currentTheme: string = 'deepSpace';
  private isGameOver: boolean = false;
  private isWin: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastSpawnTime: number = 0;
  private readonly SPAWN_INTERVAL = 4000;

  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.overlay = new Overlay();
    
    new Input('gameCanvas', {
      findNode: (x, y) => this.findNodeAt(x, y),
      onDragStart: (node) => this.handleDragStart(node),
      onDragMove: (node, x, y) => this.handleDragMove(node, x, y),
      onDragEnd: (node) => this.handleDragEnd(node),
    });

    window.addEventListener('themeChanged', (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      this.currentTheme = customEvent.detail;
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
        this.gameLoop();
      };
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private findNodeAt(x: number, y: number): Node | null {
    return this.nodes.find(n => this.getDistance({x, y}, n) < n.radius * 1.5) || null;
  }

  private handleDragStart(node: Node) {
    node.isDragging = true;
  }

  private handleDragMove(node: Node, x: number, y: number) {
    node.targetX = x;
    node.targetY = y;
  }

  private handleDragEnd(node: Node) {
    Physics.snapToGrid(node);
    node.isDragging = false;
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

    // Snap to exact center of the grid cell for deterministic placement
    const snappedX = gridX * cellSize + cellSize / 2;
    const snappedY = gridY * cellSize + cellSize / 2;

    const mergedNode = new Node(snappedX, snappedY, gridX, gridY, newLevel);
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

  private getDistance(a: Point, b: Node): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private gameLoop() {
    try {
      this.update();
      this.renderer.clear();
      this.renderer.drawGrid();
      this.nodes.forEach(node => this.renderer.drawNode(node));
      this.ripples.forEach(ripple => this.renderer.drawRipple(ripple));

      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
      console.error('[Game] Critical loop error:', e);
    }
  }
}
