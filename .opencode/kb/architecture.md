# 🌌 Flux Merge: Architectural Map

This document serves as the structural truth for the Flux Merge codebase.

## 🏗️ High-Level Orchestration
The project uses a **Decoupled Service Architecture** to ensure stability and eliminate "God Objects."

### Core Services
- **`Game.ts`**: The main entry point and top-level orchestrator.
- **`EntityManager`**: Responsible for the lifecycle of all cosmic nodes, spatial grid management, and spawning logic.
- **`CollisionSystem`**: A deterministic system handling merge resolution, recursive cascades, and special node interactions (Prisms, Singularities).
- **`GameStateManager`**: A finite state machine managing transitions between `MENU`, `PLAYING`, `PAUSED`, and `GAME_OVER/WIN`.
- **`WorldSystem`**: Manages environmental effects, including Pulsar waves, Void consumption, and Supernova AOE.
- **`EffectsManager`**: Handles transient visual effects, including screen shake and cosmic ripples.
- **`ParticleSystem` / `Particle`**: Manages high-volume cosmic particles and debris for visual polish.
- **`StorageManager`**: Manages session persistence and high-score history.
- **`ScoreManager`**: Handles real-time score calculation, multiplier tracking, and total points.
- **`ComboManager`**: Tracks consecutive merge sequences and triggers combo-based bonuses.
- **`BadgeManager`**: Manages the unlocking and tracking of cosmic achievements and badges.
- **`ProfileManager`**: Handles user progression, XP, levels, and upgrade state.
- **`InteractionManager`**: Decouples user interaction logic from the core entity lifecycle.

### UI & Rendering Layer
- **`Renderer` / `ThreeRenderer`**: Wraps Three.js to handle the 3D cosmic environment, lighting, and materials.
- **`UIManager`**: Manages the Glassmorphism UI, score displays, and player profiles.
- **`Input`**: Decoupled input handling for cross-platform fluidity.

## 🛠️ Technical Stack
- **Language**: TypeScript (Strict Mode)
- **Graphics**: Three.js / WebGL
- **Build System**: Vite
- **Testing**: Vitest (via Zero-Regression Framework). Uses a **Co-located Testing Pattern** where `.test.ts` files reside alongside their source files for immediate accessibility.

## 📌 Critical Paths
- **Merge Loop**: `EntityManager` $\rightarrow$ `CollisionSystem` $\rightarrow$ `Game` (Effects) $\rightarrow$ `ScoreManager`.
- **State Transition**: `GameStateManager` $\rightarrow$ `UIManager` / `AudioManager`.
- **Sensory Loop**: `WorldSystem` $\rightarrow$ `ThreeRenderer` $\rightarrow$ `AudioManager` $\rightarrow$ `AudioEngine`.
    - **`AudioManager` (High-Level)**: Orchestrates semantic audio triggers, manages user settings (mute), and maps game events to audio sounds.
    - **`AudioEngine` (Low-Level)**: Manages the `AudioContext`, oscillator generation, and raw frequency modulation.
