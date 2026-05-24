# Feature Specification: Core Engine Baseline

**Feature Branch**: `main` (Baseline)

**Created**: 2026-05-24

**Status**: Draft

**Input**: Existing codebase analysis of `flux-merge` core systems.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Deterministic Game Loop (Priority: P1)

The game must run a consistent physics simulation regardless of the monitor's refresh rate, ensuring that node movement and merge timing are identical across all devices.

**Why this priority**: This is the foundation of fairness and stability. Without it, the game feels "jittery" or behaves differently on 60Hz vs 144Hz screens.

**Independent Test**: Record a sequence of node spawns and movements on two different refresh rate displays; the nodes must arrive at the same coordinates at the same timestamp.

**Acceptance Scenarios**:
1. **Given** a 60Hz display, **When** 1 second of game time passes, **Then** exactly 60 physics updates are processed.
2. **Given** a 144Hz display, **When** 1 second of game time passes, **Then** exactly 60 physics updates are processed, with the renderer interpolating between them.
3. **Given** a sudden frame drop (lag spike), **When** the game recovers, **Then** it catches up on missed updates (up to a cap) without "teleporting" nodes instantly across the screen.

---

### User Story 2 - Grid-Based Merge Logic (Priority: P1)

When two nodes of the same level collide, they must merge into a single node of the next level, while the "merging" process must be spatially efficient.

**Why this priority**: This is the primary game mechanic. Performance degradation here kills the experience as node counts increase.

**Independent Test**: Spawn two level-1 nodes in the same grid cell and verify they merge into one level-2 node within one physics tick.

**Acceptance Scenarios**:
1. **Given** two nodes of level $L$ in the same grid cell, **When** they collide, **Then** they are replaced by one node of level $L+1$.
2. **Given** multiple nodes of the same level in one cell, **When** a merge occurs, **Then** only the first pair is processed per tick to avoid "chain-reaction" instability.
3. **Given** a merge, **When** the new node is created, **Then** a "ripple" effect is triggered at the merge center.

---

### User Story 3 - Dynamic Spawning System (Priority: P2)

Nodes must spawn in available grid cells at an interval that increases in difficulty as the user's score rises.

**Why this priority**: Controls the game's pacing and difficulty curve.

**Independent Test**: Monitor spawn timestamps at score 0 vs score 10,000; the interval must be significantly lower at higher scores.

**Acceptance Scenarios**:
1. **Given** an empty grid, **When** the game starts, **Then** 4 nodes are spawned immediately.
2. **Given** the grid is full (no available cells), **When** a spawn is triggered, **Then** the game transitions to `GameState.GAME_OVER`.
3. **Given** a "Nebula" node is present, **When** the spawn timer is calculated, **Then** the interval is increased by 50% (slowing down spawns).

---

### Edge Cases

- **Spiral of Death**: If the physics update takes longer than `FIXED_DELTA`, the system must cap the number of updates per frame (MAX_UPDATES_PER_FRAME = 5) to prevent the game from freezing.
- **Grid Boundary Collision**: Nodes hitting the canvas edge must bounce or stop without leaving the defined grid boundaries.
- **Null Node References**: The renderer must gracefully ignore null or `pendingRemoval` nodes to prevent `TypeError` crashes during the render loop.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST use a fixed time-step of $16.67\text{ms}$ (60Hz) for all physics updates.
- **FR-002**: System MUST maintain a `gridMap` for spatial partitioning, allowing $O(1)$ lookup of nodes in a specific cell.
- **FR-003**: System MUST prevent overlapping spawns by tracking `availableCells` in a `Set`.
- **FR-004**: System MUST implement a `ComboManager` that tracks consecutive merges and triggers a "Frenzy" state.
- **FR-005**: System MUST prune dead nodes via `EntityManager.cleanup()` every frame.

### Key Entities

- **GameNode**: The primary entity. Attributes: `x, y`, `gridX, gridY`, `level`, `type`, `color`, `radius`.
- **EntityManager**: The registry. Manages the `nodes` array and the `gridMap`.
- **CollisionSystem**: The arbiter. Detects overlaps and executes the merge logic.
- **UserProfile**: The persistence layer. Stores `level`, `galaxy`, and `settings`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero `TypeError` crashes during a 10-minute stress test session.
- **SC-002**: Physics update time remains $< 2\text{ms}$ even with 100+ nodes on screen.
- **SC-003**: No "ghost merges" (merges occurring when nodes are visually separated).
- **SC-004**: 100% consistency in merge results across different browser environments (Chrome/Firefox/Safari).

## Assumptions

- **Canvas Size**: The game is designed for a fixed canvas size defined in `constants.ts`.
- **Input**: Mouse/Touch input is handled via a separate `Input` class and passed to `InteractionManager`.
- **Rendering**: The core engine is renderer-agnostic (via `IRenderer`), but `ThreeRenderer` is the current primary implementation.
