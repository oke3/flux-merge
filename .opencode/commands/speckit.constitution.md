# Speckit: Constitution

Generates or updates the project constitution.

## Usage
Invoke via the `speckit.constitution` command in opencode.json.

## Workflow
1. Load the constitution template from `.specify/templates/constitution-template.md`
2. Run the `constitution` workflow phase (via git extension hooks in `.specify/extensions.yml`)
3. Output the constitution to the project root

## Purpose
The constitution defines the foundational agreements, architectural patterns, and quality standards for the project.
