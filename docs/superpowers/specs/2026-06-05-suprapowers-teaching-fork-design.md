# suprapowers — Teaching Fork of superpowers (Design)

**Date:** 2026-06-05
**Status:** Approved design — proof of concept
**Author:** Erik Hoggard (brainstormed with Claude)

## Problem & Motivation

Modern AI coding assistants do the implementation *for* you. For a senior developer
this causes three problems:

1. **Skill atrophy** — letting the AI write everything erodes hands-on ability.
2. **Shallow codebase understanding** — passively approving generated code means you
   never build the deep mental model you'd get from writing it.
3. **Slow ramp on new languages** — generated code in an unfamiliar language teaches
   you little about its idioms and features.

The superpowers library has an excellent idea → spec → plan → implement pipeline, but
its implementation phase has Claude do the coding. `suprapowers` keeps everything that
makes superpowers good and **replaces only the implementation phase with a teaching
experience**: the system coaches you while *you* write the code yourself, explaining
*why* the structure is what it is and surfacing the language features and idioms you
need as you need them.

**Target learner:** a senior developer who wants to keep their skills sharp, understand
their codebases more deeply, and ramp faster on new languages and codebases. The
coaching assumes general programming competence (no "what is a loop") but teaches
language-specific idioms, architecture reasoning, and the "why" behind decisions.

## Approach

Fork the entire superpowers plugin as `suprapowers`. Inherit the proven front-end
unchanged; rewrite **only** the implementation-phase skills into teaching skills.

Forking (rather than a piggyback/override plugin) is deliberate: overriding just the
implementation skills of an installed superpowers would mean fighting a skill-precedence
battle at the implementation phase. Forking lets us edit those skills directly while the
untouched front-end comes along for free.

### What is inherited unchanged
`brainstorming`, `writing-plans`, `systematic-debugging`, `using-git-worktrees`,
`verification-before-completion`, hooks, commands plumbing, and `using-superpowers`
(rebranded). The full idea → spec → plan front-end is untouched. `writing-plans`
produces a plan document on disk; that document is the clean seam the teaching
executor consumes.

### What is rewritten (PoC scope)
- `executing-plans` → teaching loop (see below).
- `test-driven-development` → test-as-exercise version (see below).

### Out of PoC scope
- `subagent-driven-development` (spawning agents to write code contradicts the premise).
- Codebase-comprehension / "walk me through this code" mode (separate activity; future).
- Standalone-product polish; multi-language tuning beyond what coaching adapts to naturally.

### Packaging
New `plugin.json` (name `suprapowers`, own version). Run `suprapowers` *instead of*
superpowers so the duplicated skill names don't collide.

## The Core Teaching Loop (rewritten `executing-plans`)

Each step of the plan becomes a coaching cycle:

1. **Frame** — Read the next plan step and explain *what* it builds, *where* it goes,
   *how* it connects to existing code, and the *why* behind the structure.
2. **Teach the tools** — Surface the language features / idioms / APIs needed for this
   step and any tradeoffs ("a map or a struct here — here's why a struct fits").
   Calibrated to "senior dev, new to this language."
3. **State handover & hard-stop** — Per the handover dial, state exactly what *you*
   should write, then **stop and wait**. The system writes nothing it has handed over.
4. **Review on signal** — When you say "review me," the system reads what you wrote
   (via `git diff` / changed files) and runs the tiered coaching loop.
5. **Converge & advance** — Once the step is right, give a brief "here's what you just
   learned and why it matters" recap, then move to the next step.

**Defining behavioral rule:** at step 3 the system **hard-stops and does not write the
handed-over implementation.** Grabbing the keyboard is treated as a failure, the same
way superpowers treats skipping a failing test as a failure.

## The Handover Dial (expresses models A and C)

One dial expresses both interaction models we explored. It has a **session default**
and **per-step negotiation**.

- **Full hands-off (model A):** the dial pinned to "hand over everything." The system
  writes nothing for the step — not even boilerplate. You write all of it.
- **Negotiated (model C):** the dial in the middle. The system splits the step into
  *boilerplate/mechanical* vs *conceptually meaty*, offers to take the boilerplate so
  your effort goes where the learning is, and says explicitly which parts it is leaving
  for you and *why those are the interesting ones*.

Mechanics:
- Ask for a **session default** at the start of execution.
- At each step, **state what is about to be handed over before doing it**, so the dial
  is always visible and adjustable in the moment ("write that too" / "just scaffold this").
- **Anti-atrophy guardrails:** the system won't take a part you've flagged as something
  you're trying to learn, and when unsure it **errs toward handing over less** (you write it).

A is not a separate mode — it is the dial at one extreme; C is the dial negotiated per step.

## Tests as the Teaching Boundary (rewritten `test-driven-development`)

Superpowers' test-first discipline becomes the natural shape of an exercise:

- **The system writes and explains the failing (red) test.** Writing a good test
  requires understanding the spec, not the implementation, so this doesn't rob you of
  coding practice — and it models what a good test looks like and *why*.
- **You write the implementation that makes it pass.** This is the handover: a crisp,
  self-checking exercise with an unambiguous done signal — the test goes green.
- **You run the tests yourself.** The system tells you the command; you run it and report
  results. Running tests is a skill too, and it keeps you in the loop.
- **The system reviews your green code** with tiered coaching, then advances.

In TDD form the per-step loop is: *frame → teach tools → system writes & explains red
test → you write code to green → you run the test → coached review → next.* In negotiated
mode, "system writes the test, you write the impl" is itself a sensible default split.

## Coaching Philosophy & Review Mechanics

**Tiered coaching** (set during brainstorming):
- Hint first → leading question → fuller explanation → (only on explicit request) the
  actual code.
- **Firm and escalating** on correctness, real footguns, security, and important idioms
  worth internalizing.
- **Light-touch** on style: when code works but isn't idiomatic/optimal, flag it as the
  lowest tier — a brief "there's a more idiomatic way here, want me to point at it?" —
  rather than a full correction. Every suboptimal line is *available* as a teaching
  moment without every line *becoming* a lecture.

**Mechanics — how the system sees your code without watching you type:**
- The project is a git repo (PoC runs `git init` if needed). On "review me," the system
  runs `git diff` / reads changed files to see exactly what you wrote since the handover.
  Git is the channel between your editor and the coach.
- **The system does not edit your files during a handover step.** It reads, coaches in
  chat, and points to `file:line`. You make the fixes. "Just show me the fix" is the
  top-tier escape hatch, not the default.
- **The run signal is yours.** You run tests/commands and report results; the system
  reacts. It never silently runs-and-fixes in the background.

**Why read-only during your turn:** the moment the system can freely edit during a
handover, it drifts back toward doing it for you. Reading-only during the handover is the
structural guardrail that enforces the whole premise — the same spirit as superpowers
making a failing test non-negotiable.

## PoC Scope & Definition of Done

**Build:**
1. Fork superpowers → `suprapowers` (new `plugin.json`; rebranded `using-superpowers`;
   all front-end skills inherited unchanged).
2. Rewrite `executing-plans` into the teaching loop with the handover dial.
3. Rewrite `test-driven-development` into the test-as-exercise version.
4. Bake in the structural guardrails: hard-stop at handover, read-only during your turn,
   you run the tests, err toward handing over less.
5. Leave `subagent-driven-development` out.

**Successful if:** you can take a real plan (from the inherited `writing-plans`) through
`suprapowers`' teaching `executing-plans`, and the experience is: it explains the *why*
and the language features, hands you the actual coding, coaches you with tiered hints
when you're wrong, refuses to grab the keyboard, and at the end you've written the code
yourself and understand it better than if it had been generated.

**Explicit non-goals:** codebase-comprehension mode, the subagent skill, multi-language
tuning beyond natural coaching adaptation, standalone-product polish.
