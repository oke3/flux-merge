# Implementation Plan: Core Engine Baseline

**Branch**: `main` | **Date**: 2026-05-24 | **Spec**: `.specify/specs/core_baseline.md`

**Input**: Feature specification from `/specs/core_baseline.md`

## Summary

Establish a stable, deterministic baseline for the Flux Merge core engine. The primary goal is to eliminate "clusterfuck" entropy by strictly enforcing the Project Constitution (Orchestrator Pattern, Fixed Time-Step, Grid-Based Spatial Partitioning).

## Technical Context

**Language/Version**: TypeScript 5.x / Vite

**Primary Dependencies**: Three.js (Rendering), Vite (Build tool)

**Storage**: LocalStorage (via `StorageManager`)

**Testing**: Vitest (Unit & Adversarial Tests)

**Target Platform**: Web Browser (Canvas/WebGL)

**Project Type**: Web Game

**Performance Goals**: 60 FPS stable, physics update $< 2\text{ms}$

**Constraints**: Must maintain 100% consistency across different refresh rates.

**Scale/Scope**: Core engine loop and spatial partitioning logic.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Fixed Time-Step**: Validated in `Game.ts` (`FIXED_DELTA = 1000 / 60`).
- [x] **Grid-First Lookups**: Validated in `EntityManager.ts` (`gridMap`).
- [ ] **Pure Orchestration**: VIOLATION: `Game.ts` currently contains business logic (`addScore`, `incrementCombo`, `triggerFrenzy`).
- [x] **Type-First**: Validated in `types.ts` and `schemas.ts`.

## Project Structure

### Documentation (this feature)

```text
specs/core_baseline/
├── plan.md              # This file
├── tasks.md             # Actionable tasks (next step)
└── core_baseline.md     # Baseline specification
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── Game.ts             # Orchestrator (Logic to be moved out)
│   ├── EntityManager.ts    # Spatial/Lifecycle (Core target)
│   ├── CollisionSystem.ts  # Merge Logic (Core target)
│   ├── Physics.ts          # Movement (Core target)
│   └── ...
└── ui/
    └── Renderer.ts         # View layer
```

**Structure Decision**: Single project structure. We will harden the `src/core` layer.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `Game.ts` logic | Legacy debt | Already identified as a priority for remediation in this plan. |
