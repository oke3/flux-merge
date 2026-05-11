/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
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
import { AudioEngine } from '../assets/AudioEngine';
import { GAME_CONFIG, THEMES, NodeType } from '../assets/constants';

interface Point {
  x: number;
  y: number;
}

export class Game {
  private nodes: Node[] = [];
  private ripples: Ripple[] = [];
  private renderer: Renderer;
  private overlay: Overlay;
  private audio: AudioEngine;
  private score: number = 0;
  private highScore: number = 0;
  private currentTheme: string = 'deepSpace';
  private isGameOver: boolean = false;
  private isWin: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastSpawnTime: number = 0;
  private readonly BASE_SPAWN_INTERVAL = 4000;
  private readonly MIN_SPAWN_INTERVAL = 1200;
  private readonly MAX_DIFFICULTY_SCORE = 2000;

  // Combo & Frenzy State
  private comboCount: number = 1;
  private comboTimer: number = 0;
  private isFrenzy: boolean = false;
  private frenzyTimer: number = 0;
  private readonly COMBO_TIMEOUT = 1500;
  private readonly FRENZY_DURATION = 5000;

  private get currentSpawnInterval(): number {
    const reduction = (this.score / this.MAX_DIFFICULTY_SCORE) * (this.BASE_SPAWN_INTERVAL - this.MIN_SPAWN_INTERVAL);
    return Math.max(this.MIN_SPAWN_INTERVAL, this.BASE_SPAWN_INTERVAL - reduction);
  }

  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.overlay = new Overlay();
    this.audio = new AudioEngine();
    
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
        this.audio.playBackgroundAmbience();
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
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
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

    let type: NodeType = NodeType.STANDARD;
    if (Math.random() < GAME_CONFIG.SPECIAL_NODE_CHANCE) {
      type = Math.random() > 0.5 ? NodeType.VOID : NodeType.STAR;
    }

    const node = new Node(x, y, cell.x, cell.y, 1, type);
    this.updateNodeColor(node);
    this.nodes.push(node);
  }

  private updateNodeColors() {
    this.nodes.forEach(node => this.updateNodeColor(node));
  }

  private updateNodeColor(node: Node) {
    if (node.type === NodeType.VOID) {
      node.color = '#000000';
    } else if (node.type === NodeType.STAR) {
      node.color = '#FFD700';
    } else {
      const theme = THEMES[this.currentTheme];
      node.color = theme.levels[node.level];
    }
  }

  private update() {
    if (!this.isPlaying || this.isGameOver || this.isWin) return;

    const now = performance.now();

    if (this.comboTimer > 0) {
      this.comboTimer -= 16.67;
      if (this.comboTimer <= 0) {
        this.comboCount = 1;
        this.overlay.updateCombo(this.comboCount);
      }
    }

    if (this.isFrenzy) {
      this.frenzyTimer -= 16.67;
      if (this.frenzyTimer <= 0) {
        this.isFrenzy = false;
        this.audio.setAmbiencePitch(1);
      }
    }

    if (now - this.lastSpawnTime > this.currentSpawnInterval) {
      this.spawnNode();
      this.lastSpawnTime = now;
    }

    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const strengthMultiplier = this.isFrenzy ? 2.5 : 1;
        Physics.applyMagneticPull(this.nodes[i], this.nodes[j], strengthMultiplier);
      }
    }

    this.nodes.forEach(node => node.update());
    this.ripples.forEach(ripple => ripple.update());
    this.ripples = this.ripples.filter(r => !r.isDead);
    
    if (this.isFrenzy && Math.random() < 0.02) {
      this.audio.playFrenzySiren();
    }

    this.handleVoidConsumption();
    this.checkMerges();
  }

  private handleVoidConsumption() {
    for (let i = 0; i < this.nodes.length; i++) {
      const voidNode = this.nodes[i];
      if (voidNode.type !== NodeType.VOID) continue;

      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const other = this.nodes[j];
        if (other.type === NodeType.VOID) continue;

        if (this.getDistance(voidNode, other) < GAME_CONFIG.VOID_CONSUMPTION_RADIUS) {
          this.ripples.push(new Ripple(other.x, other.y, '#000000', GAME_CONFIG.PULSE_RADIUS * 0.5));
          this.audio.playMerge(1);
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
          this.nodes = this.nodes.filter((_, idx) => idx !== j);
          break; 
        }
      }
    }
  }

  private checkMerges() {
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const a = this.nodes[i];
        const b = this.nodes[j];
        const canMerge = (a.level === b.level) || (a.type === NodeType.STAR) || (b.type === NodeType.STAR);
        if (canMerge && this.getDistance(a, b) < a.radius * 2) {
          if (a.type === NodeType.VOID || b.type === NodeType.VOID) continue;
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

    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT;
    this.overlay.updateCombo(this.comboCount);

    if (this.comboCount >= 3 && !this.isFrenzy) {
      this.isFrenzy = true;
      this.frenzyTimer = this.FRENZY_DURATION;
      this.audio.setAmbiencePitch(1.5);
      this.audio.playFrenzySiren();
    }

    if (newLevel > 5) {
      this.isWin = true;
      this.audio.playSingularity();
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      this.overlay.showWin();
      return;
    }

    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newX / cellSize)));
    const gridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(newY / cellSize)));
    const snappedX = gridX * cellSize + cellSize / 2;
    const snappedY = gridY * cellSize + cellSize / 2;

    const mergedNode = new Node(snappedX, snappedY, gridX, gridY, newLevel);
    this.updateNodeColor(mergedNode);
    mergedNode.scale = 1.6;
    this.ripples.push(new Ripple(newX, newY, mergedNode.color, GAME_CONFIG.PULSE_RADIUS));
    this.audio.playMerge(newLevel);
    if ('vibrate' in navigator) {
      navigator.vibrate(newLevel >= 4 ? 100 : 50);
    }

    const multiplier = this.comboCount > 1 ? this.comboCount : 1;
    this.score += mergedNode.scoreValue * multiplier;
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
