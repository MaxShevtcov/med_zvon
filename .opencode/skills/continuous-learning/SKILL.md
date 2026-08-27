---
name: continuous-learning
description: Instinct-based learning system that extracts patterns from sessions, creates atomic instincts with confidence scoring, and evolves them into skill refinements. Adapted from ECC continuous-learning-v2.
---

# Continuous Learning

Learn from each session and improve skills/agents over time. Every development session generates reusable patterns — this skill ensures they don't get lost.

## Core Loop

```
Session work → extract patterns → store instincts → evolve skills → better future sessions
```

## How It Works

### 1. Pattern Extraction (end of each session)

When a task is substantially complete, review the session for:

**Pattern Types**

| Type | What to look for | Example |
|------|-----------------|---------|
| Error resolution | How you fixed a build/test error | "Prisma generate needed after schema change" |
| User correction | User corrected your approach | "Use `QdrantClient.query()` not `.search()` for hybrid" |
| Workflow quirk | Non-obvious command/order | `set -a && source .env && set +a` before ingestion |
| Repo convention | Code style or structure rule | "DTOs in `api/*/dto.ts`, services in `services/`" |
| Config gotcha | Environment setup nuance | `OPENAI_MODEL` falls back to `gpt-4o-mini` on 404 |

### 2. Instinct Storage

Store each pattern as an atomic instinct in `.opencode/learned/`:

```yaml
# .opencode/learned/YYYY-MM-DD--short-name.yaml
---
id: prisma-generate-after-schema-change
trigger: after editing prisma/schema.prisma
action: run npx prisma generate && npx prisma db push --skip-generate
confidence: 0.8
domain: workflow
source: session-observation
project: med-zvon
---

# Prisma generate after schema change

## Evidence
- Forgot to generate after adding Collection model
- Build failed with "model not found" error
- Resolved by running prisma generate
```

### 3. Confidence Scoring

| Score | Meaning | Behavior |
|-------|---------|----------|
| 0.3 | Tentative | Mention if relevant |
| 0.5 | Moderate | Apply when context matches |
| 0.7 | Strong | Auto-apply |
| 0.9 | Near-certain | Treat as rule |

**Increases**: pattern repeated, user agrees. **Decreases**: contradicted, not observed.

### 4. Skill Evolution

When 3+ related instincts accumulate (`/evolve`), cluster them into skill updates:

1. Create `.opencode/skills/<name>/SKILL.md` with the patterns
2. Register it in `opencode.json` → `skills.paths`
3. Add an agent in `opencode.json` → `agent` if a specialized role emerges
4. Update `AGENTS.md` if the pattern affects workflow commands

## Commands

| Invocation | What it does |
|------------|-------------|
| `/learn` | Extract patterns from current session, store as instincts |
| `/evolve` | Cluster related instincts into skill/agent proposals |
| `/instinct-status` | List all stored instincts with confidence scores |

## Instinct File Format

```yaml
---
id: kebab-case-unique-id
trigger: "situation that triggers this"
action: "what the agent should do"
confidence: 0.7  # 0.3-0.9
domain: workflow|code-style|testing|config|debugging
source: session-extraction
project: med-zvon
---

# Human-readable title

## Evidence
- What happened in the session
- Why this pattern matters
- How it was resolved

## Example
```bash
# concrete command or code snippet
```
```

## Evolution Trigger

Run `/evolve` when you notice:
- 3+ instincts in the same domain (e.g., "testing")
- A pattern has been seen 5+ times (confidence ≥ 0.7)
- A workflow is stable enough to codify
- Skills feel incomplete or missing important patterns
