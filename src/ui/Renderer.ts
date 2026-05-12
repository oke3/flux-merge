import { Node } from '../core/Node';
import type { IRenderer } from './IRenderer';
import { GAME_CONFIG, COLORS, NODE_LEVELS, NodeType } from '../assets/constants';

export class Renderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawBackground(offset: number) {
    // Layer 1: Distant Small Stars
    this.ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
      const x = (Math.sin(i) * 10000 + offset * 0.2) % this.canvas.width;
      const y = (Math.cos(i) * 10000) % this.canvas.height;
      this.ctx.globalAlpha = 0.3;
      this.ctx.beginPath();
      this.ctx.arc(x < 0 ? x + this.canvas.width : x, y, 1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Layer 2: Mid-distance Medium Stars
    this.ctx.fillStyle = '#B0C4DE';
    for (let i = 0; i < 30; i++) {
      const x = (Math.sin(i * 2) * 10000 + offset * 0.5) % this.canvas.width;
      const y = (Math.cos(i * 2) * 10000) % this.canvas.height;
      this.ctx.globalAlpha = 0.6;
      this.ctx.beginPath();
      this.ctx.arc(x < 0 ? x + this.canvas.width : x, y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Layer 3: Close Large Stars
    this.ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 15; i++) {
      const x = (Math.sin(i * 3) * 10000 + offset * 1.2) % this.canvas.width;
      const y = (Math.cos(i * 3) * 10000) % this.canvas.height;
      this.ctx.globalAlpha = 0.9;
      this.ctx.beginPath();
      this.ctx.arc(x < 0 ? x + this.canvas.width : x, y, 2, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
  }

  public applyShake(intensity: number) {
    if (intensity <= 0) return;
    const dx = (Math.random() - 0.5) * intensity;
    const dy = (Math.random() - 0.5) * intensity;
    this.ctx.translate(dx, dy);
  }

  public resetShake() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  public drawGrid() {
    const cellSize = this.canvas.width / GAME_CONFIG.GRID_SIZE;
    this.ctx.strokeStyle = COLORS.GLASS_BORDER;
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= GAME_CONFIG.GRID_SIZE; i++) {
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(i * cellSize, 0);
      this.ctx.lineTo(i * cellSize, this.canvas.height);
      this.ctx.stroke();

      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * cellSize);
      this.ctx.lineTo(this.canvas.width, i * cellSize);
      this.ctx.stroke();
    }
  }

  public drawNode(node: Node) {
    const { x, y, radius, color, scale } = node;

    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    this.ctx.translate(-x, -y);

    if (node.type === NodeType.VOID) {
      // Void Node Visuals: Black Hole
      const voidGlow = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2);
      voidGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      voidGlow.addColorStop(0.5, 'rgba(50, 0, 100, 0.3)');
      voidGlow.addColorStop(1, 'transparent');

      this.ctx.fillStyle = voidGlow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Event Horizon Ring
      this.ctx.strokeStyle = 'rgba(150, 100, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 0.9, 0, Math.PI * 2);
      this.ctx.stroke();

    } else if (node.type === NodeType.STAR) {
      // Star Node Visuals: Shimmering Gold
      const starGlow = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2);
      starGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      starGlow.addColorStop(1, 'transparent');

      this.ctx.fillStyle = starGlow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFD700';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Star Symbol
      this.ctx.fillStyle = 'white';
      this.ctx.font = `bold ${radius * 0.9}px Inter, system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('★', x, y);

    } else if (node.type === NodeType.PULSAR) {
      // Pulsar Node Visuals: Pulsing Cyan
      const pulsarGlow = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2);
      pulsarGlow.addColorStop(0, 'rgba(0, 255, 204, 0.6)');
      pulsarGlow.addColorStop(1, 'transparent');

      this.ctx.fillStyle = pulsarGlow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#00FFCC';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'white';
      this.ctx.font = `bold ${radius * 0.8}px Inter, system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('☼', x, y);

    } else if (node.type === NodeType.PRISM) {
      // Prism Node Visuals: Shimmering Magenta
      const prismGlow = this.ctx.createRadialGradient(x, y, radius * 0.5, x, y, radius * 2);
      prismGlow.addColorStop(0, 'rgba(255, 0, 255, 0.6)');
      prismGlow.addColorStop(1, 'transparent');

      this.ctx.fillStyle = prismGlow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FF00FF';
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'white';
      this.ctx.font = `bold ${radius * 0.8}px Inter, system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('⬡', x, y);

    } else {
      // Standard Node Visuals
      const glow = this.ctx.createRadialGradient(x, y, radius * 0.8, x, y, radius * 1.5);
      glow.addColorStop(0, color);
      glow.addColorStop(1, 'transparent');

      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
      this.ctx.fill();

      const core = this.ctx.createRadialGradient(x - radius * 0.3, y - radius * 0.3, radius * 0.1, x, y, radius);
      core.addColorStop(0, '#FFFFFF');
      core.addColorStop(0.4, color);
      core.addColorStop(1, color);

      this.ctx.fillStyle = core;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.beginPath();
      this.ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
      this.ctx.fill();

      const symbol = NODE_LEVELS[node.level]?.symbol || '';
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.font = `bold ${radius * 0.8}px Inter, system-ui, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      this.ctx.shadowBlur = 4;
      this.ctx.fillText(symbol, x, y);
    }

    this.ctx.restore();
  }

  public drawRipple(ripple: any) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = ripple.color;
    this.ctx.globalAlpha = ripple.opacity;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.restore();
  }

  public drawParticles(particles: any[]) {
    this.ctx.save();
    particles.forEach(p => {
      const opacity = p.life / p.maxLife;
      this.ctx.globalAlpha = opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    });
    this.ctx.restore();
  }
}
