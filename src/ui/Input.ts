import { GameNode } from '../core/GameNode';

export class Input {
  private canvas: HTMLCanvasElement;
  private findNode: (x: number, y: number) => GameNode | null;
  private onDragStart: (node: GameNode) => void;
  private onDragMove: (node: GameNode, x: number, y: number) => void;
  private onDragEnd: (node: GameNode) => void;
  private draggedNode: GameNode | null = null;

  constructor(
    canvasId: string, 
    config: {
      findNode: (x: number, y: number) => GameNode | null,
      onDragStart: (node: GameNode) => void,
      onDragMove: (node: GameNode, x: number, y: number) => void,
      onDragEnd: (node: GameNode) => void,
    }
  ) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.findNode = config.findNode;
    this.onDragStart = config.onDragStart;
    this.onDragMove = config.onDragMove;
    this.onDragEnd = config.onDragEnd;
    this.setupListeners();
  }

  private setupListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);

    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  private handleMouseDown = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const node = this.findNode(x, y);
    if (node) {
      this.draggedNode = node;
      this.onDragStart(node);
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    this.onDragMove(this.draggedNode, x, y);
  };

  private handleMouseUp = () => {
    if (this.draggedNode) {
      this.onDragEnd(this.draggedNode);
      this.draggedNode = null;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    const node = this.findNode(x, y);
    if (node) {
      this.draggedNode = node;
      this.onDragStart(node);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    this.onDragMove(this.draggedNode, x, y);
  };

  private handleTouchEnd = () => {
    if (this.draggedNode) {
      this.onDragEnd(this.draggedNode);
      this.draggedNode = null;
    }
  };
}
