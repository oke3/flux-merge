# Speckit: Plan

Decomposes a specification into an actionable implementation plan.

## Usage
Invoke via the `speckit.plan` command in opencode.json.

## Workflow
1. Load the specification from `.specify/specs/`
2. Load the plan template from `.specify/templates/plan-template.md`
3. Run the `plan` workflow step defined in `.specify/workflows/speckit/workflow.yml`
4. Output the plan to `.specify/plans/`

## Review Gate
A human review gate follows the plan step. The plan must be approved before proceeding to `speckit.tasks`.
