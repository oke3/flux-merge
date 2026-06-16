// SPDX-License-Identifier: Proprietary
import type { IParticle } from './types';

export class Particle implements IParticle {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public life: number = 0;
  public maxLife: number = 0;
  public color: string = '#FFFFFF';
  public size: number = 1;
  public isDead: boolean = false;


  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.reset(x, y, color);
  }

  /** Reuse this particle with new values (pool recycle) */
  public reset(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.isDead = false;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.maxLife = Math.random() * 25 + 15;
    this.life = this.maxLife;
    this.color = color;
    this.size = Math.random() * 3 + 1.5;
  }

  public update() {
    this.x += this.vx;
    this.y += this.vy;
    
    // Add slight gravity/friction
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vy += 0.05; 
    
    this.life--;
    if (this.life <= 0) {
      this.isDead = true;
    }
  }
}
