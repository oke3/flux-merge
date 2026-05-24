import { z } from 'zod';
export { z };
import { NodeType, GameState } from '../assets/constants';

/**
 * UserProfile Schema
 * Validates the persistent user data including progression and settings.
 */
export const UserProfileSchema = z.object({
  xp: z.number().nonnegative(),
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
    powerSaver: z.boolean(),
  }),
});

/**
 * GameNode Schema
 * Used for serializing node state (e.g., for session saves).
 */
export const GameNodeSchema = z.object({
  id: z.string().uuid(),
  x: z.number(),
  y: z.number(),
  gridX: z.number().int(),
  gridY: z.number().int(),
  level: z.number().int().positive(),
  type: z.nativeEnum(NodeType),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
});

/**
 * GameSession Schema
 * Validates the record of a completed game session.
 */
export const GameSessionSchema = z.object({
  date: z.string().datetime(),
  score: z.number().nonnegative(),
  maxLevel: z.number().int().positive(),
  duration: z.number().int().nonnegative(),
});

/**
 * GameState Schema
 * Validates the current operational state of the game engine.
 */
export const GameStateSchema = z.nativeEnum(GameState);

/**
 * GameConfig Schema
 * Ensures the constants used for game balance are within sane bounds.
 */
export const GameConfigSchema = z.object({
  CANVAS_SIZE: z.number().positive(),
  GRID_SIZE: z.number().int().positive(),
  NODE_RADIUS: z.number().positive(),
  BASE_SPAWN_INTERVAL: z.number().positive(),
  MIN_SPAWN_INTERVAL: z.number().positive(),
  MAX_DIFFICULTY_SCORE: z.number().positive(),
});

export type UserProfileType = z.infer<typeof UserProfileSchema>;
export type GameNodeType = z.infer<typeof GameNodeSchema>;
export type GameSessionData = z.infer<typeof GameSessionSchema>;
