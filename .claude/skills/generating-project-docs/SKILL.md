---
name: generating-project-docs
description: Use when asked to document a project, generate architecture docs, create or update CLAUDE.md, produce codebase documentation for onboarding, or explain how a codebase is organized.
---

# Generating Project Documentation

## Overview

Generates useful, non-redundant documentation by auditing what already exists, defining the audience, then filling the exact gap.

**Core principle:** Complement existing docs — never duplicate them.

## Process

### Step 1: Discovery (BEFORE writing anything)

**This step is mandatory even if the user already told you the output format.**
The user telling you "write a README" doesn't mean one doesn't already exist or that CLAUDE.md doesn't already cover it.

Run these in parallel:

```
- List root directory for existing docs (README.md, CLAUDE.md, docs/, wiki/)
- Read package.json → stack, scripts, exact versions
- Check if there are any existing architecture or onboarding files
```

**Decision after discovery:**

```
Existing docs cover the topic?
  YES → extend or update them, don't create a new file
  NO  → create new file(s), decide format (see Step 2)
```

**Multiple doc types requested at once:**
Prioritize and handle one at a time. Order: CLAUDE.md first (AI agents use it in every session), then onboarding, then architecture, then infra.

### Step 2: Define Audience and Output Format

Decide this BEFORE exploring the codebase. Ask if not told.

| Audience | Output | Priority sections |
|----------|--------|-------------------|
| New developer (onboarding) | README or ONBOARDING.md | Setup, local dev, architecture, patterns, what NOT to do |
| AI agent | CLAUDE.md | Stack table, commands, folder structure, conventions, forbidden patterns |
| External reviewer | ARCHITECTURE.md | Data flows, security boundaries, external dependencies |
| DevOps / infra | DEPLOYMENT.md | Env vars, infra, deployment steps |

### Step 3: Structured Codebase Exploration

Explore in **this order** (most information density first). Skip generated/vendor code (`ui/`, `dist/`, `.next/`, lockfiles).

1. Root config files (`next.config.js`, `tsconfig.json`, `vite.config.ts`, etc.)
2. Auth / middleware files — security model
3. Root layout / entry point — provider hierarchy, global wiring
4. Most complex module (identified from directory scan) — core business logic
5. Shared utilities (`lib/`, `utils/`) — patterns used everywhere
6. Type files (`types/`) — domain model
7. All `process.env` / `import.meta.env` usages — complete env var list

### Step 4: Write Documentation

**For onboarding (new developer):**
- [ ] Stack table (technology | version | purpose)
- [ ] Prerequisites and local setup commands
- [ ] Annotated directory tree (skip obvious folders)
- [ ] At least one end-to-end data flow (the most important user journey)
- [ ] Key patterns with short code examples (auth, data fetching, forms)
- [ ] Complete environment variables table
- [ ] What NOT to do (forbidden patterns, generated files, legacy traps)
- [ ] External services / microservices map

**For CLAUDE.md specifically:**
- [ ] Stack table
- [ ] Commands (dev, build, lint, test)
- [ ] Annotated directory tree
- [ ] Architectural patterns (RSC vs client, state management, etc.)
- [ ] Code conventions with examples
- [ ] Hard constraints (what NOT to touch)

### Step 5: Quality Check

- [ ] No section duplicates existing CLAUDE.md / README — link instead
- [ ] Every code example is copy-paste ready, not pseudocode
- [ ] Environment variables table is exhaustive (grepped, not guessed)
- [ ] "What NOT to do" section exists
- [ ] Written for the defined audience, not a generic reader

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing before checking what exists | Always run Step 1 first — discovery is mandatory |
| No audience decision | Name a specific reader before writing a single word |
| Gut-feel exploration order | Follow Step 3 order — config → auth → entry → core → utils → types |
| "Same pattern" excuse to skip modules | Verify by reading, then note the pattern — don't assume |
| Duplicating existing CLAUDE.md in new file | Decide canonical home; link, never duplicate |
| Missing env vars | Grep `process.env` and `import.meta.env` — don't rely on .env.example alone |
| Massive single document for large projects | Split by audience; each file has one reader |

## Red Flags — Stop and Reconsider

- Writing docs before running Step 1 (even if the user said what format to use)
- Choosing a format without defining the audience
- Skipping a module because it "seems obvious" or "follows the same pattern"
- Copying information already in an existing doc
- Producing a doc longer than the codebase is complex
- Using `.env.example` as the only source for env vars — grep the code
