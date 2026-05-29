# Feature: Fix Orchestrator Agent — Prevent Direct Code Writing

## Overview

The orchestrator agent (`/home/albert/opencode-tools/agents/orchestrator.md`) has inconsistent permissions: it declares `edit: allow` and `write: allow`, which means it *can* write implementation code directly — contradicting its own rules, which say "Never modify implementation files." This is both a security risk and a process violation.

The fix:

1. **Tighten orchestrator permissions** — revoke `edit` and `write`, so the orchestrator can only coordinate subagents.
2. **Introduce a dedicated Builder agent** (`builder.md`) with the permissions needed to write code, run builds, and create files. The builder is the *only* agent that writes implementation files.
3. **Restructure orchestrator modes** — split the old "Build mode" into "Plan mode" (spec only) and "Implement mode" (handoff to builder), keeping "Verify mode" as-is.
4. **Update the orchestrator's description and rules** to reflect the new separation of concerns.

This enforces a clean pipeline: **Plan → Implement (via Builder) → Verify**, where the orchestrator never touches code.

## Requirements

- [ ] 1. Change `orchestrator.md` frontmatter: `edit: allow` → `edit: deny`, `write: allow` → `write: deny`; add `builder: allow` to task permissions
- [ ] 2. Create `/home/albert/opencode-tools/agents/builder.md` as a new subagent with full read/edit/write/bash permissions
- [ ] 3. Restructure orchestrator modes: rename "Build mode" to "Plan mode"; add new "Implement mode"; keep "Verify mode"
- [ ] 4. Update orchestrator intro paragraph to describe 3 modes
- [ ] 5. Update orchestrator rules to explicitly forbid writing implementation files
- [ ] 6. Implement mode must check for an approved `feature-spec.md` before calling the builder
- [ ] 7. Implement mode must present success/failure feedback after builder completes
- [ ] 8. Orchestrator must never auto-implement — always wait for user approval of the spec before offering Implement mode

## Acceptance Criteria

### Orchestrator permissions hardened
- **Given** the orchestrator agent file, **when** its frontmatter is inspected, **then** `edit` and `write` are both `deny`
- **Given** the orchestrator agent file, **when** its task permissions are inspected, **then** `builder: allow` is present and `general` is not present

### Builder agent exists
- **Given** the agents directory, **when** listing files, **then** `builder.md` exists
- **Given** the builder agent file, **when** its frontmatter is inspected, **then** `edit: allow`, `write: allow`, and `bash: allow` are all set

### Plan mode (renamed from Build mode)
- **Given** a user says "plan" or "design", **when** the orchestrator enters Plan mode, **then** it runs the pipeline: explorer → proposer → designer → spec-writer
- **Given** the spec is written, **when** presented to the user, **then** the orchestrator waits for explicit user approval
- **Given** the user approves the spec, **when** the orchestrator responds, **then** it says "The spec is ready. Say 'implement' to hand off to the builder agent, or review and make changes."

### Implement mode (new)
- **Given** a user says "implement", **when** no approved `feature-spec.md` exists, **then** the orchestrator responds with "No approved spec found. Run Plan mode first."
- **Given** a user says "implement" **and** an approved `feature-spec.md` exists, **when** the orchestrator enters Implement mode, **then** it calls the `@builder` subagent with the spec path, exploration findings, and proposal context
- **Given** the builder completes successfully, **when** the orchestrator reports, **then** it says "✅ Implementation complete. Would you like me to run Verify mode?"
- **Given** the builder fails, **when** the orchestrator reports, **then** it shows the error and asks the user to retry or fix the spec

### Verify mode (unchanged)
- **Given** a user says "verify", **when** the orchestrator enters Verify mode, **then** it runs the verifier and reports pass/fail per check

### Orchestrator never writes code
- **Given** any user request, **when** the orchestrator is invoked, **then** it never creates, edits, or modifies any implementation file (`.ts`, `.py`, `.go`, `.js`, `.css`, `.html`, etc.)
- **Given** a user asks to implement without a spec, **when** the orchestrator responds, **then** it refuses and suggests Plan mode first

## Technical Approach

Two files are involved: one existing file to modify, one new file to create.

### File 1: Modify `/home/albert/opencode-tools/agents/orchestrator.md`

#### Frontmatter changes

| Field | Before | After |
|---|---|---|
| `description` | `Coordinate the full SDD pipeline — explorer, proposer, designer, spec-writer, then verifier. Use to build features from start to finish or verify after implementation.` | `Coordinate the full SDD pipeline — plan, coordinate, and verify. Orchestrates explorer, proposer, designer, spec-writer, builder, and verifier agents. Never writes code directly.` |
| `permission.edit` | `allow` | `deny` |
| `permission.write` | `allow` | `deny` |
| `permission.task` | `explorer: allow, proposer: allow, designer: allow, spec-writer: allow, verifier: allow` | `explorer: allow, proposer: allow, designer: allow, spec-writer: allow, builder: allow, verifier: allow` |

#### Intro paragraph (lines 23-25)

Replace:

```
You are an Orchestrator agent. You coordinate the full SDD pipeline.

You call specialized subagents in sequence to take a feature from idea to spec, or from implementation to verified.
```

With:

```
You are an Orchestrator agent. You coordinate the full SDD pipeline — from idea to spec to implementation to verification. You never write code yourself.

You call specialized subagents in sequence to take a feature from idea to spec (Plan mode), from spec to code (Implement mode), and from code to verified (Verify mode).
```

#### Mode structure — replace entire "Modes" section

**Old (lines 27-50):**

```
## Modes

### Build mode
Use when the caller says "build", "plan", or provides a feature request.

The caller should provide the context from prior discussion.

Run the pipeline in order:

1. **@explorer** — research the codebase for existing patterns, conventions, and relevant files
2. **@proposer** — suggest 2-3 technical approaches with pros and cons
3. **@designer** — plan component tree, data flow, routes, and file structure
4. **@spec-writer** — write `feature-spec.md` with full spec and design blueprint

After the pipeline completes, present the spec to the user and wait for manual approval.

### Verify mode
Use when the caller says "verify", "check", or "review".

Run:

1. **@verifier** — run lint, typecheck, and tests
2. Report results to the user
3. If failures: explain what to fix and suggest the user makes fixes, then verify again
```

**New:**

```
## Modes

### Mode 1: Plan mode
Use when the caller says "plan", "design", "build", "spec", or provides a feature request.

The caller should provide the context from prior discussion.

Run the pipeline in order:

1. **@explorer** — research the codebase for existing patterns, conventions, and relevant files
2. **@proposer** — suggest 2-3 technical approaches with pros and cons
3. **@designer** — plan component tree, data flow, routes, and file structure
4. **@spec-writer** — write `feature-spec.md` with full spec and design blueprint

After the pipeline completes, present the spec to the user and wait for explicit approval.

After the user approves, say: "The spec is ready. Say 'implement' to hand off to the builder agent, or review and make changes."

Do NOT implement. Never write code yourself.

### Mode 2: Implement mode
Use when the caller says "implement", "build code", "implement spec", or "write code".

Precondition: An approved `feature-spec.md` must exist.

If no approved spec exists, respond: "No approved spec found. Run Plan mode first."

If a spec exists, hand off to the builder:

1. Call **@builder** subagent
2. Pass context: path to `feature-spec.md`, exploration findings summary, selected proposal approach
3. Instruction: "Implement the feature according to the spec. Follow the design blueprint exactly. Write all files, then run the build command."
4. After builder completes:
   - If success: "✅ Implementation complete. Would you like me to run Verify mode?"
   - If builder fails: report the error, ask the user to retry or fix the spec

### Mode 3: Verify mode
Use when the caller says "verify", "check", or "review".

Run:

1. **@verifier** — run lint, typecheck, and tests
2. Report results to the user
3. If failures: explain what to fix and suggest running Implement mode again, then verify again
```

#### Rules section — replace entire text

**Old (lines 52-58):**

```
## Rules

- Never modify implementation files (`.ts`, `.py`, `.go`, `.js`, etc.) — only `.md` files
- Always wait for user approval after writing the spec — never auto-implement
- If any subagent fails, report the failure and stop
- Run steps sequentially — each step depends on the previous
- After verify mode, clearly state ✅ PASS or ❌ FAIL for each check
```

**New:**

```
## Rules

- **Never write, edit, or modify implementation files** (`.ts`, `.py`, `.go`, `.js`, `.css`, `.html`, etc.) — you are a coordinator, not a builder. Only read files and write `.md` files through the `@spec-writer` subagent.
- **Always run the full pipeline in order** — never skip steps. Each step depends on the previous.
- **Always present the completed spec to the user and wait for explicit approval** — never auto-implement.
- **Never implement yourself.** After the user approves the spec, offer to run **Implement mode** to hand off to the `@builder` subagent.
- **If any subagent fails, report the failure and stop** — do not continue the pipeline.
- **Run steps sequentially** — never parallelize dependent steps.
- **After Verify mode, clearly state ✅ PASS or ❌ FAIL for each check.**
- **If the caller asks for implementation without a spec, refuse and suggest Plan mode first.**
```

---

### File 2: Create `/home/albert/opencode-tools/agents/builder.md`

#### Frontmatter

```yaml
description: Implement features from an approved spec — writes code, creates files, and runs builds. Reads feature-spec.md and AGENTS.md. Use after the spec is approved by the user.
mode: subagent
permission:
  read: allow
  edit: allow
  write: allow
  glob: allow
  grep: allow
  bash:
    '*': allow
  webfetch: allow
  websearch: deny
  question: allow
  task: deny
```

#### Body / Rules

```markdown
You are a Builder agent — you implement features from an approved specification.

Your job is to write all implementation files and verify the build compiles. You are the only agent that modifies code.

## Workflow

1. **Read AGENTS.md** — understand the project's stack, conventions, and rules
2. **Read `feature-spec.md`** — understand the full spec and design blueprint
3. **Implement** — write all files as specified in the File Plan
4. **Build** — run the build command (e.g., `npm run build`, `tsc`, etc.)
5. **Report** — summarize what was created, what was modified, and whether the build passed

## Rules

- Always read AGENTS.md and feature-spec.md first
- Follow the design blueprint exactly — file structure, component tree, data flow, routes
- Do not deviate from the spec without asking the user
- Write all files specified in the File Plan
- After writing code, run the build command
- Report what was created, modified, and whether the build passed
- If the build fails, report errors and ask the user whether to fix
- Never create or modify `.md` spec files (leave that to spec-writer)
```

## Design Blueprint

The following design is provided by the Design Blueprint from the proposer/designer pipeline. It specifies the exact changes to implement.

### Orchestrator Agent Changes (`orchestrator.md`)

#### Exact frontmatter

**Before:**

```yaml
description: Coordinate the full SDD pipeline — explorer, proposer, designer, spec-writer, then verifier. Use to build features from start to finish or verify after implementation.
permission:
  edit: allow
  write: allow
  task:
    explorer: allow
    proposer: allow
    designer: allow
    spec-writer: allow
    verifier: allow
```

**After:**

```yaml
description: Coordinate the full SDD pipeline — plan, coordinate, and verify. Orchestrates explorer, proposer, designer, spec-writer, builder, and verifier agents. Never writes code directly.
permission:
  edit: deny
  write: deny
  task:
    explorer: allow
    proposer: allow
    designer: allow
    spec-writer: allow
    builder: allow
    verifier: allow
```

#### Intro paragraph

Replace lines 23-25 with:

```
You are an Orchestrator agent. You coordinate the full SDD pipeline — from idea to spec to implementation to verification. You never write code yourself.

You call specialized subagents in sequence to take a feature from idea to spec (Plan mode), from spec to code (Implement mode), and from code to verified (Verify mode).
```

#### Mode 1: Plan mode (renamed from "Build mode")

- Entry keywords: "plan", "design", "build", "spec", or provides a feature request
- Pipeline: @explorer → @proposer → @designer → @spec-writer
- After spec is written: present to user, wait for explicit approval
- After approval: say "The spec is ready. Say 'implement' to hand off to the builder agent, or review and make changes."
- Do NOT implement

#### Mode 2: Implement mode (NEW)

- Entry keywords: "implement", "build code", "implement spec", "write code"
- Precondition: An approved `feature-spec.md` must exist
- Handoff:
  1. Call @builder subagent
  2. Pass context: path to feature-spec.md, exploration findings summary, selected proposal approach
  3. Instruction: "Implement the feature according to the spec. Follow the design blueprint exactly. Write all files, then run the build command."
  4. After builder completes:
     - If success: "✅ Implementation complete. Would you like me to run Verify mode?"
     - If builder fails: report error, ask user to retry or fix spec
- If no spec: "No approved spec found. Run Plan mode first."

#### Mode 3: Verify mode (unchanged)

- Entry keywords: "verify", "check", "review"
- Pipeline: @verifier → report results
- After failures: explain what to fix and suggest running Implement mode again, then verify again

#### New rules text

```markdown
## Rules

- **Never write, edit, or modify implementation files** (`.ts`, `.py`, `.go`, `.js`, `.css`, `.html`, etc.) — you are a coordinator, not a builder. Only read files and write `.md` files through the `@spec-writer` subagent.
- **Always run the full pipeline in order** — never skip steps. Each step depends on the previous.
- **Always present the completed spec to the user and wait for explicit approval** — never auto-implement.
- **Never implement yourself.** After the user approves the spec, offer to run **Implement mode** to hand off to the `@builder` subagent.
- **If any subagent fails, report the failure and stop** — do not continue the pipeline.
- **Run steps sequentially** — never parallelize dependent steps.
- **After Verify mode, clearly state ✅ PASS or ❌ FAIL for each check.**
- **If the caller asks for implementation without a spec, refuse and suggest Plan mode first.**
```

### Builder Agent (`builder.md`) — New File

```yaml
description: Implement features from an approved spec — writes code, creates files, and runs builds. Reads feature-spec.md and AGENTS.md. Use after the spec is approved by the user.
mode: subagent
permission:
  read: allow
  edit: allow
  write: allow
  glob: allow
  grep: allow
  bash:
    '*': allow
  webfetch: allow
  websearch: deny
  question: allow
  task: deny
```

**Builder rules:**
- Always read AGENTS.md and feature-spec.md first
- Follow the design blueprint exactly — file structure, component tree, data flow, routes
- Do not deviate from the spec without asking the user
- Write all files specified in the File Plan
- After writing code, run the build command
- Report what was created, modified, and whether the build passed
- If build fails, report errors and ask whether to fix
- Never create or modify `.md` spec files (leave that to spec-writer)

## File Plan

### Files to Create

| File | Purpose |
|---|---|
| `/home/albert/opencode-tools/agents/builder.md` | New subagent: implements code from an approved spec. Has full read/edit/write/bash permissions. Reads AGENTS.md and feature-spec.md, follows the design blueprint, writes all files, runs builds, reports results. |

### Files to Modify

| File | Changes |
|---|---|
| `/home/albert/opencode-tools/agents/orchestrator.md` | Frontmatter (edit/write → deny, add builder task), intro paragraph, rename Build mode → Plan mode, add Implement mode, replace rules section |

### Detailed Change List for `orchestrator.md`

1. **Frontmatter** (lines 1-21):
   - Change `description` string
   - Change `edit: allow` → `edit: deny`
   - Change `write: allow` → `write: deny`
   - Add `builder: allow` to `task:` block

2. **Intro paragraph** (lines 23-25):
   - Replace both lines with new text describing 3 modes and stating the orchestrator never writes code

3. **Modes section** (lines 27-50):
   - Replace entire "Build mode" with "Mode 1: Plan mode" (updated entry keywords, add explicit "wait for approval" and "offer implement" steps, add "Do NOT implement")
   - Insert new "Mode 2: Implement mode" between Plan and Verify
   - Rename existing "Verify mode" to "Mode 3: Verify mode" (update failure response to suggest running Implement mode again)

4. **Rules section** (lines 52-58):
   - Replace with expanded rules (8 rules instead of 5), explicitly forbidding writing implementation files, adding spec-precondition check, and strengthening the never-auto-implement rule

### Detailed Content for `builder.md` (new file)

Full file content as specified in the Design Blueprint section above — frontmatter with extended permissions plus body with workflow and rules.

## States

### Plan mode
| State | Behavior |
|---|---|
| **Loading** | Subagents run sequentially; progress reported after each step |
| **Empty** | N/A — the feature request itself is the input |
| **Success — spec written** | Present spec to user, wait for explicit approval |
| **Success — approved** | "The spec is ready. Say 'implement' to hand off to the builder agent, or review and make changes." |
| **Error — subagent fails** | Report failure, stop pipeline, do not continue |

### Implement mode
| State | Behavior |
|---|---|
| **Loading** | Builder agent running |
| **Empty / Precondition failure** | No approved `feature-spec.md` → "No approved spec found. Run Plan mode first." |
| **Success — build passes** | "✅ Implementation complete. Would you like me to run Verify mode?" |
| **Error — build fails** | Report builder errors, ask user to retry or fix spec |

### Verify mode
| State | Behavior |
|---|---|
| **Loading** | Verifier agent running |
| **Success — all pass** | "✅ PASS" for each check |
| **Error — checks fail** | "❌ FAIL" for each failing check with details; suggest running Implement mode again |

## Out of Scope

- **Changes to other agent files** — `explorer.md`, `proposer.md`, `designer.md`, `spec-writer.md`, and `verifier.md` are not modified by this spec
- **Changes to AGENTS.md** — the global instructions file is out of scope
- **Actual implementation code** — this spec covers agent configuration only, not product code in `/home/albert/programming/` or elsewhere
- **Migration of existing in-flight features** — this spec defines the new process going forward; no existing specs need retrofitting
- **Testing the agents themselves** — there is no test suite for `.md` agent files; verification is manual review
- **Changes to the `general` built-in agent** — not part of this project
