# Speckit: Tasks to Issues

Synchronizes local task definitions with GitHub issues.

## Usage
Invoke via the `speckit.taskstoissues` command in opencode.json.

## Workflow
1. Load tasks from `.specify/tasks/`
2. For each task, create or update a corresponding GitHub issue
3. Link issues back to the task files
4. Update task statuses based on issue state

## Prerequisites
Requires GitHub authentication and a configured remote repository.
