/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
import { EntityManager } from './EntityManager';
import { ScoreManager } from './ScoreManager';
import { z, GameSessionSchema, type GameSessionData } from './schemas';

export interface GameSession extends GameSessionData {}

export class StorageManager {
  private static readonly HISTORY_KEY = 'flux-merge-history';

  public static saveSession(session: GameSession) {
    const history = this.getHistory();
    history.push(session);
    // Keep only top 10 games
    const sorted = history.sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(sorted));
  }

  public static saveCurrentSession(entityManager: EntityManager, scoreManager: ScoreManager, startTime: number) {
    const duration = Math.floor((performance.now() - startTime) / 1000);
    const maxLevel = entityManager.allNodes.length > 0 ? Math.max(...entityManager.allNodes.map(n => n.level)) : 1;
    
    const session: GameSession = {
      date: new Date().toISOString(),
      score: scoreManager.getScore(),
      maxLevel: maxLevel,
      duration: duration
    };
    this.saveSession(session);
  }

  public static getHistory(): GameSession[] {
    const saved = localStorage.getItem(this.HISTORY_KEY);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return z.array(GameSessionSchema).parse(parsed);
    } catch (e) {
      console.error('[StorageManager] History corruption detected, resetting...', e);
      return [];
    }
  }
}
