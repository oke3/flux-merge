import { GameNode } from '../core/GameNode';
import type { IRipple, IParticle } from '../core/types';
import type { IRenderer } from './IRenderer';
import { GAME_CONFIG, COLORS, NODE_LEVELS, NodeType, SPECIAL_NODE_SYMBOLS } from '../assets/constants';

export class Renderer implements IRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private visualCache: Map<string, HTMLCanvasElement> = new Map();


  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!this.canvas) {
      console.error(`[Renderer] Canvas #${canvasId} not found`);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.error(`[Renderer] Could not get 2D context for canvas #${canvasId}`);
    }
    this.setupResolution();
  }

  private setupResolution() {
    if (!this.canvas || !this.ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const virtualSize = GAME_CONFIG.CANVAS_SIZE;
    
    // Set internal resolution based on DPI
    this.canvas.width = virtualSize * dpr;
    this.canvas.height = virtualSize * dpr;
    
    // Set CSS size to maintain the aspect ratio and virtual size
    this.canvas.style.width = `${virtualSize}px`;
    this.canvas.style.height = `${virtualSize}px`;
    
    // Scale the context so that all drawing commands use virtual coordinates (0-600)
    this.ctx.scale(dpr, dpr);
  }

  public clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawBackground(offset: number) {
    if (!this.ctx || !this.canvas) return;
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
    if (!this.ctx || intensity <= 0) return;
    const dx = (Math.random() - 0.5) * intensity;
    const dy = (Math.random() - 0.5) * intensity;
    this.ctx.translate(dx, dy);
  }

  public resetShake() {
    if (!this.ctx) return;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private getOrCreateCachedNode(node: GameNode): HTMLCanvasElement {
    const cacheKey = `${node.type}_${node.level}_${node.color}`;
    if (this.visualCache.has(cacheKey)) {
      return this.visualCache.get(cacheKey)!;
    }

    const size = 128; // Sufficient size for a high-res base
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const octx = offscreen.getContext('2d')!;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = node.radius; // Use base radius for the template

    octx.save();
    
    if (node.type === NodeType.VOID) {
      const voidGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      voidGlow.addColorStop(0, 'rgba(0, 0, 0, 1)');
      voidGlow.addColorStop(0.5, 'rgba(50, 0, 100, 0.3)');
      voidGlow.addColorStop(1, 'transparent');
      octx.fillStyle = voidGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#000000';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
      octx.fill();
      octx.strokeStyle = 'rgba(150, 100, 255, 0.5)';
      octx.lineWidth = 2;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 0.9, 0, Math.PI * 2);
      octx.stroke();
      octx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.VOID], centerX, centerY);
    } else if (node.type === NodeType.BLACK_HOLE) {
      const bhGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2.5);
      bhGlow.addColorStop(0, 'rgba(20, 0, 40, 1)');
      bhGlow.addColorStop(0.4, 'rgba(60, 0, 100, 0.4)');
      bhGlow.addColorStop(1, 'transparent');
      octx.fillStyle = bhGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2.5, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#050010';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 0.9, 0, Math.PI * 2);
      octx.fill();
      octx.strokeStyle = 'rgba(100, 0, 255, 0.6)';
      octx.lineWidth = 3;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.stroke();
      octx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.BLACK_HOLE], centerX, centerY);
    } else if (node.type === NodeType.STAR) {
      const starGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      starGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
      starGlow.addColorStop(1, 'transparent');
      octx.fillStyle = starGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#FFD700';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = 'white';
      octx.font = `bold ${baseRadius * 0.9}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.STAR], centerX, centerY);
    } else if (node.type === NodeType.PULSAR) {
      const pulsarGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      pulsarGlow.addColorStop(0, 'rgba(0, 255, 204, 0.6)');
      pulsarGlow.addColorStop(1, 'transparent');
      octx.fillStyle = pulsarGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#00FFCC';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = 'white';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.PULSAR], centerX, centerY);
    } else if (node.type === NodeType.LUMINOUS_NOVA) {
      const novaGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      novaGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      novaGlow.addColorStop(0.5, 'rgba(255, 215, 0, 0.4)');
      novaGlow.addColorStop(1, 'transparent');
      octx.fillStyle = novaGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#FFFFFF';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#FFD700';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.LUMINOUS_NOVA], centerX, centerY);
    } else if (node.type === NodeType.PRISM) {
      const prismGlow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.5, centerX, centerY, baseRadius * 2);
      prismGlow.addColorStop(0, 'rgba(255, 0, 255, 0.6)');
      prismGlow.addColorStop(1, 'transparent');
      octx.fillStyle = prismGlow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 2, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = '#FF00FF';
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = 'white';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.fillText(SPECIAL_NODE_SYMBOLS[NodeType.PRISM], centerX, centerY);
    } else {
      const glow = octx.createRadialGradient(centerX, centerY, baseRadius * 0.8, centerX, centerY, baseRadius * 1.5);
      glow.addColorStop(0, node.color);
      glow.addColorStop(1, 'transparent');
      octx.fillStyle = glow;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius * 1.5, 0, Math.PI * 2);
      octx.fill();
      const core = octx.createRadialGradient(centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, baseRadius * 0.1, centerX, centerY, baseRadius);
      core.addColorStop(0, '#FFFFFF');
      core.addColorStop(0.4, node.color);
      core.addColorStop(1, node.color);
      octx.fillStyle = core;
      octx.beginPath();
      octx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
      octx.fill();
      octx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      octx.beginPath();
      octx.arc(centerX - baseRadius * 0.3, centerY - baseRadius * 0.3, baseRadius * 0.2, 0, Math.PI * 2);
      octx.fill();
      const symbol = NODE_LEVELS[node.level]?.symbol || '';
      octx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      octx.font = `bold ${baseRadius * 0.8}px Inter, system-ui, sans-serif`;
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      octx.shadowBlur = 4;
      octx.fillText(symbol, centerX, centerY);
    }
    octx.restore();
    this.visualCache.set(cacheKey, offscreen);
    return offscreen;
  }

  public removeGameNodeMesh(_node: GameNode) {

    // 2D canvas doesn't use persistent meshes
  }
  
  public setFever(_active: boolean) {
    // 2D renderer doesn't have shaders, but we could add a glow overlay
  }
  
  public updateGhostNode(x: number, y: number, level: number, type: NodeType = NodeType.STANDARD, currentX?: number, currentY?: number) {
    if (!this.ctx || !this.canvas) return;
    
    // We can't easily use getOrCreateCachedNode because it expects a GameNode object.
    // Let's create a dummy node for caching.
    const dummyNode = {
      id: 'ghost',
      level,
      type,
      radius: GAME_CONFIG.NODE_RADIUS,
      color: NODE_LEVELS[level]?.color || '#FFFFFF',
      x: 0,
      y: 0,
      scale: 1,
      targetX: 0,
      targetY: 0,
    } as unknown as GameNode;

    const cachedCanvas = this.getOrCreateCachedNode(dummyNode);
    
    this.ctx.save();
    
    // Draw tether line if current position is provided
    if (currentX !== undefined && currentY !== undefined) {
      this.ctx.beginPath();
      this.ctx.moveTo(currentX, currentY);
      this.ctx.lineTo(x, y);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.setLineDash([5, 5]);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    this.ctx.globalAlpha = 0.4;
    this.ctx.translate(x, y);
    const offset = cachedCanvas.width / 2;
    this.ctx.translate(-offset, -offset);
    this.ctx.drawImage(cachedCanvas, 0, 0);
    this.ctx.restore();
  }

  public hideGhostNode() {
    // Not implemented for 2D
  }

  public drawGrid() {
    if (!this.ctx || !this.canvas) return;
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

  public drawGameNode(node: GameNode) {
    if (!this.ctx || !this.canvas) return;
    const { x, y, scale } = node;

    const cachedCanvas = this.getOrCreateCachedNode(node);
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(scale, scale);
    // Since the cached canvas is centered on the node's base radius, 
    // we translate by half the canvas width to center it.
    const offset = cachedCanvas.width / 2;
    this.ctx.translate(-offset, -offset);
    this.ctx.drawImage(cachedCanvas, 0, 0);
    this.ctx.restore();

    // Luminous Nova Pulse Ring
    if (node.type === NodeType.LUMINOUS_NOVA) {
      const nova = node as any; // cast to access currentPulseRadius
      if (nova.currentPulseRadius > 0) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, nova.currentPulseRadius * scale, 0, Math.PI * 2);
        this.ctx.strokeStyle = nova.isSnapping ? '#FFFFFF' : 'rgba(255, 215, 0, 0.5)';
        this.ctx.lineWidth = 2 * scale;
        this.ctx.globalAlpha = nova.isSnapping ? 1.0 : 0.5;
        this.ctx.stroke();
        this.ctx.restore();
      }
    }
  }

  public drawRipple(ripple: IRipple) {

    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = ripple.color;
    this.ctx.globalAlpha = ripple.opacity;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
    this.ctx.restore();
  }

  public drawRipples(ripples: IRipple[]) {
    ripples.forEach(ripple => this.drawRipple(ripple));
  }

  public drawParticles(particles: IParticle[]) {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.save();
    particles.forEach(p => {
      const opacity = p.life / p.maxLife;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}
