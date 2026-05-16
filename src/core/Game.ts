/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
/**
 * Flux Merge Core Game Engine
 * Version: 1.0.1 - Stability Update
 */
import { GameNode } from './GameNode';
import { EntityManager } from './EntityManager';
import { CollisionSystem, type CollisionHandler } from './CollisionSystem';
import { GameStateManager, type GameStateListener } from './GameStateManager';
import { WorldSystem } from './WorldSystem';
 import type { IRenderer } from '../ui/IRenderer';
 import { Renderer } from '../ui/Renderer';
 import { ScoreManager } from './ScoreManager';
 import { AudioManager } from './AudioManager';
 import { Input } from '../ui/Input';
 import { Physics } from './Physics';
 import { Ripple } from './Ripple';
 import { UIManager } from '../ui/UIManager';
 import { ParticleSystem } from './ParticleSystem';
 import { StorageManager, type GameSession } from './StorageManager';
 import { BadgeManager } from './BadgeManager';
 import { ProfileManager, type UserProfile } from './ProfileManager';
 import { GAME_CONFIG, NodeType, GameState } from '../assets/constants';

interface Point {
  x: number;
  y: number;
}

export class Game implements CollisionHandler, GameStateListener {
  private entityManager: EntityManager;
  private collisionSystem: CollisionSystem;
  private stateManager: GameStateManager;
  private worldSystem: WorldSystem;
  private ripples: Ripple[] = [];
  private particles: ParticleSystem;
  private renderer: IRenderer;
  private ui: UIManager;
  private audioManager: AudioManager;
  private scoreManager: ScoreManager;
  private profile: UserProfile;
  private currentTheme: string = 'deepSpace';
  private isWin: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private pendingNodes: GameNode[] = [];
  private lastSpawnTime: number = 0;
  private startTime: number = 0;
  private readonly BASE_SPAWN_INTERVAL = 4000;
  private readonly MIN_SPAWN_INTERVAL = 1200;
  private readonly MAX_DIFFICULTY_SCORE = 2000;
  private tutorialActive: boolean = true;
  private tutorialStep: number = 0;
  private tutorialTimer: any = null;

  public get nodes(): GameNode[] {
    return this.entityManager.allNodes;
  }

  public set nodes(value: GameNode[]) {
    this.entityManager.reset();
    value.forEach(node => this.entityManager.addNode(node));
  }

  // CollisionHandler Implementation
  public addScore(points: number) {
    this.scoreManager.addScore(points);
  }

  public incrementCombo() {
    this.scoreManager.incrementCombo();
  }

  public triggerFrenzy(duration: number) {
    this.isFrenzy = true;
    this.frenzyTimer = duration;
    this.audioManager.triggerFrenzyAudio();
  }

  public playMergeSound(level: number) {
    this.audioManager.playMerge(level);
  }

  public spawnBurst(x: number, y: number, color: string, count: number) {
    this.particles.spawnBurst(x, y, color, count);
  }

  public addRipple(ripple: Ripple) {
    this.ripples.push(ripple);
  }

  public triggerShake(intensity: number) {
    this.worldSystem.triggerShake(intensity);
  }

  public spawnNode() {
    this.spawnGameNode();
  }

  public transitionToWin() {
    this.transitionTo(GameState.WIN);
  }

  public checkAchievements() {
    BadgeManager.checkAchievements(this);
  }

  public updateNodeColor(node: GameNode, theme: string) {
    this.entityManager.updateNodeColor(node, theme);
  }

  public addNode(node: GameNode) {
    this.entityManager.addNode(node);
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  // Combo & Frenzy State
  private isFrenzy: boolean = false;
  private frenzyTimer: number = 0;

  // Achievement State
  private supernovaTriggered: boolean = false;

  private get currentSpawnInterval(): number {
    const reduction = (this.scoreManager.getScore() / this.MAX_DIFFICULTY_SCORE) * (this.BASE_SPAWN_INTERVAL - this.MIN_SPAWN_INTERVAL);
    return Math.max(this.MIN_SPAWN_INTERVAL, this.BASE_SPAWN_INTERVAL - reduction);
  }

  constructor() {
    console.log('[Game] Initializing...');
    this.profile = ProfileManager.loadProfile();
    this.currentTheme = this.profile.settings.theme;
    this.entityManager = new EntityManager();
    this.collisionSystem = new CollisionSystem();
    this.stateManager = new GameStateManager(this);
    this.worldSystem = new WorldSystem();
    this.particles = new ParticleSystem();
    this.renderer = new Renderer('gameCanvas');
    this.ui = new UIManager();
    this.audioManager = new AudioManager();
    this.scoreManager = new ScoreManager(this.ui);
    this.ui.setGame(this);
    console.log('[Game] Core systems initialized');
    
    new Input('gameCanvas', {
      findNode: (x, y) => this.findGameNodeAt(x, y),
      onDragStart: (node) => this.handleDragStart(node),
      onDragMove: (node, x, y) => this.handleDragMove(node, x, y),
      onDragEnd: (node) => this.handleDragEnd(node),
    });

    window.addEventListener('themeChanged', (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      this.currentTheme = customEvent.detail;
      this.updateGameNodeColors();
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
    console.log('[Game] Constructor complete');
    
    // Set initial UI state
    this.ui.handleStateChange(this.stateManager.getCurrentState());
  }

  public onStateChange(newState: GameState) {
    console.log(`[Game] Handling state change to: ${newState}`);
    this.ui.handleStateChange(newState);

    switch (newState) {
      case GameState.PLAYING:
        this.isPlaying = true;
        this.audioManager.startAmbience();
        break;
      case GameState.PAUSED:
        break;
      case GameState.MENU:
        this.stop();
        break;
      case GameState.GAME_OVER:
      case GameState.WIN:
        this.stop();
        break;
    }
  }

  public transitionTo(newState: GameState) {
    this.stateManager.transitionTo(newState);
  }

  public pause() {
    if (this.stateManager.getCurrentState() === GameState.PLAYING) {
      this.transitionTo(GameState.PAUSED);
    }
  }

  public resume() {
    if (this.stateManager.getCurrentState() === GameState.PAUSED) {
      this.transitionTo(GameState.PLAYING);
    }
  }

  public restart() {
    this.reset();
    this.initGame();
    this.startTime = performance.now();
    this.transitionTo(GameState.PLAYING);
    this.gameLoop();
  }

  public returnToMenu() {
    this.transitionTo(GameState.MENU);
  }

  public start() {
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        this.reset();
        this.initGame();
        this.startTime = performance.now();
        this.transitionTo(GameState.PLAYING);
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

  // Removed togglePauseControls helper as it's now in UIManager

  public reset() {
    this.entityManager.reset();
    this.ripples = [];
    this.scoreManager.reset();
    this.isWin = false;
    this.supernovaTriggered = false;
    this.isFrenzy = false;
    this.frenzyTimer = 0;
  }

  private saveCurrentSession() {

    const duration = Math.floor((performance.now() - this.startTime) / 1000);
    const maxLevel = this.entityManager.allNodes.length > 0 ? Math.max(...this.entityManager.allNodes.map(n => n.level)) : 1;
    
    const session: GameSession = {
      date: new Date().toISOString(),
      score: this.scoreManager.getScore(),
      maxLevel: maxLevel,
      duration: duration
    };
    StorageManager.saveSession(session);
  }

  public hasTriggeredSupernova() { return this.supernovaTriggered; }
  public getScore() { return this.scoreManager.getScore(); }
  public getCombo() { return this.scoreManager.getCombo(); }
  public getIsWin() { return this.isWin; }

  private findGameNodeAt(x: number, y: number): GameNode | null {
    return this.entityManager.findNodeAt(x, y);
  }

  private handleDragStart(node: GameNode) {
    node.isDragging = true;
  }

  private handleDragMove(node: GameNode, x: number, y: number) {
    node.targetX = x;
    node.targetY = y;
  }

  private handleDragEnd(node: GameNode) {
    Physics.snapToGrid(node);
    node.isDragging = false;
  }

  private initGame() {
    for (let i = 0; i < 4; i++) {
      this.spawnGameNode();
    }
  }

  private spawnGameNode() {
    const node = this.entityManager.spawnNode(this.profile, this.currentTheme);
    if (!node) {
      console.log('[Game] Grid Full - Game Over');
      this.transitionTo(GameState.GAME_OVER);
    }
  }

  private updateGameNodeColors() {
    this.entityManager.updateAllColors(this.currentTheme);
  }

  private update() {
    if (this.stateManager.getCurrentState() !== GameState.PLAYING) return;

    const now = performance.now();

    this.worldSystem.update(this.entityManager.allNodes, this, 16.67);

    if (this.scoreManager.getComboTimer() > 0) {
      this.scoreManager.updateComboTimer(16.67);
      if (this.scoreManager.getComboTimer() <= 0) {
        this.scoreManager.resetCombo();
      }
    }

    if (this.isFrenzy) {
      this.frenzyTimer -= 16.67;
      if (this.frenzyTimer <= 0) {
        this.isFrenzy = false;
        this.audioManager.stopFrenzyAudio();
      }
    }

    if (now - this.lastSpawnTime > this.currentSpawnInterval) {
      this.spawnGameNode();
      this.lastSpawnTime = now;
    }

    const magneticStrength = ProfileManager.getAbilityValue('magneticPull', this.profile);
    const strengthMultiplier = this.isFrenzy ? 2.5 : 1;

    // Spatial Partitioning: Group nodes by grid cell
    const gridMap: Record<string, GameNode[]> = {};
    this.entityManager.allNodes.forEach(node => {
      const key = `${node.gridX},${node.gridY}`;
      if (!gridMap[key]) gridMap[key] = [];
      gridMap[key].push(node);
    });

    for (const node of this.entityManager.allNodes) {
      const nearbyGameNodes: GameNode[] = [];
      // Check current cell and 8 neighbors
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${node.gridX + dx},${node.gridY + dy}`;
          if (gridMap[key]) {
            nearbyGameNodes.push(...gridMap[key]);
          }
        }
      }
      Physics.applyMagneticPull(node, nearbyGameNodes, (strengthMultiplier * (magneticStrength / 0.05)) / 2);
    }

    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    this.entityManager.allNodes.forEach(node => node.update(cellSize, GAME_CONFIG.GRID_SIZE));
    this.ripples.forEach(ripple => ripple.update());
    this.ripples = this.ripples.filter(r => !r.isDead);
    this.particles.update();
    
    if (this.isFrenzy && Math.random() < 0.02) {
      this.audioManager.triggerFrenzyAudio();
    }

    this.collisionSystem.checkAndResolveMerges(this.entityManager.allNodes, this);

    // Final sweep: Remove marked nodes
    this.entityManager.cleanup();
  }

  private handleVoidConsumption() {
    for (let i = 0; i < this.entityManager.allNodes.length; i++) {
      const voidGameNode = this.entityManager.allNodes[i];
      if (voidGameNode.type !== NodeType.VOID) continue;

      for (let j = 0; j < this.entityManager.allNodes.length; j++) {
        if (i === j) continue;
        const other = this.entityManager.allNodes[j];
        if (other.type === NodeType.VOID) continue;

        if (this.getDistance(voidGameNode, other) < GAME_CONFIG.VOID_CONSUMPTION_RADIUS) {
          this.ripples.push(new Ripple(other.x, other.y, '#000000', GAME_CONFIG.PULSE_RADIUS * 0.5));
          this.particles.spawnBurst(other.x, other.y, '#000000', 15);
          this.audioManager.playMerge(1);
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
          other.pendingRemoval = true;
          break; 
        }      }
    }
  }

  private handleSupernovas() {
    for (let i = 0; i < this.entityManager.allNodes.length; i++) {
      const node = this.entityManager.allNodes[i];
      if (node.type !== NodeType.SUPERNOVA) continue;

      for (let j = 0; j < this.entityManager.allNodes.length; j++) {
        if (i === j) continue;
        const other = this.entityManager.allNodes[j];
        if (this.getDistance(node, other) < node.radius * 2) {
          this.triggerSupernova(node);
          return;
        }
      }
    }
  }

  private triggerSupernova(supernova: GameNode) {
    const { gridX, gridY, x, y } = supernova;
    
    this.supernovaTriggered = true;
    this.ripples.push(new Ripple(x, y, '#FF4500', GAME_CONFIG.PULSE_RADIUS * 2));
    this.particles.spawnBurst(x, y, '#FF4500', 100);
    this.triggerShake(20, 400);
    this.audioManager.playSingularity(); 
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    this.entityManager.allNodes.forEach(node => {
      const isInside = Math.abs(node.gridX - gridX) <= 1 && Math.abs(node.gridY - gridY) <= 1;
      if (isInside && node !== supernova) {
        this.particles.spawnBurst(node.x, node.y, node.color, 10);
        this.scoreManager.addScore(50);
        node.pendingRemoval = true;
      }
    });
    
    // Removed redundant ui.updateScore call
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

  private getDistance(a: Point, b: GameNode): number {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  private gameLoop() {
    try {
      if (this.stateManager.getCurrentState() === GameState.PLAYING) {
        this.update();
      }
      
      this.renderer.clear();
      this.renderer.drawBackground(this.worldSystem.getBackgroundOffset());
      this.renderer.drawGrid();
      
      // Apply screen shake translation
      this.renderer.applyShake(this.worldSystem.getScreenShakeIntensity());
      
      this.nodes.forEach((node, idx) => {
        if (!node) {
          console.error(`[Game] Null node detected at index ${idx}`);
          return;
        }
        this.renderer.drawGameNode(node);
      });
      this.ripples.forEach(ripple => this.renderer.drawRipple(ripple));
      this.renderer.drawParticles(this.particles.getParticles());
      
      this.renderer.resetShake();
      
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    } catch (e) {
      console.error('[Game] CRITICAL CRASH:', e);
      console.error('[Game] State at crash:', {
        nodeCount: this.nodes.length,
        pendingNodes: this.pendingNodes.length,
        theme: this.currentTheme,
        isFrenzy: this.isFrenzy,
        isPlaying: this.isPlaying,
        state: this.stateManager.getCurrentState()
      });
    }
  }
}
