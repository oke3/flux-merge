# 🗺️ Plan: UX Architecture Implementation

## 🎯 Objective
Implement a professional game flow and an intuitive interaction model, transitioning from a raw simulation to a structured game experience.

## 🛠️ Implementation Phases

### Phase 1: State Foundation
**Goal**: Establish the "Brain" of the game flow.
- Define `GameState` enum (`MENU`, `PLAYING`, `PAUSED`, `GAMEOVER`).
- Integrate `currentState` into `Game.ts`.
- Update `Game.update()` and `Game.render()` to conditionally execute based on state.
- Create a basic `UIManager` class to toggle HTML overlays.

### Phase 2: The Interface Layer (Overlays)
**Goal**: Build the visual shells for the different states.
- Implement `MainMenuOverlay`: Start button, Title, Credits.
- Implement `PauseMenuOverlay`: Resume, Restart, Home buttons.
- Implement `GameOverOverlay`: Final Score, Level reached, Restart button.
- Implement `HUD`: Real-time score and level display.

### Phase 3: Interaction Model (The Ghost Node)
**Goal**: Remove placement ambiguity.
- Create `InputManager` to centralize mouse/touch events.
- Implement `GhostNode` logic:
    - Cursor tracking.
    - Grid snapping.
    - Predicted merge visualization (scaling/color change).
- Update `GameNode` placement logic to use the `InputManager`'s committed coordinates.

### Phase 4: Polish & Flow
**Goal**: Smooth out the experience.
- Add CSS transitions for overlay fade-ins.
- Implement "Game Over" sequence: Freeze simulation $\rightarrow$ Fade to black $\rightarrow$ Show Stats.
- Link HUD data to the game state (e.g., score updates in real-time).

## ✅ Verification Plan
- **State Transition Test**: Verify that clicking 'Start' moves `MENU` $\rightarrow$ `PLAYING`.
- **Input Block Test**: Verify that nodes cannot be dragged while in `PAUSED` or `MENU` state.
- **Ghost Snap Test**: Verify that the ghost node always aligns with the grid, regardless of cursor position.
- **SVI Check**: Ensure all new UI components are registered and responsive.
