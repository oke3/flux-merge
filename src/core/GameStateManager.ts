/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameState } from '../assets/constants';
import { EntityManager } from './EntityManager';
import { ScoreManager } from './ScoreManager';
 
export interface GameStateListener {
  onStateChange(newState: GameState): void;
}
 
export class GameStateManager {
  private currentState: GameState = GameState.MENU;
  private listener: GameStateListener;
 
  constructor(listener: GameStateListener) {
    this.listener = listener;
  }
 
  public getCurrentState(): GameState {
    return this.currentState;
  }
 
  public transitionTo(newState: GameState) {
    if (this.currentState === newState) return;
    this.currentState = newState;
    this.listener.onStateChange(newState);
  }
  
  public setInitialState(state: GameState) {
    this.currentState = state;
  }

  public calculateResults(entityManager: EntityManager, scoreManager: ScoreManager, startTime: number) {
    const duration = Math.floor((performance.now() - startTime) / 1000);
    const maxLevel = entityManager.allNodes.length > 0 ? Math.max(...entityManager.allNodes.map(n => n.level)) : 1;
    const score = scoreManager.getScore();
    
    // XP is calculated as score / 10 (simplified)
    const xpEarned = Math.floor(score / 10);
    
    return {
      score,
      maxLevel,
      duration,
      xpEarned
    };
  }
}
