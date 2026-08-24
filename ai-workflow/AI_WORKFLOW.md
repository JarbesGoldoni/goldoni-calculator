# How I Use AI — My Development Workflow

I treat AI as a development partner, not an autopilot. My role is **Product Owner + Software Engineer**: I own every design decision, architecture choice, and acceptance criteria before any code is written. The AI executes within the boundaries I define.

My workflow has two phases.

---

## Phase 1: Refinement — Understand the task, define the plan

Before writing any code, I iterate with AI to deeply understand the problem and produce a clear, step-by-step implementation plan.

I start by drafting a prompt that captures my initial understanding of the task. Then I ask the AI to review it against the actual requirements, surface gaps, and propose alternatives. **I make the decisions** — the AI presents options with trade-offs, and I choose.

This back-and-forth continues until the plan is clear, complete, and each step is well-scoped. The result is a final prompt with explicit steps that leave no ambiguity.

**For this project, the refinement artifacts are:**
- [`01-challenge-requirements.md`](01-challenge-requirements.md) — Engineering challenge requirements and constraints
- [`02-initial-prompt.md`](02-initial-prompt.md) — My first draft, before any review
- [`03-ready-prompt.md`](03-ready-prompt.md) — The refined, production-ready implementation plan after iterating on gaps (API design, CORS strategy, testing approach, missing requirements)
- [`04-ui-ux-refinement-prompt.md`](04-ui-ux-refinement-prompt.md) — Real-world UI/UX refinement iteration (fixing layout shifts on long decimals, decimal formatting, and gradient color palette)

---

## Phase 2: Execution — Build step by step with review loops

With the plan locked, I execute it using a structured agent workflow. A **main agent** orchestrates the process and delegates each step to a **subagent**. Steps run sequentially — one must pass before the next begins.

Each step follows the same cycle:

```
1. Implement  →  Write the code and its tests
2. Verify     →  Run the build and test suite
3. Review     →  Code review by a dedicated reviewer agent
   └── If issues found → fix and re-verify until clean
```

Only after a step passes all three stages does the main agent move to the next step.

---

### Why subagents — context economics

Each step runs in its own subagent with a fresh, focused context window. This workflow deliberately leverages short, isolated contexts to significantly reduce token consumption and keep inference costs low while maximizing accuracy:

- **Frontier models on lean contexts beat mid-tier models on bloated ones.** Running top-tier frontier models across short, focused context windows is substantially more cost-effective and accurate than running cheaper models weighed down by long, accumulated contexts. Lean contexts directly prevent hallucinations, eliminate reasoning drift, and avoid costly rework.
- **Avoiding rework is the real cost savings.** When models work within bloated contexts, they tend to make subtle mistakes that require full rewrites. Scoping agents to tight, clean contexts ensures tasks are executed correctly the first time.
- **Step isolation keeps context permanently fresh.** By scoping each subagent to a single, well-defined step, context never degrades over time. The orchestrator carries only the high-level roadmap and verified step outcomes, while individual execution histories are cleanly discarded.

---

## Why this workflow

- **I decide, AI executes.** Architecture, API contracts, trade-offs — these are my calls. AI surfaces options; I pick.
- **No big-bang delivery.** Step-by-step execution with review gates catches issues early.
- **Context-aware by design.** Subagent isolation keeps token usage lean, enabling frontier models at lower cost with fewer failures.
- **Reviewable process.** Every decision is traceable — from initial prompt to final plan to code.
