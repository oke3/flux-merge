import { GameNode } from './GameNode';
import { Physics } from './Physics';
import { GAME_CONFIG } from '../assets/constants';
import type { IRenderer } from '../ui/IRenderer';

export class InteractionManager {
  private renderer: IRenderer;

  constructor(renderer: IRenderer) {
    this.renderer = renderer;
  }

  public handleDragStart(node: GameNode) {
    node.isDragging = true;
  }

  public handleDragMove(node: GameNode, x: number, y: number) {
    node.targetX = x;
    node.targetY = y;

    const cellSize = GAME_CONFIG.CANVAS_SIZE / GAME_CONFIG.GRID_SIZE;
    const gridX = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(x / cellSize)));
    const gridY = Math.max(0, Math.min(GAME_CONFIG.GRID_SIZE - 1, Math.floor(y / cellSize)));
    const snappedX = gridX * cellSize + cellSize / 2;
    const snappedY = gridY * cellSize + cellSize / 2;
    
    this.renderer.updateGhostNode(snappedX, snappedY, node.level, node.type, x, y);
  }

  public handleDragEnd(node: GameNode) {
    Physics.snapToGrid(node);
    node.isDragging = false;
    this.renderer.hideGhostNode();
  }
}
