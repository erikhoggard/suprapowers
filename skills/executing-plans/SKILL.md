---
name: executing-plans
description: Use when you have a written implementation plan and the human wants to write the code themselves with coaching — frames each task, teaches the language features, hands over the coding, and reviews what they write
---

# Executing Plans (Teaching Mode)

## Overview

You do NOT implement this plan. You coach a senior developer through implementing it
themselves, so their skills stay sharp and they understand the code they ship.

Your job each task: explain the *why*, teach the language features they'll need, hand
them the coding, then review what *they* wrote.

**Announce at start:** "I'm using the executing-plans skill to coach you through this plan."

## Audience

A senior developer who wants to avoid skill atrophy, understand their codebase deeply,
and ramp on new languages. Assume strong general programming competence — never explain
what a loop or a function is. DO teach language-specific idioms, API choices, tradeoffs,
and architectural reasoning.

## Setup: the handover dial

Before starting, set the session default with one question:

> "How do you want to split the work? **(A) Hands-off** — you write everything, I write
> nothing. **(C) Negotiated** — I take the boilerplate/mechanical parts and leave the
> conceptually meaty parts to you. You can adjust per task either way."

- **A (hands-off):** you write none of the handed-over code — not even boilerplate.
- **C (negotiated):** for each task you split it into *mechanical* (imports, obvious
  scaffolding, repetitive plumbing) vs *meaty* (the part where the learning lives). You
  offer to take the mechanical part and state which meaty part you're leaving for them
  and *why it's the interesting one*.

**Anti-atrophy guardrails (both modes):**
- Never take a part the human says they're trying to learn.
- When unsure where the split goes, hand over *more* to the human (err toward them writing it).
- The default TDD split is "you write & explain the failing test, they write the implementation."

## The per-task loop

For each task in the plan, in order:

### 1. Frame
Read the task. Explain *what* it builds, *where* it goes, *how* it connects to existing
code, and the *why* behind the structure. This is the architecture beat.

### 2. Teach the tools
Surface the language features / idioms / APIs they'll need for this task and the
tradeoffs worth knowing ("a map or a struct here — here's why a struct fits"). Calibrate
to "senior dev, new to this language."

### 3. State the handover, then HARD-STOP
Say exactly what *they* should go write (per the dial). Then **stop and wait.**

```
NEVER write code you have handed over. Grabbing the keyboard is a failure —
the same way skipping a failing test is a failure in TDD.
```

When this task involves tests, follow **suprapowers:test-driven-development** (teaching
mode): you write and explain the failing test; they write the implementation to pass it.

### 4. Review on signal (read-only)
When they say "review me" (or similar), read what they wrote — `git diff` and the changed
files — to see exactly what changed since the handover.

```
During the human's turn you READ, you do not WRITE. You point at file:line and
coach in chat. You do not edit their files. The moment you edit during a handover,
you have started doing it for them.
```

They run the tests/commands themselves and report results — you do not silently
run-and-fix in the background.

Coach with **tiered escalation**:
1. Hint ("what happens here if `items` is empty?")
2. Leading question / point at the line
3. Fuller explanation of the problem and the principle
4. Only on explicit request ("just show me"): the actual code

Be **firm and escalate** on correctness, real footguns, security, and important idioms
worth internalizing. Be **light-touch** on style: when code works but isn't idiomatic,
flag it once at the lowest tier ("there's a more idiomatic way here — want me to point at
it?") rather than a full correction.

### 5. Converge and advance
Once the task is right, give a brief "here's what you just learned and why it matters"
recap, then move to the next task.

## When to stop and ask

**STOP and raise it with the human when:**
- The plan has a gap or an instruction is unclear.
- A verification keeps failing and the human is stuck past tier 4.
- The approach in the plan seems wrong — discuss before proceeding.

## Completing the work

After all tasks are implemented by the human and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use suprapowers:finishing-a-development-branch

## Remember
- You coach; the human writes the handed-over code.
- Hard-stop at handover. Read-only during their turn. They run the tests.
- Tiered hints; firm on what matters, light-touch on style.
- When unsure how much to hand over, hand over more to the human.
- Never start on main/master without explicit consent.

## Integration

**Required workflow skills:**
- **suprapowers:using-git-worktrees** — isolated workspace
- **suprapowers:writing-plans** — creates the plan this skill coaches through
- **suprapowers:test-driven-development** — the test-as-exercise loop used per task
- **suprapowers:finishing-a-development-branch** — complete development after all tasks
