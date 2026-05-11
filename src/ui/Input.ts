import { Node } from '../core/Node';

export class Input {
  private canvas: HTMLCanvasElement;
  private findNode: (x: number, y: number) => Node | null;
  private onDragStart: (node: Node) => void;
  private onDragMove: (node: Node, x: number, y: number) => void;
  private onDragEnd: (node: Node) => void;
  private draggedNode: Node | null = null;

  constructor(
    canvasId: string, 
    config: {
      findNode: (x: number, y: number) => Node | null,
      onDragStart: (node: Node) => void,
      onDragMove: (node: Node, x: number, y: number) => void,
      onDragEnd: (node: Node) => void,
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const node = this.findNode(x, y);
    if (node) {
      this.draggedNode = node;
      this.onDragStart(node);
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
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
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.onDragMove(this.draggedNode, x, y);
  };

  private handleTouchEnd = () => {
    if (this.draggedNode) {
      this.onDragEnd(this.draggedNode);
      this.draggedNode = null;
    }
  };
}
