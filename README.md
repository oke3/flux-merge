# 🌌 Flux Merge

**Flux Merge** is a high-performance, holographic puzzle game where players merge cosmic energy nodes to reach the Singularity. Built with a focus on technical precision, deterministic physics, and mobile-first optimization.

## 🚀 Core Technical Architecture

### 1. Spatial Partitioning (GridMap)
To maintain a locked 60FPS on mobile devices, Flux Merge implements a custom **GridMap spatial partitioning system**. Instead of $O(N^2)$ collision checks, the engine uses a `Record<string, GameNode[]>` to bucket nodes into grid cells. 
- **Proximity Lookups**: All special node effects (Black Holes, Pulsars, Resonance) use $O(G)$ lookups, where $G$ is the number of nodes in nearby cells, rather than scanning the entire node array.
- **Incremental Updates**: The GridMap is updated incrementally as nodes move, ensuring minimal overhead per frame.

### 2. Deterministic Physics Engine
To ensure consistent gameplay across different frame rates and devices, the game utilizes a **Fixed Timestep Accumulator**.
- **Fixed Delta**: Physics calculations run at a strict `1000/60ms` interval.
- **Spiral-of-Death Protection**: A maximum update cap (`MAX_UPDATES_PER_FRAME`) prevents the engine from freezing during extreme lag spikes by dropping frames rather than attempting to catch up indefinitely.

### 3. SVI-Compliant Development
This project was developed using the **Skill Validation Interface (SVI)** protocol, ensuring that every feature was verified through empirical outcomes rather than trust-based implementation.
- **Outcome-Verified**: Every core system is backed by a suite of adversarial tests (e.g., Nova vs. Void interactions).
- **Type-First Design**: Strict TypeScript interfaces enforce a clear contract between the `EntityManager`, `CollisionSystem`, and `Renderer`.

## 🎮 Gameplay Mechanics

### Node Ecology
- **Standard Nodes**: The building blocks of the cosmos. Merge them to increase levels.
- **Pulsars**: Emit repulsion waves that push nearby nodes away.
- **Voids**: Consume standard nodes that drift too close.
- **Resonance Amplifiers**: Buff nearby standard nodes, allowing them to "skip" a level upon merging.
- **Luminous Novas**: Protect nodes from Void consumption through refraction.
- **Black Holes**: Apply a constant gravitational pull to all nearby matter.
- **Singularity (Level 5)**: The ultimate goal. Achieve this to win the game.

### Progression & Upgrades
- **Cosmic Profile**: Earn XP from merges to upgrade abilities.
- **Upgradable Abilities**: 
  - `Magnetic Attunement`: Increases pull strength.
  - `Temporal Expansion`: Extends Frenzy mode duration.
  - `Cosmic Luck`: Increases the spawn rate of special nodes.
- **Fever Mode**: Triggered at a combo of 5+, doubling score multipliers and intensifying the visual experience.

## 🛠️ Tech Stack
- **Language**: TypeScript
- **Bundler**: Vite
- **Rendering**: HTML5 Canvas (2D Context)
- **Testing**: Vitest

## 📦 Installation & Setup
1. Clone the repository.
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Run test suite:
   \`\`\`bash
   npm test
   \`\`\`
