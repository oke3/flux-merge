# Speckit: Implement

Executes implementation from a task list.

## Usage
Invoke via the `speckit.implement` command in opencode.json.

## Workflow
1. Load tasks from `.specify/tasks/`
2. Run the `implement` workflow step defined in `.specify/workflows/speckit/workflow.yml`
3. Update task status as implementation progresses
4. Generate implementation artifacts in the project source tree

## Integration
This is the execution phase of the SDD cycle. Files are created/modified in `src/` and verified against the specification.
