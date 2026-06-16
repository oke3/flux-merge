// SPDX-License-Identifier: Proprietary
import { Particle } from './Particle';

export class ParticleSystem {
  private particles: Particle[] = [];
  private deadPool: Particle[] = [];

  private alloc(x: number, y: number, color: string): Particle {
    // Reuse dead particle if available
    const recycled = this.deadPool.pop();
    if (recycled) {
      recycled.reset(x, y, color);
      return recycled;
    }
    return new Particle(x, y, color);
  }

  public spawnBurst(x: number, y: number, color: string, count: number = 20) {
    for (let i = 0; i < count; i++) {
      this.particles.push(this.alloc(x, y, color));
    }
  }

  public update() {
    this.particles.forEach(p => p.update());
    // Move dead particles to pool instead of discarding (cap at 500)
    this.particles = this.particles.filter(p => {
      if (p.isDead) { if (this.deadPool.length < 500) this.deadPool.push(p); return false; }
      return true;
    });
  }

  public getParticles() {
    return this.particles;
  }
}
