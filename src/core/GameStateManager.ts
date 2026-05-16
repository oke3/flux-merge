/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameState } from '../assets/constants';

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
    
    console.log(`[GameStateManager] Transitioning: ${this.currentState} -> ${newState}`);
    this.currentState = newState;
    this.listener.onStateChange(newState);
  }

  public setInitialState(state: GameState) {
    this.currentState = state;
  }
}
