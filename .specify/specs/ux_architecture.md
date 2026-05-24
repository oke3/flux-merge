# 📐 Specification: UX Architecture & Interaction Model

## 1. Vision
Transform Flux Merge from a technical demo into an immersive, high-fidelity experience. The interface is designed as a **"Stellar Command Console"**—a translucent, data-rich holographic projection floating in deep space. The focus is on **Intentionality** and **Immersion**.

## 2. Game State Machine
The game will transition between the following mutually exclusive states:

| State | Description | UI Layer | Transition Trigger |
| :--- | :--- | :--- | :--- |
| `MENU` | Initial landing page | `MainMenuOverlay` | Start Game $\rightarrow$ `PLAYING` |
| `PLAYING` | Active gameplay loop | `HUD` + `GameBoard` | Pause $\rightarrow$ `PAUSED` / Death $\rightarrow$ `GAMEOVER` |
| `PAUSED` | Gameplay frozen | `PauseMenuOverlay` | Resume $\rightarrow$ `PLAYING` / Quit $\rightarrow$ `MENU` |
| `GAMEOVER` | Final stats & results | `GameOverOverlay` | Restart $\rightarrow$ `PLAYING` / Home $\rightarrow$ `MENU` |

## 3. Interaction Model: The "Ghost Node"
To remove ambiguity from placement, we implement a **Ghost Node** system:

- **Behavior**: As the user drags a node, a semi-transparent "ghost" of the node follows the cursor, but **snaps** to the nearest grid cell.
- **Visual Feedback**:
    - **Valid Placement**: Ghost is white/colored.
    - **Invalid Placement**: Ghost turns red/dimmed.
    - **Predicted Result**: If the ghost is over a node of the same level, the ghost expands slightly or pulses, indicating a merge will occur.
- **Trigger**: The node is only "committed" to the board upon `mouseup`.

## 4. UI Layering: The "Command Console"
The UI is split into three distinct conceptual layers:

1. **The Background (Layer 0)**: The starfield and grid.
2. **The Simulation (Layer 1)**: GameNodes, Ripples, Particles.
3. **The Interface (Layer 2 - Cosmic HUD)**: 
    - **Holographic HUD**: Translucent panels with decorative "Command Center" frames (corner brackets, system readouts).
    - **Scanline Overlay**: A subtle, animated scanline across the screen to simulate a holographic display.
    - **Cosmic Event Log**: A real-time scrolling feed of game events (e.g., `[0.4s] MERGE: Lvl 2 → 3`).
    - **Reactive Elements**: Score and HUD elements that "pop" (scale/flash) in response to game events.

## 5. Visual Flow & Transitions
- **State Transitions**: Overlays utilize "unfolding" or "materializing" animations (via `clip-path` and opacity) instead of simple fades.
- **Magnetic Interaction**: Buttons lean slightly toward the cursor on hover to feel "electric."
- **Feedback Loops**: 
    - Merge $\rightarrow$ Screen Shake + Particle Burst + Score Pop.
    - Nova Snap $\rightarrow$ Chromatic Aberration + Pulse Ring.
    - Game Over $\rightarrow$ Slow-motion freeze of the final board state before the overlay appears.

## 6. Technical Constraints
- **DOM vs Canvas**: The `GameBoard` remains on Canvas for performance. All menus and overlays are implemented as HTML/CSS (via `UIManager`) for accessibility and ease of styling.
- **Input Handling**: Transition from raw event listeners to a centralized `InputManager` to handle state-dependent inputs (e.g., disable dragging while `PAUSED`).
