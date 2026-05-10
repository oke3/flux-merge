import { Node } from '../core/Node';

export class Input {
  private canvas: HTMLCanvasElement;
  private onNodeDrag: (node: Node, x: number, y: number) => void;
  private draggedNode: Node | null = null;

  constructor(canvasId: string, onNodeDrag: (node: Node, x: number, y: number) => void) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.onNodeDrag = onNodeDrag;
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
    this.findNodeAt(x, y);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.onNodeDrag(this.draggedNode, x, y);
  };

  private handleMouseUp = () => {
    this.draggedNode = null;
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.findNodeAt(x, y);
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (!this.draggedNode) return;
    const rect = this.canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    this.onNodeDrag(this.draggedNode, x, y);
  };

  private handleTouchEnd = () => {
    this.draggedNode = null;
  };

  private findNodeAt(_x: number, _y: number) {
    // This will be handled by the Game class via a callback or by passing nodes here.
    // For now, we'll assume the Game class manages the node list and we just emit the event.
  }

  // We'll use this method to let Game.ts tell Input.ts which node is being dragged
  public setDraggedNode(node: Node | null) {
    this.draggedNode = node;
  }

  public getDraggedNode(): Node | null {
    return this.draggedNode;
  }
}
