# Specification: Luminous Nova Node
**Status**: Draft
**Role**: Anti-Void / Balance Element
**Priority**: P1 (Stagnation Fix)

## 1. Conceptual Overview
The Luminous Nova is an expansive, high-energy node designed to counter the destructive pull of Void nodes. It transforms the game state from "Net Loss" (Void consumption) to "Net Gain" (Matter refraction), preventing board stagnation.

## 2. Mechanical Definition

### 2.1 The Repulsion Pulse
- **Interval**: Every `S` seconds (configurable in `GAME_CONFIG`).
- **Behavior**: Emits a radial force field.
- **Effect**: Any `GameNode` within radius `R` is pushed away from the Nova center.
- **Physics**: Use a `Deceleration` curve for the push to avoid "teleporting" nodes.

### 2.2 The Refraction Event (Void Counter)
- **Trigger**: Occurs when a `VOID` or `BLACK_HOLE` node attempts to mark a node for `pendingRemoval` while that node is within the Nova's active field.
- **Effect**: 
    - Intercepts the `pendingRemoval` flag.
    - Instead of deletion, the target node "shatters" into 2-3 lower-level nodes.
    - These shards are launched in random directions at high velocity.
- **Outcome**: Converts a "Deletion" event into a "Multiplication" event.

## 3. Visual & Sensory Specification

### 3.1 Visuals
- **Palette**: 
    - Core: Electric White (`#FFFFFF`)
    - Aura: Solar Gold (`#FFD700`)
    - Energy: Electric Cyan (`#00FFFF`)
- **Animation (Swell-Snap)**:
    - Swell: 1.5s slow radial growth (sinusoidal).
    - Snap: 0.2s exponential expansion to max radius.
- **Idle**: Chromatic simmer (Gold $\leftrightarrow$ Cyan hue shift) and slight scale jitter.

### 3.2 Interaction Visuals
- **Repulsion**: Nodes slide radially outward with a decelerating ease.
- **Refraction**: A "Prismatic Explosion" burst of white light and shards.
- **Conflict**: Gravitational lensing (rings curve around nearby Void nodes) and chromatic aberration at the event horizon.

### 3.3 Audio
- **Pulse**: Low-frequency sub-bass thrum $\rightarrow$ High-pitch crystalline chime on "Snap".
- **Refraction**: Multi-layered "Glass Shatter" effect.

## 4. Technical Constraints
- **Complexity**: Must maintain $O(N)$ or $O(N \log N)$ performance during pulses.
- **Stability**: Repulsion must not push nodes outside the `CANVAS_SIZE` boundaries.
- **Accessibility**: Motion patterns (Swell-Snap) must be distinct enough for color-blind players.
