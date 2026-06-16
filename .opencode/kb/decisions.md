## ADR 031: Final Project Architecture and Mobile Performance Hardening
**Date**: 2026-05-27
**Status**: Completed
**Context**: As the project moved toward feature-completion, the primary goal was to ensure a stable 60FPS on mobile devices while supporting a high number of active nodes and complex special-node interactions.
**Decision**:
1. **Spatial Partitioning**: Implemented a `gridMap` in `EntityManager` to replace global $O(N)$ scans with $O(G)$ spatial lookups. Applied this to all `WorldSystem` handlers (Black Holes, Pulsars, Resonance, Supernovas).
2. **Index Optimization**: Replaced $O(N)$ `indexOf` lookups in the `CollisionSystem` merge loop with a pre-computed $O(1)$ `Map` for node indices.
3. **Incremental State Tracking**: Moved `maxNodeLevel` tracking from a per-frame $O(N)$ reduction to an incremental update in `EntityManager.addNode` and `cleanup`.
4. **Deterministic Loop**: Standardized the physics accumulator with a `MAX_UPDATES_PER_FRAME` cap to prevent "Spiral of Death" freezes on slow devices.
5. **Refraction Logic**: Optimized Luminous Nova's protection mechanism to use GridMap spatial queries, reducing complexity from $O(N^2)$ to $O(N \times \text{nearby})$.
**Consequence**: The game maintains stable frame times regardless of node density. Technical debt from prototype-phase "trust-based" logic was replaced with empirical, test-verified implementations.

## ADR 032: Zero-Command OpenCode-SpecKit Integration (The "Just Say What You Want" Protocol)
**Date**: 2026-05-27
**Status**: Accepted
**Context**: The user wanted to be able to interact with the project using natural language only — no slash commands, no syntax to remember. Previously, the system required explicit `/build`, `/flow`, or `/speckit.*` commands, creating friction. Additionally, skills and subagents existed but were not automatically leveraged based on detected intent.
**Decision**:
1. **Zero-Command Protocol** (`AGENTS.md`): Every user message is treated as a potential task. Intent is detected automatically via `.specify/scripts/opencode/intent-router.js`. No commands needed.
2. **Automatic Workflow Routing**: Based on classified intent (feature, fix, analyze, checklist, specify, clarify), the appropriate SpecKit pipeline stages are executed without user intervention.
3. **Automatic Skill & Subagent Selection**: Based on task domain (TypeScript, game logic, UI, testing, content, etc.), relevant skills are loaded and specialized subagents are delegated to via the `task` tool.
4. **Selective Review Gates**: Spec and plan stages present for user approval. All other stages (tasks, implement, checklist, analyze) run automatically.
5. **Low-Confidence Handling**: If intent confidence < 0.5, `speckit.clarify` runs targeted questions — never "what do you want me to do?".
6. **Constitution Enforcement**: `opencode.json` commands were simplified — removed massive inline routing templates from `build`/`flow`. The routing logic is now in `AGENTS.md` rather than duplicated in command templates.
**Consequence**: The user can type "add a black hole node" or "fix the collision bug" in plain English with zero ceremony — OpenCode detects intent, SpecKit orchestrates the workflow, and relevant skills/subagents are loaded automatically. The project is now truly "just say what you want."
