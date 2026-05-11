# 🌌 Flux Merge

**Flux Merge** is a high-polish, sensory-driven merge puzzle game built with TypeScript and Vite. The game challenges players to harness cosmic energy by merging nodes of the same level to reach the ultimate "Singularity."

Unlike traditional merge games, Flux Merge emphasizes **"game feel"** through a magnetic physics system and a multi-sensory feedback loop designed to be inclusive and engaging.

---

## ✨ Key Features

### 🧠 Inclusive Design
- **Colorblind Friendly:** Every node level is assigned a unique geometric symbol (○, △, □, ◊, ★). This ensures that players who cannot distinguish colors can still play the game with 100% efficiency.
- **ADHD-Friendly UX:** 
  - **Dopamine Loops:** Immediate, satisfying feedback through a combination of visual "pops," ripple effects, and pitch-shifting audio tones.
  - **Low Cognitive Load:** A clean, minimalist "glassmorphism" UI that keeps the focus entirely on the gameplay.
- **Cross-Platform Fluidity:** A custom coordinate-scaling system allows the game to maintain a consistent internal resolution while adapting its display size to any screen (Mobile, Tablet, or Desktop).

### ⚙️ Core Mechanics
- **Magnetic Pull:** Nodes of the same level exert a magnetic attraction on one another, creating emergent gameplay and helping players organize their grid.
- **Dynamic Difficulty:** The spawn interval accelerates as the player's score increases, creating a natural tension curve.
- **The Singularity:** A progression system where merging leads to higher energy levels, culminating in the achievement of the Singularity (Level 6).

---

## 🛠️ Technical Stack

- **Language:** TypeScript
- **Build Tool:** Vite
- **Rendering:** HTML5 Canvas API (2D Context)
- **Audio:** Web Audio API (Procedural Tone Generation)
- **Testing:** Vitest & JSDOM

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 🧪 Quality Assurance & Validation

To maintain a zero-defect codebase, Flux Merge employs a two-tier validation strategy:

### 1. Logic Validation (Vitest)
We use **Vitest** to verify the mathematical correctness of the game engine.
- **Physics Tests:** Validates magnetic pull forces, grid snapping, and boundary clamping.
- **Merge Tests:** Ensures level progression and score calculations are deterministic.

Run tests via:
```bash
npm test
```

### 2. Structural Validation (Build Pipeline)
To prevent type regressions and runtime crashes, the project is gated by a strict TypeScript build pipeline.
- **Static Analysis:** `tsc` is used to verify type safety across the entire project.
- **CI/CD:** GitHub Actions automatically runs the build and test suite on every push to `main` to ensure that no breaking changes are merged.

---

## 🗺️ Roadmap

### Short Term
- [ ] **Haptic Feedback:** Implement `navigator.vibrate` for mobile devices during merges.
- [ ] **Custom Themes:** Allow users to create and save their own color palettes.
- [ ] **Local Leaderboards:** Expand `localStorage` usage to track multiple high scores.

### Long Term
- [ ] **Special Nodes:** Introduce "Void Nodes" (black holes that consume others) and "Star Nodes" (wildcards).
- [ ] **Global Competition:** Implement a backend to support global leaderboards and seasonal challenges.
- [ ] **Advanced VFX:** Integrate WebGL/Three.js for 3D node effects and more complex particle systems.

---

## 📜 License
MIT
