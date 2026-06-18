---
name: orchestrator
description: |
  Coordinates the full SDD pipeline — plan, coordinate, and verify.
  Orchestrates explore, explorer, proposer, designer, spec-writer, builder,
  and verifier agents. Never writes code directly.
---

# Orchestrator Skill — SDD Pipeline

## Pre-flight Checklist

Before starting, ASK the user:

1. **"Is this trivial or full SDD pipeline?"**
   - Trivial (≤3 files, well-understood) → skip to builder
   - Full pipeline → run all stages

2. **"Where should .md files be written (the change folder)?"**
   - Options: `docs/<feature-name>/` (create if missing), project root, `AGENTS.md`, or skip

3. **"Are we in read-only mode?"**
   - If yes → flag that builder will fail, ask for implement mode
   - If no → proceed

## Pipeline Stages

Each stage dispatches a sub-agent via `task(subagent_type: "...", prompt: "...")`.
Each stage writes its `.md` output to the **change folder**.
The next stage **reads from disk** (not inline passthrough).

### Stage 1: Explore
- **Agent**: `explorer`
- **Prompt includes**: feature description, change folder path, what to look for
- **Output**: `exploration.md` written to change folder
- **Gate**: Must include directory structure, model interfaces, current state pattern, deps
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" before dispatching the next stage

### Stage 2: Propose
- **Agent**: `proposer`
- **Reads from disk**: `exploration.md`
- **Prompt includes**: exploration content + change folder path
- **Output**: `proposal.md` written to change folder
- **Gate**: **ALWAYS present to user for approval** before proceeding
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" before dispatching the next stage

### Stage 3: Design
- **Agent**: `designer`
- **Reads from disk**: `exploration.md` + `proposal.md`
- **Prompt includes**: exploration + proposal content + change folder path
- **Output**: `design.md` written to change folder
- **Gate**: Verify every file has a clear purpose and dependencies are mapped
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" before dispatching the next stage

### Stage 4: Spec
- **Agent**: `spec-writer`
- **Reads from disk**: `exploration.md` + `proposal.md` + `design.md`
- **Prompt includes**: all three document contents + change folder path
- **Output**: `feature-spec.md` written to change folder
- **Gate**: Write .md to change folder
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" before dispatching the next stage

### Stage 5: Build
- **Agent**: `builder`
- **Reads from disk**: **all** `.md` files in change folder
- **Prompt includes**: all document contents + change folder path
- **Output**: Code edits (new/modified files), npm commands executed
- **Instruction**: *"Prefer edit over write — only create new files when they don't exist. Run the build after implementing."*
- **Retry limit**: Max **3 attempts**. If builder fails 3 times, report to user with error summary and ask how to proceed
- **Gate**: If read-only mode, error with clear message asking for implement mode
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" — or "fix" to retry

### Stage 6: Verify
- **Agent**: `verifier`
- **Prompt includes**: list of changed files
- **Output**: `verification.md` with lint/typecheck/test results, written to change folder
- **Gate**: If failures → dispatch builder again (increment retry counter). If retries exhausted, report to user
- **⏸️ Stop**: After this stage, use `question()` and wait for the user to say "continue" or "archive"

## Agent Dispatch Templates

### Explorer prompt template
```
Change folder: [path]
Feature description: [what the user wants]

Thoroughly explore the project at [project path].
Focus on:
- What state management exists (if any)?
- What models/interfaces are defined?
- What patterns are used (components, DI, routing)?
- What dependencies are available?

Write exploration.md to [change folder].
```

### Proposer prompt template
```
Change folder: [path]

Read exploration.md from [change folder].
Contents:
[content of exploration.md]

Based on this exploration, propose a technical approach with options,
tradeoffs, and a recommendation.

Write proposal.md to [change folder].
```

### Designer prompt template
```
Change folder: [path]

Read exploration.md from [change folder].
Read proposal.md from [change folder].
Contents:
[content of exploration.md + proposal.md]

Design the implementation: component trees, data flow, route map,
file-by-file plan.

Write design.md to [change folder].
```

### Spec-writer prompt template
```
Change folder: [path]

Read exploration.md from [change folder].
Read proposal.md from [change folder].
Read design.md from [change folder].
Contents:
[content of all three documents]

Write a full spec (feature-spec.md) to [change folder] with:
- Requirements
- Acceptance criteria
- Files to create, modify, delete
- Data flow
- Dependencies
```

### Builder prompt template
```
Change folder: [path]

Read all .md files from [change folder] (exploration.md, proposal.md,
design.md, feature-spec.md).
Contents:
[content of all .md files]

Implement the feature according to the spec.
- Prefer edit over write — only create new files when they don't exist
- Follow the project's existing conventions (check neighboring files)
- If you hit errors, fix them and retry. You have up to 3 attempts.
- Run the build after implementing.

Verify with: [build command].
```

### Verifier prompt template
```
Changed files: [list]
Change folder: [path]

Run quality checks on the project.
Commands: [lint, typecheck, test commands from project config].
Report PASS/FAIL for each. If FAIL, include specific errors.

Write verification.md to [change folder].
```

## Rules

- **Never write code directly** — always dispatch builder
- **Always ask** the user before proceeding past the proposer stage
- **Always ask** clarifying questions when requirements are ambiguous
- If a stage agent returns an error, re-dispatch with more context
- Builder retry limit: **3 attempts max**, then escalate to user
- If read-only mode is detected, stop and ask user to switch to implement mode
