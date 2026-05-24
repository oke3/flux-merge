/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import type { IParticle } from './types';

export class Particle implements IParticle {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public life: number;
  public maxLife: number;
  public color: string;
  public size: number;
  public isDead: boolean = false;


  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    
    // Random velocity for explosion effect
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 1;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    
    this.maxLife = Math.random() * 30 + 20;
    this.life = this.maxLife;
    this.color = color;
    this.size = Math.random() * 3 + 1;
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
