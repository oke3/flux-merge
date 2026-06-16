# 🌌 Flux Merge: Project Governance

This document enforces the operational and technical standards for the Flux Merge codebase.

## 🗣️ Just Say What You Want (Zero-Command Protocol)

This project uses **zero-command integration** between OpenCode and SpecKit.
You **never** need to type a command. Just say what you want in plain English.

### How It Works
1. You send a message in natural language.
2. I classify the **intent** automatically using `.specify/scripts/opencode/intent-router.js`.
3. I route through the correct **SpecKit workflow** stages.
4. I load **relevant skills** and delegate to **specialized subagents** as needed.
5. I present **review gates** only when a meaningful decision is required.
6. I **never** ask "what do you want me to do?" — you already told me.

### Intent → Workflow Mapping

| Intent | Workflow | Stages |
|--------|----------|--------|
| **Feature** (add/create/build/implement) | Full SDD Cycle | specify → plan → tasks → implement → checklist → analyze |
| **Bug Fix** (fix/repair/broken/crash/regression) | Fix Pipeline | plan → tasks → implement → analyze |
| **Analysis** (status/review/evaluate/assess/progress) | Analysis | analyze |
| **Checklist/QA** (verify/validate/audit/inspect) | Verification | checklist |
| **Spec/Design** (design/spec/define/architect) | Specification | specify |
| **Clarification** (unclear/question/confused) | Clarification | clarify |
| **Casual** (opinion/thought/question about project) | Conversation | Respond naturally |

### Execution Rules
- **Detect first**: Always run `node .specify/scripts/opencode/intent-router.js "<message>"` to classify intent before acting.
- **Route automatically**: Based on the detected intent, run the corresponding SpecKit stages.
- **Review gates** (pause for approval):
  - After **spec** generation — present for sign-off before planning.
  - After **plan** generation — present for sign-off before implementation.
  - All other stages (tasks, implement, checklist, analyze) run **without gates**.
- **Auto-proceed**: If the user responds with "looks good", "approved", "continue", or similar, proceed immediately.
- **Handle low confidence**: If `confidence < 0.5`, run `speckit.clarify` first (targeted questions, not "what do you want").
- **No single-turn monoliths**: Never attempt to execute more than 3 tool calls in a single turn during implementation.
- **KB sync**: Log architectural decisions in `.opencode/kb/decisions.md`. Update `.opencode/kb/` when new patterns emerge.

### Skill & Subagent Selection
When a task is detected, automatically load relevant skills and delegate to subagents:

| Task Domain | Subagent(s) | When to Use |
|-------------|-------------|-------------|
| TypeScript / architecture / API | `backend-architect` | Core game logic, services, type definitions |
| Game logic / physics / performance | `system-guardian` | Stress testing, performance profiling, physics stability |
| UI / UX / visual polish | `ux-designer` | Glassmorphism UI, accessibility, user flows |
| Testing / QA / adversarial | `qa-specialist` | Edge-case discovery, adversarial scenarios, regression tests |
| Feature scoping / design | `product-strategist` | Requirements, user stories, acceptance criteria |
| Codebase exploration | `expert-investigator` or `explore` | Finding code, mapping architecture, investigating patterns |
| Complex multi-step work | `orchestrator` | Task decomposition, workflow orchestration, planning |
| Content / narrative | `content-engine` | Game text, descriptions, tooltips, narrative |
| Knowledge management | `knowledge-librarian` | KB updates, graph consistency, decision logging |
| Any / general | `general` | Multi-step research or execution tasks |

## ⚙️ Operational Protocol
1. **Plan-First Workflow**: All non-trivial changes must start with an approved plan.
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
