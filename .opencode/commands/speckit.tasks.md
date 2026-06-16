# Speckit: Tasks

Breaks an implementation plan into individual tracked tasks.

## Usage
Invoke via the `speckit.tasks` command in opencode.json.

## Workflow
1. Load the approved plan from `.specify/plans/`
2. Load the tasks template from `.specify/templates/tasks-template.md`
3. Run the `tasks` workflow step defined in `.specify/workflows/speckit/workflow.yml`
4. Output tasks to `.specify/tasks/`

## Output
Each task includes:
- A unique ID and description
- Dependencies and ordering
- Acceptance criteria
- Agent assignment
