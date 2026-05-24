import { z } from 'zod';
export { z };
import { NodeType } from '../assets/constants';

/**
 * Zod Schemas for Flux Merge Core Data Models
 * Enforces the Type-First Contract as mandated by the System Health Audit.
 */

// 1. GameState Schema (Enum)
export const GameStateSchema = z.nativeEnum({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
  WIN: 'WIN',
});

// 2. GameNode Schema
export const GameNodeSchema = z.object({
  x: z.number(),
  y: z.number(),
  gridX: z.number().int().nonnegative(),
  gridY: z.number().int().nonnegative(),
  level: z.number().int().positive(),
  radius: z.number().positive(),
  type: z.nativeEnum(NodeType),
  isDragging: z.boolean(),
  targetX: z.number(),
  targetY: z.number(),
  scale: z.number().nonnegative(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  pendingRemoval: z.boolean(),
});

// 3. UserProfile Schema
export const UserProfileSchema = z.object({
  xp: z.number().int().nonnegative(),
  level: z.number().int().nonnegative(),
  galaxy: z.number().int().nonnegative(),
  upgrades: z.record(z.string(), z.number().int().nonnegative()),
  unlockedThemes: z.array(z.string()),
  achievements: z.array(z.string()),
  settings: z.object({
    volume: z.number().min(0).max(1),
    theme: z.string(),
    muteSfx: z.boolean(),
    disableVibration: z.boolean(),
  }),
});

// 4. SessionResults Schema (for end-game calculations)
export const SessionResultsSchema = z.object({
  score: z.number().int().nonnegative(),
  maxLevel: z.number().int().positive(),
  duration: z.number().int().nonnegative(),
  xpEarned: z.number().int().nonnegative(),
});

// 5. GameSession Schema (for persistence in history)
export const GameSessionSchema = z.object({
  date: z.string().datetime(),
  score: z.number().int().nonnegative(),
  maxLevel: z.number().int().positive(),
  duration: z.number().int().nonnegative(),
});

// Type exports derived from schemas
export type GameNodeData = z.infer<typeof GameNodeSchema>;
export type UserProfileData = z.infer<typeof UserProfileSchema>;
export type SessionResultsData = z.infer<typeof SessionResultsSchema>;
export type GameSessionData = z.infer<typeof GameSessionSchema>;
