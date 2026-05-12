/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { Particle } from './Particle';

export class ParticleSystem {
  private particles: Particle[] = [];

  public spawnBurst(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  public update() {
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => !p.isDead);
  }

  public getParticles() {
    return this.particles;
  }
}
