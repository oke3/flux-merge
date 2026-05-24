# 📚 Flux Merge: Decision Log

This log tracks architectural decisions to maintain the "Hardened" state of the project.

## ADR 001: Decoupled Service Orchestration
**Status**: Implemented
**Decision**: Refactored the monolithic `Game.ts` into specialized services (`EntityManager`, `CollisionSystem`, etc.).
**Reasoning**: To prevent single points of failure and enable deterministic adversarial testing.

## ADR 002: Zero-Regression Framework (ZRF)
**Status**: Implemented
**Decision**: Adoption of adversarial test scenarios (Cascade Storm, Singularity, Temporal Fracture).
**Reasoning**: To ensure mathematical precision in physics and prevent stack overflows during recursive merges.

## ADR 003: Geometric Accessibility
**Status**: Implemented
**Decision**: Use unique geometric symbols (○, △, □, ◊, ★) alongside colors.
**Reasoning**: Ensure 100% precision for players with color vision deficiencies.

## ADR 004: Frame-Rate Independent Movement
**Status**: Implemented
**Decision**: Transitioned `GameNode` movement from hardcoded interpolation factors to time-scaled exponential decay using `deltaTime`.
**Reasoning**: Ensure consistent game speed and feel across different monitor refresh rates (e.g., 60Hz vs 144Hz).

## ADR 005: Service Logic Redistribution (God Object Remediation)
**Status**: Implemented
**Decision**: Migrated domain-specific logic out of `Game.ts` into specialized services:
- **Spawn Timing & Junk Nodes** $\rightarrow$ `EntityManager`
- **Results Calculation** $\rightarrow$ `GameStateManager`
- **XP Calculation** $\rightarrow$ `ProfileManager`

## ADR 006: Post-Audit Governance Recovery (May 2026)
**Status**: Implemented
**Findings**:
- **God Object Leakage**: `Game.ts` had regained business logic for `triggerGravityFlux`, `spawnBoss`, and spawning/magnetic pull in `update`.
- **DOM Violation**: `Game.ts` was directly accessing `startBtn`.
- **Hardcoded Constants**: Magic numbers were found in `Game.ts` and `Physics.ts`.
- **Physics Non-Determinism**: Movement was frame-rate independent but lacked a fixed time-step loop.
- **Accessibility Gap**: `VOID` and `BLACK_HOLE` node types lacked geometric symbols.
**Remediations**:
- Moved all business logic to `WorldSystem`, `EntityManager`, and `UIManager`.
- Implemented a fixed time-step accumulator in `Game.gameLoop` for deterministic physics.
- Migrated all magic numbers to `src/assets/constants.ts`.
- Added unique geometric symbols (◌, ⦿) to `VOID` and `BLACK_HOLE` nodes.
**Verification**: All adversarial tests passed.


## ADR 013: Core Engine Stability & Type Hardening
**Date**: 2026-05-23
**Status**: Accepted
**Context**: The game suffered from critical crashes in the Renderer and inconsistent spawn timing, along with several TypeScript type-safety violations.
**Decision**: 
- Implemented strict null checks for `HTMLCanvasElement` and `CanvasRenderingContext2D` in `Renderer.ts` to prevent `TypeError` during render loops.
- Corrected spawning logic in `EntityManager.ts` to use `>=` for time intervals, ensuring deterministic spawn counts.
- Optimized distance calculations in `CollisionSystem.ts` by replacing `Math.pow` with multiplication.
- Hardened type safety across `EntityManager` and `Renderer` by removing `any` and resolving private property access issues in `Game.ts`.
**Consequence**: Elimination of critical runtime crashes, improved frame-rate independent spawning, and a fully type-safe core loop.

## ADR 014: Physics Loop Stability & Update Order
**Date**: 2026-05-23
**Status**: Accepted
**Context**: The game engine suffered from potential "Spiral of Death" (unbounded physics updates) and stale spatial partitioning (collision detection using outdated grid maps).
**Decision**: 
- Implemented a cap on the number of physics updates per frame (MAX_UPDATES_PER_FRAME = 5) in `Game.ts` to prevent unbounded loops during lag.
- Reordered the main game loop to: `updateNodes` (move/update grid coords) -> `updateGridMap` (rebuild spatial map) -> `worldSystem.update` (behavior) -> `collisionSystem.checkAndResolveMerges` (collision).
**Consequence**: Eliminated the "Spiral of Death" risk and ensured collision detection is accurate and frame-consistent.
