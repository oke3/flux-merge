import { NODE_LEVELS, GAME_CONFIG, NodeType } from '../assets/constants';

export class GameNode {
  public id: string = crypto.randomUUID();
  public x: number;
  public y: number;
  public gridX: number;
  public gridY: number;
  public prevGridX: number;
  public prevGridY: number;
  public level: number;
  public radius: number;
  public type: NodeType;
  public isDragging: boolean = false;
  public targetX: number;
  public targetY: number;
  public scale: number = 1;
  public color: string = '#FFFFFF';
  public pendingRemoval: boolean = false;
  public currentPulseRadius: number = 0;
  public isSnapping: boolean = false;
  public isResonant: boolean = false;
  public resonanceTimer: number = 0;

  constructor(x: number, y: number, gridX: number, gridY: number, level: number = 1, type: NodeType = NodeType.STANDARD) {
    this.x = x;
    this.y = y;
    this.gridX = gridX;
    this.gridY = gridY;
    this.prevGridX = gridX;
    this.prevGridY = gridY;
    this.targetX = x;
    this.targetY = y;
    this.level = level;
    this.type = type;
    this.radius = GAME_CONFIG.NODE_RADIUS;
  }

  public update(cellSize: number, gridSize: number, deltaTime: number) {
    if (this.isDragging) {
      this.x = this.targetX;
      this.y = this.targetY;
    } else {
      // Smooth interpolation towards target position (time-scaled)
      const lerpFactor = 1 - Math.exp(-10 * deltaTime / 1000);
      this.x += (this.targetX - this.x) * lerpFactor;
      this.y += (this.targetY - this.y) * lerpFactor;
    }

    // Update grid coordinates based on current position
    this.gridX = Math.max(0, Math.min(gridSize - 1, Math.floor(this.x / cellSize)));
    this.gridY = Math.max(0, Math.min(gridSize - 1, Math.floor(this.y / cellSize)));

    // Smoothly return scale to 1 (squash and stretch recovery)
    const scaleLerp = 1 - Math.exp(-15 * deltaTime / 1000);
    this.scale += (1 - this.scale) * scaleLerp;

    // Resonance buff timer decay
    if (this.isResonant) {
      this.resonanceTimer -= deltaTime;
      if (this.resonanceTimer <= 0) {
        this.isResonant = false;
        this.resonanceTimer = 0;
      }
    }
  }

  public get scoreValue(): number {
    return NODE_LEVELS[this.level]?.score || 0;
  }
}
