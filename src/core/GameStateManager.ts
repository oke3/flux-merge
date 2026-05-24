/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import { GameState } from '../assets/constants';
import { EntityManager } from './EntityManager';
import { ScoreManager } from './ScoreManager';
import { ProfileManager, type UserProfile } from './ProfileManager';

export interface GameStateListener {
  onStateChange(newState: GameState): void;
}

export class GameStateManager {
  private currentState: GameState = GameState.MENU;
  private listener: GameStateListener;
  private profile?: UserProfile;

  constructor(listener: GameStateListener) {
    this.listener = listener;
  }

  public setProfile(profile: UserProfile) {
    this.profile = profile;
  }

  public getCurrentState(): GameState {
    return this.currentState;
  }

  public transitionTo(newState: GameState) {
    if (this.currentState === newState) return;

    if (newState === GameState.WIN && this.profile) {
      ProfileManager.ascendGalaxy(this.profile);
    }
    
    console.log(`[GameStateManager] Transitioning: ${this.currentState} -> ${newState}`);
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
