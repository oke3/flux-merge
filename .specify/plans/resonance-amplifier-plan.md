# Implementation Plan: Resonance Amplifier Node

## Execution Order (dependency-driven)

```
Phase 1: Constants ──────▶ Phase 2: Properties ──▶ Phase 3: Spawn ──▶ Phase 4: Visuals ──▶ Phase 5: Logic ──▶ Phase 6: Tests
  constants.ts              GameNode.ts              EntityManager.ts    Renderer.ts           WorldSystem.ts        tests
                                                                                                CollisionSystem.ts
```

---

## Phase 1: Type & Config Definitions
**File:** `src/assets/constants.ts`
**Effort:** Small (5 min)
**Dependencies:** None

**Changes:**
1. Add `RESONANCE: 'RESONANCE'` to `NodeType` const
2. Add `RESONANCE` key + symbol to `SPECIAL_NODE_SYMBOLS`
3. Add `RESONANCE_CONFIG` block to `GAME_CONFIG`:
   - `PULSE_INTERVAL: 4000` (ms between pulses)
   - `RESONANCE_DURATION: 3000` (ms buff lasts)
   - `PULSE_RADIUS: 150` (pixels)

---

## Phase 2: Node Property Extensions
**File:** `src/core/GameNode.ts`
**Effort:** Small (3 min)
**Dependencies:** Phase 1

**Changes:**
1. Add `public isResonant: boolean = false`
2. Add `public resonanceTimer: number = 0`
3. In `update()`, decrement `resonanceTimer` by `deltaTime`, when ≤ 0 set `isResonant = false`

---

## Phase 3: Spawn Integration
**File:** `src/core/EntityManager.ts`
**Effort:** Small (3 min)
**Dependencies:** Phase 1

**Changes:**
1. Add `NodeType.RESONANCE` to the special node random selection in `spawnNode()`:
   - Add `rand < 0.55` → `type = NodeType.RESONANCE` (before the STAR fallback)

---

## Phase 4: Visual Rendering
**File:** `src/ui/Renderer.ts`
**Effort:** Medium (15 min)
**Dependencies:** Phase 1, Phase 2

**Changes:**
1. Add `NodeType.RESONANCE` case in `getOrCreateCachedNode()`:
   - Amber radial gradient glow
   - Golden circle with sparkle symbol
   - Pulsing animation via scale
2. In `drawGameNode()`, after main draw:
   - If `node.isResonant`: draw an amber shimmer ring around the node
   - Ring: `rgba(255, 170, 0, opacity)` with pulsing opacity
3. Add `#FFAA00` burst on amplified merge (used by collision system)

---

## Phase 5: Gameplay Logic
**File:** `src/core/WorldSystem.ts`
**Effort:** Medium (15 min)
**Dependencies:** Phase 2

**Changes:**
1. Add `handleResonance()` method:
   - Filter nodes for type `RESONANCE`
   - Maintain per-node pulse timer (stored on the node)
   - When timer expires: emit ripple, mark nearby std nodes as `isResonant = true`, set `resonanceTimer`
   - Include Frenzy mode boost (2x pulse radius during frenzy)
2. Call `handleResonance()` from `update()` after magnetic pull

**File:** `src/core/CollisionSystem.ts`
**Effort:** Medium (10 min)
**Dependencies:** Phase 2

**Changes:**
1. In `mergeGameNodes()`, before calculating `newLevel`:
   - Check `a.isResonant && b.isResonant && a.type === NodeType.STANDARD && b.type === NodeType.STANDARD`
   - If true: `newLevel = maxLevel + 2` (amplified!)
   - Bonus: extra burst, bigger ripple, higher-pitched sound
   - Reset `isResonant` on both nodes if they survive (they don't — they get removed)

---

## Phase 6: Tests
**File:** `src/core/special_nodes_integrity.test.ts`
**Effort:** Medium (10 min)
**Dependencies:** All phases complete

**Changes:**
1. Test: Resonance pulse marks nearby nodes as resonant
2. Test: Amplified merge (two resonant nodes → level+2)
3. Test: Normal merge when only one node is resonant

---

## Total Estimated Effort: ~60 minutes

## Risk Assessment
- **Low**: Follows exact pattern of existing special nodes (Pulsar, Void, Supernova)
- **Low**: No new dependencies or architectural changes
- **Medium**: Edge case where resonance buff persists after amplifier is destroyed — handled by `resonanceTimer` auto-expiry in `GameNode.update()`
