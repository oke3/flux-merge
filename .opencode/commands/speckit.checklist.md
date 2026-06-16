# Speckit: Checklist

Generates or verifies a checklist against a specification.

## Usage
Invoke via the `speckit.checklist` command in opencode.json.

## Workflow
1. Load the specification from `.specify/specs/`
2. Load the checklist template from `.specify/templates/checklist-template.md`
3. Verify implementation completeness against the spec
4. Output an annotated checklist to `.specify/`

## Quality Gate
All checklist items must be verified before `speckit.analyze` can proceed.
