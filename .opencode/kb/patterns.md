# 🎨 Flux Merge: Golden Paths

Implementation patterns that must be followed to maintain system stability.

## 🗣️ The "Just Say What You Want" Pattern (Zero-Command Integration)

This is the primary interaction pattern for the project. It defines how OpenCode and SpecKit work together transparently.

### Flow
1. **User speaks naturally** — no commands, no slashes, no syntax to remember.
2. **Intent is classified** using `.specify/scripts/opencode/intent-router.js` on every task-oriented message.
3. **Workflow is selected** based on the detected intent (see AGENTS.md Intent → Workflow Mapping).
4. **Skills are loaded and subagents are delegated to** based on the task domain.
5. **Review gates** appear only at spec and plan checkpoints.
6. **Artifacts land in `.specify/`** (specs/, plans/, tasks/) automatically.

### Decision Tree
```
User says something
  → Run intent-router.js
  → confidence >= 0.5?
    → YES: Route to the appropriate SpecKit pipeline
      → For features/fixes: load relevant skills, use subagents
      → Present spec → gate → plan → gate → implement → checklist → analyze
    → NO: Use speckit.clarify (targeted questions only)
```

### When NOT to run a workflow
- Casual conversation ("what do you think of this game?") → respond naturally
- Simple questions ("how does collision work?") → answer directly
- Requests that are clearly just one specific action ("run the tests") → just do it

## 🤖 Service Implementation Pattern
All new core services must follow the **Isolated Service Pattern**:
1. **Zero Coupling**: Services should not call each other directly if possible; use the `Game` orchestrator or a listener/event pattern.
2. **Deterministic Logic**: Physics and merge calculations must be pure functions of the current state and $\Delta t$.
3. **State-Driven**: UI and Audio updates must be driven by `GameStateManager` transitions.

## 🧪 Testing Pattern (ZRF)
Every new feature must be validated via an **Adversarial Scenario**:
1. **Edge Case Identification**: Define the "worst-case" scenario (e.g., 100 nodes merging simultaneously).
2. **Test Implementation**: Create a `.test.ts` file in `src/core/` using the `adversarial` naming convention.
3. **Regression Check**: Ensure the scenario passes without `NaN` values or stack overflows.

## 🎨 UI/UX Pattern
- **Glassmorphism**: All UI elements must adhere to the Glassmorphism aesthetic (blur, transparency, thin borders).
- **Sensory Feedback**: Every merge must trigger a synchronized Visual (Ripple/Particle) and Audio (Pitch-shift) event.
