# Speckit: Specify

Generates a formal specification from a high-level feature description.

## Usage
Invoke via the `speckit.specify` command in opencode.json.

## Workflow
1. Load the project constitution from `.specify/templates/constitution-template.md`
2. Load the spec template from `.specify/templates/spec-template.md`
3. Run the `specify` workflow step defined in `.specify/workflows/speckit/workflow.yml`
4. Output the specification to `.specify/specs/`

## Integration
This command bridges OpenCode to the SpecKit SDD engine. The generated spec feeds directly into `speckit.plan` and `speckit.tasks`.
