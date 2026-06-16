// SPDX-License-Identifier: Proprietary
import { Ripple } from './Ripple';

export class EffectsManager {
  private backgroundOffset: number = 0;
  private screenShakeIntensity: number = 0;
  private screenShakeDuration: number = 0;
  private ripples: Ripple[] = [];

  public update(deltaTime: number = 16.67) {
    // Update Background
    this.backgroundOffset += 0.1;

    // Update Shake
    if (this.screenShakeDuration > 0) {
      this.screenShakeDuration -= deltaTime;
      if (this.screenShakeDuration <= 0) {
        this.screenShakeIntensity = 0;
      }
    }

    // Update Ripples
    this.ripples.forEach(ripple => ripple.update());
    this.ripples = this.ripples.filter(r => !r.isDead);
  }

  public reset() {
    this.ripples = [];
    this.screenShakeIntensity = 0;
    this.screenShakeDuration = 0;
  }

  public addRipple(ripple: Ripple) {
    this.ripples.push(ripple);
  }

  public getRipples(): Ripple[] {
    return this.ripples;
  }

  public triggerShake(intensity: number, duration: number = 200) {
    this.screenShakeIntensity = intensity;
    this.screenShakeDuration = duration;
  }

  public getBackgroundOffset(): number {
    return this.backgroundOffset;
  }

  public getScreenShakeIntensity(): number {
    return this.screenShakeIntensity;
  }
}
