/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
/**
 * Flux Merge Core Game Engine
 * Version: 1.0.1 - Stability Update
 */
import { Node } from './Node';
import type { IRenderer } from '../ui/IRenderer';
import { Renderer } from '../ui/Renderer';
import { Input } from '../ui/Input';
import { Physics } from './Physics';
import { Ripple } from './Ripple';
import { UIManager } from '../ui/UIManager';
import { AudioEngine } from '../assets/AudioEngine';
import { ParticleSystem } from './ParticleSystem';
import { StorageManager, type GameSession } from './StorageManager';
import { BadgeManager } from './BadgeManager';
import { ProfileManager, type UserProfile } from './ProfileManager';
import { GAME_CONFIG, THEMES, NodeType } from '../assets/constants';

interface Point {
  x: number;
  y: number;
}

export class Game {
  private nodes: Node[] = [];
  private ripples: Ripple[] = [];
  private particles: ParticleSystem;
  private renderer: IRenderer;
  private ui: UIManager;
  private audio: AudioEngine;
  private profile: UserProfile;
  private score: number = 0;
  private highScore: number = 0;
  private currentTheme: string = 'deepSpace';
  private isGameOver: boolean = false;
  private isWin: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastSpawnTime: number = 0;
  private startTime: number = 0;
  private readonly BASE_SPAWN_INTERVAL = 4000;
  private readonly MIN_SPAWN_INTERVAL = 1200;
  private readonly MAX_DIFFICULTY_SCORE = 2000;
  private tutorialActive: boolean = true;
  private tutorialStep: number = 0;
  private tutorialTimer: any = null;
  private pulsarTimer: number = 0;
  private readonly PULSAR_INTERVAL = 3000;

  // Sensory State
  private backgroundOffset: number = 0;
  private screenShakeIntensity: number = 0;
  private screenShakeDuration: number = 0;

  // Combo & Frenzy State
  private comboCount: number = 1;
  private comboTimer: number = 0;
  private isFrenzy: boolean = false;
  private frenzyTimer: number = 0;
  private readonly COMBO_TIMEOUT = 1500;

  // Achievement State
  private supernovaTriggered: boolean = false;

  private get currentSpawnInterval(): number {
    const reduction = (this.score / this.MAX_DIFFICULTY_SCORE) * (this.BASE_SPAWN_INTERVAL - this.MIN_SPAWN_INTERVAL);
    return Math.max(this.MIN_SPAWN_INTERVAL, this.BASE_SPAWN_INTERVAL - reduction);
  }

  constructor() {
    this.profile = ProfileManager.loadProfile();
    this.currentTheme = this.profile.settings.theme;
    this.particles = new ParticleSystem();
    this.renderer = new Renderer('gameCanvas');
    this.ui = new UIManager();
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

    window.addEventListener('tutorialToggled', (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      this.tutorialActive = customEvent.detail;
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
        this.ui.hideAll();
        this.isPlaying = true;
        this.audio.playBackgroundAmbience();
        this.initGame();
        this.startTime = performance.now();
        this.gameLoop();
        
        if (this.tutorialActive) {
          this.tutorialStep = 0;
          this.triggerTutorial();
        }
      };
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.tutorialTimer) {
      clearTimeout(this.tutorialTimer);
      this.tutorialTimer = null;
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.saveCurrentSession();
  }

  private saveCurrentSession() {
    const duration = Math.floor((performance.now() - this.startTime) / 1000);
    const maxLevel = this.nodes.length > 0 ? Math.max(...this.nodes.map(n => n.level)) : 1;
    
    const session: GameSession = {
      date: new Date().toISOString(),
      score: this.score,
      maxLevel: maxLevel,
      duration: duration
    };
    StorageManager.saveSession(session);
  }

  public getCombo() { return this.comboCount; }
  public hasTriggeredSupernova() { return this.supernovaTriggered; }

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
    this.ui.updateHighScore(this.highScore);

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
      this.ui.showGameOver();
      this.stop();
      return;
    }

    const cell = availableCells[Math.floor(Math.random() * availableCells.length)];
    const x = cell.x * cellSize + cellSize / 2;
    const y = cell.y * cellSize + cellSize / 2;

    let type: NodeType = NodeType.STANDARD;
    const specialChance = ProfileManager.getAbilityValue('specialChance', this.profile);
    if (Math.random() < specialChance) {
      const rand = Math.random();
      if (rand < 0.1) {
        type = NodeType.SUPERNOVA;
      } else if (rand < 0.3) {
        type = NodeType.PULSAR;
      } else if (rand < 0.6) {
        type = NodeType.VOID;
      } else {
        type = NodeType.STAR;
      }
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
    } else if (node.type === NodeType.SUPERNOVA) {
      node.color = '#FF4500';
    } else if (node.type === NodeType.PULSAR) {
      node.color = '#00FFCC';
    } else if (node.type === NodeType.PRISM) {
      node.color = '#FF00FF';
    } else {
      const theme = THEMES[this.currentTheme];
      node.color = theme.levels[node.level];
    }
  }

  private update() {
    if (!this.isPlaying || this.isGameOver || this.isWin) return;

    const now = performance.now();

    // Update Sensory State
    this.backgroundOffset += 0.1;
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= 16.67;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= 16.67;
      if (this.comboTimer <= 0) {
        this.comboCount = 1;
        this.ui.updateCombo(this.comboCount);
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

    // Handle Pulsar Repulsion
    this.pulsarTimer -= 16.67;
    if (this.pulsarTimer <= 0) {
      this.triggerPulsarWave();
      this.pulsarTimer = this.PULSAR_INTERVAL;
    }
const magneticStrength = ProfileManager.getAbilityValue('magneticPull', this.profile);
const strengthMultiplier = this.isFrenzy ? 2.5 : 1;

// Spatial Partitioning: Group nodes by grid cell
const gridMap: Record<string, Node[]> = {};
this.nodes.forEach(node => {
  const key = `${node.gridX},${node.gridY}`;
  if (!gridMap[key]) gridMap[key] = [];
  gridMap[key].push(node);
});

for (const node of this.nodes) {
  const nearbyNodes: Node[] = [];
  // Check current cell and 8 neighbors
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const key = `${node.gridX + dx},${node.gridY + dy}`;
      if (gridMap[key]) {
        nearbyNodes.push(...gridMap[key]);
      }
    }
  }
  Physics.applyMagneticPull(node, nearbyNodes, strengthMultiplier * (magneticStrength / 0.05));
}

this.nodes.forEach(node => node.update());
this.ripples.forEach(ripple => ripple.update());
this.ripples = this.ripples.filter(r => !r.isDead);
this.particles.update();

if (this.isFrenzy && Math.random() < 0.02) {
  this.audio.playFrenzySiren();
}

this.handleVoidConsumption();
this.handleSupernovas();
this.checkMerges();
}

private triggerPulsarWave() {    const pulsars = this.nodes.filter(n => n.type === NodeType.PULSAR);
    pulsars.forEach(p => {
      this.ripples.push(new Ripple(p.x, p.y, p.color, GAME_CONFIG.PULSE_RADIUS));
      this.particles.spawnBurst(p.x, p.y, p.color, 20);
      
      this.nodes.forEach(node => {
        if (node !== p) {
          Physics.applyRepulsion(node, p.x, p.y, 1.5);
        }
      });
    });
  }

  private triggerShake(intensity: number, duration: number = 200) {
    this.screenShakeIntensity = intensity;
    this.screenShakeDuration = duration;
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
          this.particles.spawnBurst(other.x, other.y, '#000000', 15);
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

  private handleSupernovas() {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node.type !== NodeType.SUPERNOVA) continue;

      for (let j = 0; j < this.nodes.length; j++) {
        if (i === j) continue;
        const other = this.nodes[j];
        if (this.getDistance(node, other) < node.radius * 2) {
          this.triggerSupernova(node);
          return;
        }
      }
    }
  }

  private triggerSupernova(supernova: Node) {
    const { gridX, gridY, x, y } = supernova;
    
    this.supernovaTriggered = true;
    this.ripples.push(new Ripple(x, y, '#FF4500', GAME_CONFIG.PULSE_RADIUS * 2));
    this.particles.spawnBurst(x, y, '#FF4500', 100);
    this.triggerShake(20, 400);
    this.audio.playSingularity(); 
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    this.nodes = this.nodes.filter(node => {
      const isInside = Math.abs(node.gridX - gridX) <= 1 && Math.abs(node.gridY - gridY) <= 1;
      if (isInside && node !== supernova) {
        this.particles.spawnBurst(node.x, node.y, node.color, 10);
        this.score += 50;
      }
      return !isInside;
    });
    
    this.ui.updateScore(this.score);
  }

  private checkMerges() {
    let mergeOccurred = false;
    let cascadeCount = 0;
    const MAX_CASCADES = 5;

    while (!mergeOccurred && cascadeCount < MAX_CASCADES) {
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const a = this.nodes[i];
          const b = this.nodes[j];
          const canMerge = (a.level === b.level) || (a.type === NodeType.STAR) || (b.type === NodeType.STAR);
          if (canMerge && this.getDistance(a, b) < a.radius * 2) {
            if (a.type === NodeType.VOID || b.type === NodeType.VOID) continue;
            this.mergeNodes(i, j);
            mergeOccurred = true;
            cascadeCount++;
            break; 
          }
        }
        if (mergeOccurred) break;
      }
      if (!mergeOccurred) break;
    }
  }

  private mergeNodes(indexA: number, indexB: number) {
    const a = this.nodes[indexA];
    const b = this.nodes[indexB];
    
    if (a.type === NodeType.PRISM || b.type === NodeType.PRISM) {
      this.handlePrismSplit(a, b);
      this.nodes = this.nodes.filter((_, idx) => idx !== indexA && idx !== indexB);
      return;
    }

    const newLevel = a.level + 1;

    this.comboCount++;
    this.comboTimer = this.COMBO_TIMEOUT;
    this.ui.updateCombo(this.comboCount);

    if (this.comboCount >= 3 && !this.isFrenzy) {
      this.isFrenzy = true;
      this.frenzyTimer = ProfileManager.getAbilityValue('frenzyDuration', this.profile);
      this.audio.setAmbiencePitch(1.5);
      this.audio.playFrenzySiren();
    }

    if (newLevel > 5) {
      this.isWin = true;
      this.audio.playSingularity();
      this.triggerShake(15, 500);
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      this.ui.showWin();
      this.stop();
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
    this.particles.spawnBurst(newX, newY, mergedNode.color, 25);
    this.triggerShake(newLevel * 1.5);
    this.audio.playMerge(newLevel);
    if ('vibrate' in navigator) {
      navigator.vibrate(newLevel >= 4 ? 100 : 50);
    }

    const multiplier = this.comboCount > 1 ? this.comboCount : 1;
    const points = mergedNode.scoreValue * multiplier;
    this.score += points;
    this.ui.updateScore(this.score);

    // Add XP to profile
    ProfileManager.addXP(this.profile, points * 0.5);
    ProfileManager.saveProfile(this.profile);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.ui.updateHighScore(this.highScore);
      localStorage.setItem('flux-merge-highscore', this.highScore.toString());
    }

    this.nodes = this.nodes.filter((_, idx) => idx !== indexA && idx !== indexB);
    this.nodes.push(mergedNode);
    this.spawnNode();
    
    BadgeManager.checkAchievements(this);
  }

  private handlePrismSplit(a: Node, b: Node) {
    const newX = (a.x + b.x) / 2;
    const newY = (a.y + b.y) / 2;
    
    this.ripples.push(new Ripple(newX, newY, '#FF00FF', GAME_CONFIG.PULSE_RADIUS * 0.7));
    this.particles.spawnBurst(newX, newY, '#FF00FF', 30);
    this.audio.playMerge(1);

    const level = Math.max(a.level, b.level);
    const splitLevel = Math.max(1, level - 1);

    // Find nearest available grid cells to prevent overlap
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const occupied = new Set(this.nodes.map(n => `${n.gridX},${n.gridY}`));
    
    const findNearestAvailable = (targetX: number, targetY: number) => {
      const targetGridX = Math.floor(targetX / cellSize);
      const targetGridY = Math.floor(targetY / cellSize);
      
      // Search in expanding rings
      for (let r = 0; r < GAME_CONFIG.GRID_SIZE; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            const gx = targetGridX + dx;
            const gy = targetGridY + dy;
            if (gx >= 0 && gx < GAME_CONFIG.GRID_SIZE && gy >= 0 && gy < GAME_CONFIG.GRID_SIZE) {
              if (!occupied.has(`${gx},${gy}`)) {
                return { gx, gy };
              }
            }
          }
        }
      }
      return { gx: 0, gy: 0 }; // Fallback
    };

    for (let i = 0; i < 2; i++) {
      const offset = (i === 0 ? -20 : 20);
      const tx = newX + offset;
      const ty = newY + offset;
      
      const { gx, gy } = findNearestAvailable(tx, ty);
      occupied.add(`${gx},${gy}`);
      
      const snappedX = gx * cellSize + cellSize / 2;
      const snappedY = gy * cellSize + cellSize / 2;
      
      const node = new Node(snappedX, snappedY, gx, gy, splitLevel);
      this.updateNodeColor(node);
      this.nodes.push(node);
    }
  }

  private triggerTutorial() {
    const steps = [
      'Welcome to the Cosmos. Drag nodes of the same color to merge them.',
      'Reach the Singularity (Level 5) to win the game.',
      'Careful! Pulsar nodes (Cyan) push others away, while Prism nodes (Magenta) split apart.',
      'Earn XP to upgrade your abilities in the Cosmic Profile.'
    ];

    if (this.tutorialStep >= steps.length) {
      this.tutorialActive = false;
      this.tutorialStep = 0;
      return;
    }

    this.ui.showTutorial(steps[this.tutorialStep]);
    
    this.tutorialTimer = setTimeout(() => {
      this.tutorialStep++;
      this.triggerTutorial();
    }, 6000);
  }

  private getDistance(a: Point, b: Node): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private gameLoop() {
    try {
      this.update();
      this.renderer.clear();
      this.renderer.drawBackground(this.backgroundOffset);
      this.renderer.drawGrid();
      
      // Apply screen shake translation
      this.renderer.applyShake(this.screenShakeIntensity);
      
      this.nodes.forEach(node => this.renderer.drawNode(node));
      this.ripples.forEach(ripple => this.renderer.drawRipple(ripple));
      this.renderer.drawParticles(this.particles.getParticles());
      
      this.renderer.resetShake();
      
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
      console.error('[Game] Critical loop error:', e);
    }
  }
}
