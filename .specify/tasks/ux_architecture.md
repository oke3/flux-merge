# 📝 Tasks: UX Architecture Implementation

## Phase 1: State Foundation
- [ ] Define `GameState` enum in `src/assets/constants.ts`.
- [ ] Add `currentState` property to `Game.ts`.
- [ ] Implement `setState(newState: GameState)` method in `Game.ts` to handle transition logic.
- [ ] Wrap `Game.update()` and `Game.render()` in state-checks (e.g., physics only run in `PLAYING`).
- [ ] Create `src/ui/UIManager.ts` to handle the showing/hiding of DOM elements.

## Phase 2: The Interface Layer
- [ ] Create `index.html` overlays for `main-menu`, `pause-menu`, and `game-over`.
- [ ] Style overlays in `style.css` (Centering, blurring background, typography).
- [ ] Implement `UIManager.showMenu(menuId)` and `UIManager.hideAll()`.
- [ ] Link UI buttons to `Game.setState()` via event listeners.
- [ ] Implement `HUD` (Score/Level) in HTML/CSS and update it via `UIManager`.

## Phase 3: Interaction Model
- [ ] Create `src/core/InputManager.ts` to track mouse state and grid snapping.
- [ ] Implement `getSnappedPosition(rawX, rawY)` in `InputManager`.
- [ ] Add `ghostNode` rendering to `Renderer.ts` (semi-transparent, snaps to grid).
- [ ] Implement "Predicted Merge" visual: if `ghostNode` overlaps a node of same level, highlight it.
- [ ] Refactor `Game.handleInput` to use `InputManager` and commit on `mouseup`.

## Phase 4: Polish & Flow
- [ ] Add CSS transitions (`opacity`, `transform`) to all overlays.
- [ ] Implement "Game Over" sequence (Simulation freeze $\rightarrow$ HUD fade $\rightarrow$ Modal appear).
- [ ] Implement "Pause" toggle (e.g., 'P' key or button).
- [ ] Final UX Audit: Verify flow from Menu $\rightarrow$ Game $\rightarrow$ Death $\rightarrow$ Menu.
