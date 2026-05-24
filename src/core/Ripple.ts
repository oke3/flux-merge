import type { IRipple } from './types';

export class Ripple implements IRipple {
  public x: number;
  public y: number;
  public radius: number = 0;
  public maxRadius: number;
  public opacity: number = 1;
  public color: string;
  public isDead: boolean = false;

  constructor(x: number, y: number, color: string, maxRadius: number = 150) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxRadius = maxRadius;
  }

  public update() {
    this.radius += 4;
    this.opacity -= 0.02;

    if (this.opacity <= 0 || this.radius >= this.maxRadius) {
      this.isDead = true;
    }
  }
}
