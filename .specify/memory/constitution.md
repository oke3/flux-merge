# Flux Merge Project Constitution

This document defines the architectural laws, quality standards, and operational constraints for the Flux Merge engine. Any change that violates these laws must be explicitly approved in `kb/decisions.md`.

## ⚖️ Architectural Laws

### 1. Deterministic Execution
- **Fixed Time-Step**: All physics, movement, and collision calculations MUST use a fixed delta time (`FIXED_DELTA`). Variable frame rates must not affect game logic.
- **No Floating Point Drift**: Critical state transitions (merges, win/loss) must be based on discrete grid coordinates or epsilon-guarded comparisons.

### 2. Spatial Efficiency
- **Grid-First Lookups**: The `EntityManager` grid map is the primary source of truth for proximity. Direct $O(N^2)$ loops over all nodes for collisions are FORBIDDEN.
- **Incremental Updates**: Grid coordinates must be updated incrementally as nodes move, not rebuilt every frame.

### 3. Separation of Concerns (The Orchestrator Pattern)
- **Pure Game Loop**: `Game.ts` is a pure orchestrator. It triggers updates but contains zero business logic.
- **Logic Isolation**: 
    - `EntityManager` $\rightarrow$ Lifecycle & Spatiality.
    - `CollisionSystem` $\rightarrow$ Merge Logic & Resolution.
    - `WorldSystem` $\rightarrow$ Global Events (Supernovas, Bosses).
    - `UIManager` $\rightarrow$ View updates.

### 4. Data Integrity
- **Type-First Contracts**: No `any` types in the core engine. Every entity must implement a strict interface.
- **Immutable State Transitions**: State changes (e.g., `GameState.PLAYING` $\rightarrow$ `GameState.GAME_OVER`) must be handled via the `GameStateManager` to ensure all listeners are notified.

## 🛠️ Quality Gates (The SVI Standard)

### 1. Zero Regression Framework (ZRF)
No feature is "Done" until:
- A standard unit test passes.
- An **adversarial test** (edge case, stress test, or "broken" scenario) is implemented and passes.

### 2. Performance Budget
- **Frame Budget**: The core update loop must execute in $< 2\text{ms}$ on target hardware.
- **Memory Leak Guard**: `EntityManager.cleanup()` must be called every frame to prune `pendingRemoval` nodes.

## 🚀 Operational Protocol
- **Plan $\rightarrow$ Implement $\rightarrow$ Verify**: No direct edits to core logic without an approved plan.
- **SVI Compliance**: All validation scripts must output structured JSON following the `.opencode/svi_schema.json`.
