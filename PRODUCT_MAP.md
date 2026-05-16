# 🌌 Flux Merge: Product Map & Technical State

## 📌 Project Status
- **Current Version:** v1.0.1 (Pre-alpha)
- **Stability State:** Hardened (Zero-Regression Framework implemented)
- **Architecture:** Decoupled Service Orchestration

## 🛠️ Architectural Blueprint
The project has been refactored from a monolithic "God Object" (`Game.ts`) into a modular service architecture:

### 1. Entity Management (`EntityManager`)
- **Responsibility:** Entity lifecycle, spawning, spatial grid queries, and color management.
- **Key Logic:** Grid-based occupancy checks and node instantiation.

### 2. Collision & Merge System (`CollisionSystem`)
- **Responsibility:** Deterministic merge resolution and recursive cascades.
- **Key Logic:** $O(n^2)$ check with spatial optimization, handling Prism splits and Singularity wins.
- **Interface:** Uses `CollisionHandler` to trigger game effects without coupling.

### 3. State Management (`GameStateManager`)
- **Responsibility:** Life cycle and state transitions (MENU $ightarrow$ PLAYING $ightarrow$ PAUSED $ightarrow$ GAME_OVER/WIN).
- **Key Logic:** Listener pattern for state-driven UI and audio updates.

### 4. World/Environmental System (`WorldSystem`)
- **Responsibility:** Global sensory effects and special node behaviors.
- **Key Logic:** Pulsar wave timers, Void consumption, and Supernova area-of-effect.

## 🧪 Reliability & QA (ZRF)
The system is validated against specific adversarial attacks:
- **The Cascade Storm**: Ensures deep recursive merges don't cause stack overflows.
- **The Singularity**: Validates physics stability under extreme node density (no `NaN` values).
- **The Temporal Fracture**: Ensures state consistency during massive $\Delta t$ spikes.

## 🚀 Future Development Path
1. **Persistence Layer**: Implement Local Leaderboards using `localStorage` or an indexedDB wrapper.
2. **Visual Polish**: Transition from basic materials to custom GLSL shaders for "Cosmic" effects.
3. **Networking**: Implement a lightweight WebSocket layer for global rankings.
4. **Gameplay Expansion**: Introduce new node types (e.g., "White Hole" to repel everything).

## 📎 Quick References
- **Entry Point:** `src/main.ts`
- **Main Orchestrator:** `src/core/Game.ts`
- **Tests:** `npm test`
- **Build:** `npm run build`
