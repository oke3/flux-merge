/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameNode } from './GameNode';
import { GAME_CONFIG } from '../assets/constants';

export interface InputState {
  mouseX: number;
  mouseY: number;
  isDragging: boolean;
  draggedNodeId: string | null;
  snappedX: number;
  snappedY: number;
  snappedGridX: number;
  snappedGridY: number;
}

export interface InputConfig {
  findNode: (x: number, y: number) => GameNode | null;
  onDragStart: (node: GameNode) => void;
  onDragMove: (node: GameNode, x: number, y: number) => void;
  onDragEnd: (node: GameNode) => void;
}

export class InputManager {
  private state: InputState = {
    mouseX: 0,
    mouseY: 0,
    isDragging: false,
    draggedNodeId: null,
    snappedX: 0,
    snappedY: 0,
    snappedGridX: 0,
    snappedGridY: 0,
  };

  private canvas: HTMLCanvasElement;
  private cellSize: number;
  private findNode: (x: number, y: number) => GameNode | null;
  private onDragStart: (node: GameNode) => void;
  private onDragMove: (node: GameNode, x: number, y: number) => void;
  private onDragEnd: (node: GameNode) => void;
  private draggedNode: GameNode | null = null;

  constructor(canvasId: string, config: InputConfig) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    
    this.findNode = config.findNode;
    this.onDragStart = config.onDragStart;
    this.onDragMove = config.onDragMove;
    this.onDragEnd = config.onDragEnd;
    
    this.initListeners();
  }

  private initListeners() {
    // Mouse Events
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mouseup', this.handleMouseUp);

    // Touch Events
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd);
  }

  private getCanvasCoordinates(clientX: number, clientY: number) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  private updateInputState(x: number, y: number) {
    this.state.mouseX = x;
    this.state.mouseY = y;

    // Update snapped position for Ghost Node rendering
    this.state.snappedGridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(x / this.cellSize)));
    this.state.snappedGridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(y / this.cellSize)));
    
    this.state.snappedX = this.state.snappedGridX * this.cellSize + this.cellSize / 2;
    this.state.snappedY = this.state.snappedGridY * this.cellSize + this.cellSize / 2;
  }

  private handleMouseDown = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    this.updateInputState(x, y);
    
    const node = this.findNode(x, y);
    if (node) {
      this.draggedNode = node;
      this.state.isDragging = true;
      this.state.draggedNodeId = node.id;
      this.onDragStart(node);
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    const { x, y } = this.getCanvasCoordinates(e.clientX, e.clientY);
    this.updateInputState(x, y);

    if (this.draggedNode) {
      this.onDragMove(this.draggedNode, x, y);
    }
  };

  private handleMouseUp = () => {
    if (this.draggedNode) {
      this.onDragEnd(this.draggedNode);
      this.draggedNode = null;
      this.state.isDragging = false;
      this.state.draggedNodeId = null;
    }
  };

  private handleTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoordinates(touch.clientX, touch.clientY);
    this.updateInputState(x, y);
    
    const node = this.findNode(x, y);
    if (node) {
      this.draggedNode = node;
      this.state.isDragging = true;
      this.state.draggedNodeId = node.id;
      this.onDragStart(node);
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const { x, y } = this.getCanvasCoordinates(touch.clientX, touch.clientY);
    this.updateInputState(x, y);

    if (this.draggedNode) {
      this.onDragMove(this.draggedNode, x, y);
    }
  };

  private handleTouchEnd = () => {
    if (this.draggedNode) {
      this.onDragEnd(this.draggedNode);
      this.draggedNode = null;
      this.state.isDragging = false;
      this.state.draggedNodeId = null;
    }
  };

  public getState(): InputState {
    return { ...this.state };
  }
}

