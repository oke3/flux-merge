---
description: "Task list for Core Engine Baseline stability"
---

# Tasks: Core Engine Baseline

**Input**: Design documents from `.specify/specs/core_baseline.md`

**Prerequisites**: plan.md (required), spec.md (required), constitution.md (required)

**Tests**: Adversarial tests are mandatory for all P1/P2 user stories per ZRF.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and metadata alignment

- [ ] T001 Verify `.specify` structure and Constitution alignment in `/home/omar/Horus Command Center/Game Development/flux-merge`

---

## Phase 2: Foundational (Orchestrator Pattern & Core Hardening)

**Purpose**: Restore the "Pure Orchestrator" pattern to `Game.ts` and harden core systems.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Move `addScore` logic from `Game.ts` to `ScoreManager.ts`
- [ ] T003 [P] Move `incrementCombo` and `triggerFrenzy` logic from `Game.ts` to `ComboManager.ts`
- [ ] T004 [P] Move `spawnGameNode` and node color logic from `Game.ts` to `EntityManager.ts`
- [ ] T005 [P] Move `transitionToWin` logic from `Game.ts` to `GameStateManager.ts`
- [ ] T006 Refactor `Game.ts` to be a pure orchestrator (Remove logic moved in T002-T005)
- [ ] T007 Verify the `fixedDelta` implementation in `Game.ts` and `Physics.ts` to ensure determinism

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Deterministic Game Loop (Priority: P1) 🎯 MVP

**Goal**: Ensure identical game behavior regardless of refresh rate.

**Independent Test**: Compare node positions at $T=10s$ on 60Hz and 144Hz displays.

### Tests for User Story 1 ⚠️

- [ ] T010 [P] [US1] Implement adversarial test for frame-rate independence in `src/core/timing_adversarial.test.ts`

### Implementation for User Story 1

- [ ] T011 [US1] Harden the "Spiral of Death" protection in `Game.ts` (cap updates per frame)
- [ ] T012 [US1] Add precision timing logs to verify `FIXED_DELTA` adherence

**Checkpoint**: User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Grid-Based Merge Logic (Priority: P1)

**Goal**: Efficient $O(1)$ merge detection and resolution using spatial partitioning.

**Independent Test**: Merge 100 nodes in a single frame without frame drop.

### Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Implement adversarial test for "overlapping spawns" in `src/core/merge_adversarial.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Optimize `EntityManager.updateNodes` to ensure absolute incremental grid updates
- [ ] T022 [US2] Refactor `CollisionSystem.checkAndResolveMerges` to use the `gridMap` exclusively

**Checkpoint**: User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Dynamic Spawning System (Priority: P2)

**Goal**: Pacing and difficulty control via the spawn timer.

**Independent Test**: Verify spawn interval decrease as score increases from 0 to 10,000.

### Tests for User Story 3 ⚠️

- [ ] T030 [P] [US3] Implement stress test for "Grid Full" state in `src/core/spawning.test.ts`

### Implementation for User Story 3

- [ ] T031 [US3] Validate `calculateSpawnInterval` logic against the spec (Nebula effect, score scaling)
- [ ] T032 [US3] Ensure `processSpawning` correctly handles the `BOSS_FIGHT` junk node chance

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and ZRF alignment.

- [ ] T040 [P] Run all core tests and ensure zero regressions
- [ ] T041 Run `quality-gate` on the entire core baseline

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Blocks all user stories.
- **User Stories (Phase 3-5)**: All depend on Phase 2. Can proceed in parallel (T010, T020, T030) or sequentially.
- **Polish (Phase 6)**: Depends on all stories being complete.

### Parallel Opportunities

- All Setup tasks [P] can run in parallel.
- Foundational tasks T002-T005 can run in parallel.
- Adversarial tests T010, T020, T030 can be written in parallel.
