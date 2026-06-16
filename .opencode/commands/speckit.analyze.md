# Speckit: Analyze

Analyzes implementation results against the original specification.

## Usage
Invoke via the `speckit.analyze` command in opencode.json.

## Workflow
1. Load the specification from `.specify/specs/`
2. Load the completed task list from `.specify/tasks/`
3. Compare implementation against spec requirements
4. Output analysis findings to `.specify/analysis/`

## Review Gate
A final review gate confirms completion. On rejection, re-runs relevant implementation steps.
