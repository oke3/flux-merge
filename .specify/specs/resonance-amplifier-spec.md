# Specification: Resonance Amplifier Node

## Purpose
Introduce a new playable cosmic node type that actively helps the player progress by amplifying merge outcomes, filling the "positive pressure" gap in the current node ecosystem (which currently has destruction, repulsion, gravity, and wildcard — but no merge-enhancing buff node).

## Design Overview
The **Resonance Amplifier (✧)** is a buff node that emits a periodic energy field. Standard nodes caught in the field become "resonant" and produce higher-level results when merged.

## Node Properties
| Property | Value |
|---|---|
| **Type Key** | `RESONANCE` |
| **Symbol** | `✧` (sparkle, Unicode U+2727) |
| **Color** | `#FFAA00` (Amber gold) |
| **Rarity** | 15% of special node spawns |
| **Level** | Always level 1 (like other specials) |
| **Mergeable** | NO — cannot merge (like Void/Black Hole) |

## Gameplay Behavior

### 1. Resonance Pulse
- Every **4 seconds**, emits a circular pulse wave (visual ripple)
- Pulse radius: **1.5× cell size** (~150px at default config)
- Any standard node within the radius gains `isResonant = true`
- Resonance lasts for **3 seconds** (de-buffs after timer expires)
- Pulse visual: golden ring expanding outward

### 2. Amplified Merging
- When **two resonant** standard nodes merge:
  - Result is **one level higher** than normal (level+2 instead of level+1)
  - Example: L1 + L1 = L3 (skips L2)
  - Example: L2 + L2 = L4 (skips L3)
- If only ONE of the two nodes is resonant → merge proceeds normally
- If a resonant node merges with a non-resonant node → normal merge

### 3. Visual Feedback
- Resonance Amplifier node: Golden glow with rotating sparkle symbol
- Resonant nodes: Subtle amber shimmer ring around the node
- On pulse: Radiating golden ring animation
- On amplified merge: Double-strength burst (brighter, more particles)

### 4. Counter-play & Balance
- **Void/Black Hole**: Can consume the Resonance Amplifier (removes the buff zone)
- **Supernova**: Destroys it like any other node
- **Nebula**: Slows the pulse interval
- **Luminous Nova**: Refraction saves resonant nodes from Void consumption (preserves their resonant state)
- Only one Resonance Amplifier's buff applies per node (no stacking)

## Files to Modify

### `src/assets/constants.ts`
- Add `RESONANCE: 'RESONANCE'` to `NodeType`
- Add `RESONANCE` entry to `SPECIAL_NODE_SYMBOLS`
- Add `RESONANCE_CONFIG` block to `GAME_CONFIG`

### `src/core/GameNode.ts`
- Add `public isResonant: boolean = false`
- Add `public resonanceTimer: number = 0`

### `src/core/WorldSystem.ts`
- Add `handleResonance()` method called from `update()`
- Implements pulse timer and resonant buff logic

### `src/core/CollisionSystem.ts`
- Modify `mergeGameNodes()` to check for resonance
- If both nodes are resonant → `newLevel = maxLevel + 2`

### `src/core/EntityManager.ts`
- Add `NodeType.RESONANCE` to the special node spawn pool

### `src/ui/Renderer.ts`
- Add visual cache case for `NodeType.RESONANCE`
- Add resonant ring overlay for buffed nodes in `drawGameNode()`

### `src/core/special_nodes_integrity.test.ts`
- Add test: Resonance pulse marks nearby nodes as resonant
- Add test: Amplified merge produces level+2 result
- Add test: Non-resonant merge remains normal

## Acceptance Criteria
1. ✧ Resonance Amplifier spawns naturally via `EntityManager`
2. ✧ Pulse wave buffs nearby standard nodes with `isResonant`
3. ✧ Two resonant nodes merge at level+2 (skip one level)
4. ✧ Visual: Golden glow on amplifier, shimmer on resonant nodes, ring on pulse
5. ✧ All existing tests still pass (zero regressions)
