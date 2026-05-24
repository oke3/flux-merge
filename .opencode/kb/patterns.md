# 🎨 Flux Merge: Golden Paths

Implementation patterns that must be followed to maintain system stability.

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
