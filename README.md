# 🌌 Flux Merge

**Flux Merge** is a high-fidelity, sensory-driven 3D cosmic merge puzzle game. Players harness the raw power of the universe by merging energetic nodes, navigating complex physics, and striving to achieve the ultimate state of existence: **The Singularity**.

Built with a "game feel first" philosophy, Flux Merge combines deep strategic progression with an intense, multi-sensory feedback loop designed for maximum engagement and accessibility.

---

## 🎮 Gameplay & Mechanics

### The Merge Loop
The core objective is to merge nodes of increasing energy levels. Each successful merge creates a larger, more powerful node, progressing through five distinct cosmic stages:
1. **Soft Cyan** (○)
2. **Electric Blue** (△)
3. **Vivid Purple** (□)
4. **Deep Magenta** (◊)
5. **The Singularity** (★) — *The ultimate goal.*

### 🌠 Cosmic Phenomena (Special Nodes)
The universe is unpredictable. Beyond standard nodes, special cosmic entities can appear:
- **⭐ Star Nodes:** Golden wildcards that can merge with any node level, breaking the standard progression rules.
- **⚫ Void Nodes:** Destructive black holes that consume nearby energy to clear space on the board.
- **🌀 Pulsar Nodes:** Highly unstable entities that emit periodic shockwaves, repelling all nearby objects.
- **💥 Supernova Nodes:** Rare, high-energy events that trigger massive area-of-effect explosions when they collide.
- **🌈 Prism Nodes:** Unstable crystalline structures that, upon merging, split into multiple smaller nodes.

### ⚡ Frenzy Mode & Combos
Chain reactions trigger **Frenzy Mode**. During this high-intensity state:
- The game speed and rewards accelerate.
- Magnetic attraction between nodes is supercharged.
- Audio and visual feedback reach a crescendo, creating a powerful "flow state" experience.

---

## 🚀 Progression & Customization

### 🧬 Cosmic Profile
Every player possesses a unique Cosmic Profile. By playing, you earn XP to level up and unlock permanent upgrades in the **Ability Tree**:
- **Magnetic Attunement:** Increases the strength of the magnetic pull between nodes.
- **Temporal Expansion:** Extends the duration of the high-intensity Frenzy mode.
- **Cosmic Luck:** Increases the probability of rare special nodes spawning.

### 🎨 Theme Lab
Express your cosmic identity through the Theme Lab. The game features a sophisticated **Glassmorphism** UI and supports multiple aesthetic presets:
- **Deep Space:** The classic, calm void of the cosmos.
- **Neon Night:** A high-contrast, vibrant cyberpunk aesthetic.
- **Solar Flare:** Intense, warm, and energetic tones.

---

## ♿ Accessibility & Inclusive Design

Flux Merge is built on the principle that cosmic wonder should be accessible to everyone.

- **Visual Accessibility:** Every node level is uniquely identified by a **geometric symbol** (○, △, □, ◊, ★), ensuring players with color vision deficiencies can play with 100% precision.
- **Neurodivergent-Friendly UX:**
    - **Dopamine-Positive Feedback:** Satisfying "pop" effects, ripples, and pitch-shifting audio reinforce successful actions.
    - **Cognitive Load Management:** A clean, minimalist UI prevents sensory overload while maintaining high engagement.
- **Cross-Platform Fluidity:** A custom coordinate-scaling system ensures a consistent experience across Mobile, Tablet, and Desktop.

---

## 🛠️ Technical Architecture

### The Engine
Flux Merge utilizes a highly optimized, decoupled service architecture designed for maximum stability and scalability:
- **Rendering:** A sophisticated **3D engine powered by Three.js and WebGL**, providing depth, lighting, and complex particle effects.
- **Decoupled Orchestration:** The core engine is split into specialized services to prevent single points of failure:
    - **`EntityManager`**: Centralizes entity lifecycle, spawning, and spatial queries.
    - **`CollisionSystem`**: An isolated, deterministic system for merge resolution and recursive cascades.
    - **`GameStateManager`**: A state-machine based orchestrator for life cycle and transition management.
    - **`WorldSystem`**: Manages environmental phenomena and sensory effects (Pulsars, Voids, Supernovas).
- **Physics:** A custom-built spatial partitioning physics engine handles magnetic forces and grid-based interactions.
- **Audio:** A procedural **Web Audio API** system that generates real-time, pitch-shifting tones to match gameplay intensity.

### The Stack
- **Language:** TypeScript
- **Build Tool:** Vite
- **Graphics:** Three.js / WebGL
- **Testing:** Vitest / JSDOM

---

## 🧪 Quality Assurance

We maintain a zero-defect codebase through the **Zero-Regression Framework (ZRF)**:
- **Adversarial Testing:** We employ "attack" scenarios to stress-test the system:
    - **The Cascade Storm:** Testing deep recursive merges for stack stability.
    - **The Singularity:** Stressing physics logic under extreme node density.
    - **The Temporal Fracture:** Validating state consistency during extreme lag spikes.
- **Logic Validation:** Vitest ensures mathematical precision in physics and merge logic.
- **Static Analysis:** A strict TypeScript pipeline prevents type regressions.
- **CI/CD:** Automated build and test suites run on every push to ensure stability.

---

## 🗺️ Roadmap

- [x] **Architectural Hardening:** Decomposition of the core engine into specialized services (EntityManager, CollisionSystem, GameStateManager, WorldSystem).
- [x] **Reliability Audit:** Implementation of ZRF adversarial testing to ensure system stability.
- [ ] **Local Leaderboards:** Advanced session tracking and historical high scores.
- [ ] **Global Competition:** Real-time seasonal challenges and global rankings.
- [ ] **Advanced VFX:** Enhanced volumetric lighting and shader-based cosmic effects.

---

## 📜 License
Proprietary. All rights reserved by Ground Zero LLC. Use of this source code is strictly prohibited without a written licensing contract. See the `LICENSE` file for full details.
