import { Node } from '../core/Node';
import { GAME_CONFIG, COLORS, NODE_LEVELS, NodeType } from '../assets/constants';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
}
