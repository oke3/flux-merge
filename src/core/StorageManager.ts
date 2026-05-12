/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 */
export interface GameSession {
  date: string;
  score: number;
  maxLevel: number;
  duration: number; // in seconds
}

export class StorageManager {
  private static readonly HISTORY_KEY = 'flux-merge-history';

  public static saveSession(session: GameSession) {
    const history = this.getHistory();
    history.push(session);
    // Keep only top 10 games
    const sorted = history.sort((a, b) => b.score - a.score).slice(0, 10);
    localStorage.setItem(this.HISTORY_KEY, JSON.stringify(sorted));
  }

  public static getHistory(): GameSession[] {
    const saved = localStorage.getItem(this.HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  }
}
