# Implementation Plan: Luminous Nova
**Spec**: `.specify/specs/luminous_nova.md`
**Goal**: Implement the Anti-Void node to prevent stagnation and add visual polish.

## Phase 1: Core Logic & Types
- Add `LUMINOUS_NOVA` to `NodeType`.
- Implement the `LuminousNova` class (extending `GameNode`).
- Add `NOVA_CONFIG` to `constants.ts` (pulse interval, repulsion strength, etc.).

## Phase 2: Physics & Interactions
- Implement the `Repulsion Pulse` in `CollisionSystem` or `Physics`.
- Implement the `Refraction Logic`: intercept `pendingRemoval` from Void nodes.
- Add logic for "Matter Splitting" (shattering a node into smaller pieces).

## Phase 3: Visuals & Rendering
- Implement the `Swell-Snap` animation loop in `Renderer`.
- Add the `Chromatic Simmer` idle effect.
- Implement the "Prismatic Explosion" visual for refraction events.
- (Stretch Goal) Implement Gravitational Lensing for Void-Nova proximity.

## Phase 4: Audio & Polish
- Add the "Thrum" and "Chime" audio triggers.
- Add the "Shatter" sound for refraction.

## Phase 5: Adversarial Verification
- Create `src/core/nova_vs_void.test.ts`.
- Test: Nova should protect a cluster from a Void.
- Test: Nova should replenish a near-empty board via refraction.
- Test: Performance check with multiple Novas and Voids.
