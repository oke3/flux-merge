import { NODE_LEVELS, GAME_CONFIG } from '../assets/constants';

export class Node {
  public x: number;
  public y: number;
  public level: number;
  public radius: number;
  public isDragging: boolean = false;
  public targetX: number;
  public targetY: number;
  public scale: number = 1;

  constructor(x: number, y: number, level: number = 1) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.level = level;
    this.radius = GAME_CONFIG.NODE_RADIUS;
  }

  public update() {
    // Smooth interpolation towards target position
    this.x += (this.targetX - this.x) * 0.1;
    this.y += (this.targetY - this.y) * 0.1;

    // Smoothly return scale to 1 (squash and stretch recovery)
    this.scale += (1 - this.scale) * 0.15;
  }

  public get color(): string {
    return NODE_LEVELS[this.level]?.color || '#FFFFFF';
  }

  public get scoreValue(): number {
    return NODE_LEVELS[this.level]?.score || 0;
  }
}
