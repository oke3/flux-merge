import { GameNode } from './GameNode';
import { GAME_CONFIG, NodeType } from '../assets/constants';

export class LuminousNova extends GameNode {
  public pulseTimer: number = 0;
  public currentPulseRadius: number = 0;
  public isSnapping: boolean = false;
  public pulsePhase: 'SWELL' | 'SNAP' | 'IDLE' = 'SWELL';

  constructor(x: number, y: number, gridX: number, gridY: number, level: number = 1) {
    super(x, y, gridX, gridY, level, NodeType.LUMINOUS_NOVA);
    this.color = '#FFFFFF'; // Core color
  }

  public update(cellSize: number, gridSize: number, deltaTime: number) {
    super.update(cellSize, gridSize, deltaTime);
    this.updatePulse(deltaTime);
  }

  private updatePulse(deltaTime: number) {
    this.pulseTimer += deltaTime;

    const { PULSE_INTERVAL, SWELL_DURATION, SNAP_DURATION, REPULSION_RADIUS } = GAME_CONFIG.NOVA_CONFIG;

    if (this.pulseTimer < SWELL_DURATION) {
      this.pulsePhase = 'SWELL';
      // Sinusoidal grow
      const progress = this.pulseTimer / SWELL_DURATION;
      this.currentPulseRadius = REPULSION_RADIUS * (0.5 * (1 - Math.cos(progress * Math.PI)));
    } else if (this.pulseTimer < SWELL_DURATION + SNAP_DURATION) {
      this.pulsePhase = 'SNAP';
      this.isSnapping = true;
      // Exponential snap to max
      const progress = (this.pulseTimer - SWELL_DURATION) / SNAP_DURATION;
      this.currentPulseRadius = REPULSION_RADIUS * (1 - Math.exp(-5 * progress));
    } else if (this.pulseTimer < PULSE_INTERVAL) {
      this.pulsePhase = 'IDLE';
      this.isSnapping = false;
      this.currentPulseRadius = 0;
    } else {
      // Reset cycle
      this.pulseTimer = 0;
    }
  }

  public get isActivePulse(): boolean {
    return this.pulsePhase !== 'IDLE';
  }
}
