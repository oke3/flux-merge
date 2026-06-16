# Tasks: Resonance Amplifier Node

## T1: Add RESONANCE type constants
- **File:** `src/assets/constants.ts`
- **Depends on:** None
- **Acceptance:** NodeType includes RESONANCE, SPECIAL_NODE_SYMBOLS has ✧, GAME_CONFIG has RESONANCE_CONFIG block
- **Effort:** 5 min

## T2: Add isResonant property to GameNode
- **File:** `src/core/GameNode.ts`
- **Depends on:** T1
- **Acceptance:** GameNode has `isResonant: boolean` and `resonanceTimer: number`, timer auto-decays in `update()`
- **Effort:** 3 min

## T3: Add RESONANCE to spawn pool
- **File:** `src/core/EntityManager.ts`
- **Depends on:** T1
- **Acceptance:** RESONANCE type can be randomly chosen in spawnNode() special selection
- **Effort:** 3 min

## T4: Add visual rendering for RESONANCE node
- **File:** `src/ui/Renderer.ts`
- **Depends on:** T1, T2
- **Acceptance:** RESONANCE nodes render with golden glow + ✧ symbol; resonant nodes have amber shimmer ring
- **Effort:** 15 min

## T5: Add resonance pulse logic to WorldSystem
- **File:** `src/core/WorldSystem.ts`
- **Depends on:** T2
- **Acceptance:** RESONANCE nodes emit pulse every 4s, nearby standard nodes become isResonant for 3s
- **Effort:** 15 min

## T6: Add amplified merge to CollisionSystem
- **File:** `src/core/CollisionSystem.ts`
- **Depends on:** T2
- **Acceptance:** Two resonant standard nodes merge to level+2 (skip one level); single-resonant merges normally
- **Effort:** 10 min

## T7: Add tests for Resonance Amplifier
- **File:** `src/core/special_nodes_integrity.test.ts`
- **Depends on:** T1, T2, T5, T6
- **Acceptance:** 3 new tests pass: pulse marks nodes resonant, amplified merge produces level+2, normal merge with single resonant
- **Effort:** 10 min

## T8: Run full test suite & verify
- **File:** N/A (run `npx vitest run`)
- **Depends on:** T1–T7
- **Acceptance:** All 20+ test files pass, zero regressions
- **Effort:** 2 min
