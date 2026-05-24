# 🌌 Flux Merge: Project Governance

This document enforces the operational and technical standards for the Flux Merge codebase.

## ⚙️ Operational Protocol
1. **Plan-First Workflow**: All changes must start in Plan Mode.
2. **ZRF Validation**: No feature is complete until an adversarial test scenario has been implemented and passed.
3. **KB Synchronization**: Every architectural change must be logged in `.opencode/kb/decisions.md`.

## 🛠️ Technical Constraints
### 🚫 Forbidden Patterns
- **No God Objects**: Do not add business logic back into `Game.ts`. Keep it as a pure orchestrator.
- **No Direct DOM Manipulation**: All UI changes must go through `UIManager`.
- **No Hardcoded Constants**: Use `src/assets/constants.ts` for all game balance variables.

### ✅ Mandatory Patterns
- **Type-First**: Define interfaces for all new entities before implementation.
- **Deterministic Physics**: Use fixed time-steps for physics calculations to ensure consistency across frame rates.
- **Accessibility-First**: Any new node type must include a unique geometric symbol.

## 🎯 Definition of Done
A task is complete when:
1. Functional requirements are met.
2. Types are strictly defined and linted.
3. An adversarial test has been implemented and passed.
4. The `.opencode/kb/` is synchronized.
