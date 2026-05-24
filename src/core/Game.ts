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
import { EffectsManager } from './EffectsManager';
import type { IRenderer } from '../ui/IRenderer';
import { Renderer } from '../ui/Renderer';
import { ScoreManager } from './ScoreManager';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { Ripple } from './Ripple';
import { UIManager } from '../ui/UIManager';
import { ParticleSystem } from './ParticleSystem';
import { StorageManager } from './StorageManager';
import { BadgeManager } from './BadgeManager';
import { ProfileManager, type UserProfile } from './ProfileManager';
import { ComboManager } from './ComboManager';
import { InteractionManager } from './InteractionManager';
import { GAME_CONFIG, GameState, THEMES, ABILITIES } from '../assets/constants';


export class Game implements CollisionHandler, GameStateListener {
  private entityManager: EntityManager;
  private collisionSystem: CollisionSystem;
  public stateManager: GameStateManager;
  public worldSystem: WorldSystem;
  public effects: EffectsManager;
  private particles: ParticleSystem;
  private renderer: IRenderer;
  public ui: UIManager;
  public audioManager: AudioManager;
  public scoreManager: ScoreManager;
  public comboManager: ComboManager;
  private interaction: InteractionManager;
  public inputManager: InputManager;
  public profile: UserProfile;
  private currentTheme: string = 'deepSpace';
  private isWin: boolean = false;
  private isPlaying: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number | null = null;
  private physicsAccumulator: number = 0;
  private readonly FIXED_DELTA = 1000 / 60; 
  private pendingNodes: GameNode[] = [];
  private startTime: number = 0;

  public get nodes(): GameNode[] {
    return this.entityManager.allNodes;
  }

  public set nodes(value: GameNode[]) {
    this.entityManager.reset();
    value.forEach(node => this.entityManager.addNode(node));
  }

  // CollisionHandler Implementation
  public addScore(points: number) {
    this.scoreManager.addScore(points, this.profile, this.nodes);
  }

  public incrementCombo() {
    this.comboManager.incrementCombo();
  }

  public triggerFrenzy(duration: number) {
    this.comboManager.triggerFrenzy(duration);
    this.audioManager.triggerFrenzyAudio();
  }

  public playMergeSound(level: number) {
    this.audioManager.playMerge(level, this.scoreManager.getCombo());
  }

  public spawnBurst(x: number, y: number, color: string, count: number) {
    this.particles.spawnBurst(x, y, color, count);
  }

  public addRipple(ripple: Ripple) {
    this.effects.addRipple(ripple);
  }

  public triggerShake(intensity: number, duration?: number) {
    this.effects.triggerShake(intensity, duration);
  }

  public spawnNode() {
    this.spawnGameNode();
  }

  public spawnGameNode() {
    this.entityManager.spawnNode(this.profile, this.currentTheme);
  }

  public transitionToWin() {
    this.transitionTo(GameState.WIN);
  }

  public triggerGravityFlux() {
    this.logEvent('SYSTEM: Gravity Flux Detected!');
    this.worldSystem.triggerGravityFlux(this);
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

  public removeNodeMesh(node: GameNode) {
    this.renderer.removeGameNodeMesh?.(node);
  }

  public logEvent(message: string) {
    this.ui.logEvent(message);
  }

  public pulseHUD() {
    this.ui.pulseHUD();
  }

  public getCurrentTheme(): string {
    return this.currentTheme;
  }

  public updateGridMap() {
    console.log('[Game] Calling updateGridMap');
    this.entityManager.updateGridMap();
  }

  public getGridMap() {
    return this.entityManager.gridMap;
  }

  // Combo & Frenzy State
  // Managed by ComboManager

  constructor() {
    console.log('[Game] Initializing...');
    this.profile = ProfileManager.loadProfile();
    this.currentTheme = this.profile.settings.theme;
    this.entityManager = new EntityManager();
    this.collisionSystem = new CollisionSystem();
    this.stateManager = new GameStateManager(this);
    this.stateManager.setProfile(this.profile);
    this.worldSystem = new WorldSystem();
    this.effects = new EffectsManager();
    this.particles = new ParticleSystem();
    this.renderer = new Renderer('gameCanvas');
    this.ui = new UIManager();
    this.audioManager = new AudioManager();
    this.scoreManager = new ScoreManager(this.ui);
    this.comboManager = new ComboManager(this.scoreManager, this.ui, this.audioManager);
    this.interaction = new InteractionManager(this.renderer);
    this.entityManager.initGrid();
    this.ui.setGame(this);
    console.log('[Game] Core systems initialized');
    
    this.inputManager = new InputManager('gameCanvas', {
      findNode: (x, y) => this.findGameNodeAt(x, y),
      onDragStart: (node) => this.interaction.handleDragStart(node),
      onDragMove: (node, x, y) => this.interaction.handleDragMove(node, x, y),
      onDragEnd: (node) => this.interaction.handleDragEnd(node),
    });

    window.addEventListener('themeChanged', (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const themeId = customEvent.detail;
      const theme = THEMES[themeId];
      
      if (theme && theme.requiredLevel && this.profile.level < theme.requiredLevel) {
        this.ui.showNotification(`Requires Level ${theme.requiredLevel}!`);
        return;
      }
      
      this.currentTheme = themeId;
      this.updateGameNodeColors();
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
    
    if (newState === GameState.GAME_OVER || newState === GameState.WIN) {
      const results = this.stateManager.calculateResults(this.entityManager, this.scoreManager, this.startTime);
      this.ui.showResults(results, newState === GameState.WIN);
    }
    
    this.ui.handleStateChange(newState);
    console.log(`[Game] UI updated for state: ${newState}`);

    if (newState === GameState.UPGRADES) {
      const upgradeData = Object.values(ABILITIES).map(ability => {
        const level = this.profile.upgrades[ability.id] || 0;
        return {
          id: ability.id,
          name: ability.name,
          description: ability.description,
          cost: ability.costPerLevel(level),
          level: level,
          maxLevel: ability.maxLevel
        };
      });
      this.ui.renderUpgrades(upgradeData, (id) => this.upgradeAbility(id));
    }
    
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

  public upgradeAbility(abilityId: string): boolean {
    const success = ProfileManager.upgradeAbility(abilityId, this.profile);
    if (success) {
      ProfileManager.saveProfile(this.profile);
      this.ui.showNotification(`Upgraded ${abilityId}!`);
    } else {
      this.ui.showNotification('Not enough XP or max level reached!');
    }
    return success;
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
    console.log('[Game] restart() called');
    this.reset();
    this.initGame();
    this.startTime = performance.now();
    this.audioManager.resume(); // Unlock audio context on user interaction
    this.transitionTo(GameState.PLAYING);
    this.isPlaying = true; // Explicitly set isPlaying to true to start the loop
    this.gameLoop();
  }

  public returnToMenu() {
    this.transitionTo(GameState.MENU);
  }

  public stop() {
    this.isPlaying = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.saveCurrentSession();
  }

  // Removed calculateResults as it's now in GameStateManager


  // Removed togglePauseControls helper as it's now in UIManager

  public reset() {
    this.entityManager.reset();
    this.effects.reset();
    this.scoreManager.reset();
    this.isWin = false;
    this.comboManager.reset();
    this.worldSystem.supernovaTriggered = false;
  }

  private saveCurrentSession() {
    StorageManager.saveCurrentSession(this.entityManager, this.scoreManager, this.startTime);
  }

  public hasTriggeredSupernova() { return this.worldSystem.supernovaTriggered; }
  public getScore() { return this.scoreManager.getScore(); }
  public getCombo() { return this.scoreManager.getCombo(); }
  public getIsWin() { return this.isWin; }

  private findGameNodeAt(x: number, y: number): GameNode | null {
    return this.entityManager.findNodeAt(x, y);
  }

  private initGame() {
    for (let i = 0; i < 4; i++) {
      this.entityManager.spawnNode(this.profile, this.currentTheme);
    }
  }

  private updateGameNodeColors() {

    this.entityManager.updateAllColors(this.currentTheme);
  }

  public update(deltaTime: number = GAME_CONFIG.DEFAULT_DELTA_TIME) {
    // console.log(`[Game] update called with delta: ${deltaTime}`);
    // Sanitize deltaTime to prevent NaN/Infinity propagation
    const sanitizedDelta = (Number.isFinite(deltaTime) && deltaTime > 0) 
      ? deltaTime 
      : GAME_CONFIG.DEFAULT_DELTA_TIME;

    const state = this.stateManager.getCurrentState();
    
    // Only run physics and logic if the game is actively playing
    if (state !== GameState.PLAYING && state !== GameState.GAME_OVER) return;
    
    let effectiveDelta = sanitizedDelta;
    if (state === GameState.GAME_OVER) {
      effectiveDelta *= GAME_CONFIG.SLOW_MOTION_FACTOR; // Slow motion on game over
    }
    
    // 1. Update positions and grid coordinates
    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    this.entityManager.updateNodes(cellSize, GAME_CONFIG.GRID_SIZE, effectiveDelta);
    
    // 2. WorldSystem logic (uses updated gridMap and may change target positions)
      this.worldSystem.update(
        this.nodes, 
        this.entityManager.gridMap, 
        this, 
        this.profile, 
        effectiveDelta,
        this.comboManager.getIsFrenzy()
      );
    
    // 4. Collision detection (uses updated gridMap and current positions)
    this.collisionSystem.checkAndResolveMerges(this.entityManager.allNodes, this.entityManager.gridMap, this);
    
    // 5. Update secondary systems
    this.effects.update(effectiveDelta);
    this.particles.update();
    this.entityManager.cleanup();
    
    if (this.comboManager.getIsFrenzy() && Math.random() < GAME_CONFIG.FRENZY_AUDIO_CHANCE) {
      this.audioManager.triggerFrenzyAudio();
    }
  }


  public processSpawning() {
    this.entityManager.processSpawning(this, performance.now());
  }

  private gameLoop() {
    try {
      // console.log('[Game] gameLoop tick');
      const now = performance.now();
      const deltaTime = this.lastFrameTime ? now - this.lastFrameTime : this.FIXED_DELTA;
      this.lastFrameTime = now;

      const state = this.stateManager.getCurrentState();
      
       // 1. LOGIC UPDATE
       // Only run physics and game logic if the game is in an active state
       if (this.isPlaying && (state === GameState.PLAYING || state === GameState.GAME_OVER)) {
        this.physicsAccumulator += deltaTime;
        
         // Spiral of Death protection: cap the number of updates per frame
         let updateCount = 0;
  
         while (this.physicsAccumulator >= this.FIXED_DELTA && updateCount < GAME_CONFIG.MAX_UPDATES_PER_FRAME) {
           this.update(this.FIXED_DELTA);
           this.physicsAccumulator -= this.FIXED_DELTA;
           updateCount++;
         }
  
         if (updateCount >= GAME_CONFIG.MAX_UPDATES_PER_FRAME) {
           this.physicsAccumulator = 0;
         }
  
        this.processSpawning();
      }
      
      // 2. RENDERING
      // Rendering always runs (for animations/menus) unless the canvas is hidden
      this.renderer.clear();
      this.renderer.drawBackground(this.effects.getBackgroundOffset());
      this.renderer.drawGrid();
      
      // Render Ghost Node for predictive snapping
      const inputState = this.inputManager.getState();
       if (inputState.isDragging && inputState.draggedNodeId) {
         const draggedNode = this.entityManager.getNodeById(inputState.draggedNodeId);
         if (draggedNode) {
           this.renderer.updateGhostNode(
             inputState.snappedX, 
             inputState.snappedY, 
             draggedNode.level, 
             draggedNode.type,
             draggedNode.x,
             draggedNode.y
           );
         }
       }

      
      // Apply screen shake translation
      this.renderer.applyShake(this.effects.getScreenShakeIntensity());
      this.renderer.applyShake(this.effects.getScreenShakeIntensity());
      
       this.nodes.forEach((node, idx) => {
        if (!node) {
          console.error(`[Game] Null node detected at index ${idx}`);
          return;
        }
        this.renderer.drawGameNode(node);
      });
      this.renderer.drawRipples(this.effects.getRipples());
      this.renderer.drawParticles(this.particles.getParticles());
  
      this.renderer.resetShake();
      
    } catch (e) {
      console.error('[Game] CRITICAL CRASH:', e);
      console.error('[Game] State at crash:', {
        nodeCount: this.nodes.length,
        pendingNodes: this.pendingNodes.length,
        theme: this.currentTheme,
        isFrenzy: this.comboManager.getIsFrenzy(),
        isPlaying: this.isPlaying,
        state: this.stateManager.getCurrentState()
      });
    } finally {
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }
}

