# suprapowers Teaching Fork — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fork the superpowers plugin into a standalone `suprapowers` plugin whose implementation phase coaches the user to write code themselves (handover dial + tiered coaching) instead of writing it for them.

**Architecture:** Copy the entire superpowers 5.1.0 tree into this repo. Rebrand the plugin metadata. Rename the `brainstorming` skill to `lamestorm`. Rewrite only `executing-plans` and `test-driven-development` into teaching skills. Rebrand internal `superpowers:` skill-invocation references to `suprapowers:`. Remove `subagent-driven-development` (contradicts the premise). A Node validator script encodes every structural requirement as an assertion and is the test harness throughout.

**Tech Stack:** Markdown skill files (Claude Code plugin format), JSON plugin manifests, Node.js (validator script + inherited visual-companion scripts), Git, Bash (available on this Windows machine via Git Bash).

---

## File Structure

After the fork copy, the repo root mirrors superpowers. The files this plan **creates or modifies** (everything else is inherited verbatim):

| Path | Responsibility | Action |
|------|----------------|--------|
| `scripts/validate.mjs` | Test harness: asserts every structural requirement of the fork | Create |
| `.claude-plugin/plugin.json` | Plugin identity (name `suprapowers`) | Modify |
| `.claude-plugin/marketplace.json` | Local marketplace entry pointing at this plugin | Modify |
| `skills/lamestorm/SKILL.md` | Renamed brainstorming entry point (`name: lamestorm`) | Rename + modify |
| `skills/lamestorm/` (dir) | Renamed from `skills/brainstorming/` | Rename |
| `skills/using-superpowers/SKILL.md` | Cross-refs to the renamed skill + rebranded prefixes | Modify |
| `skills/writing-plans/SKILL.md` | Plan header points at `suprapowers:executing-plans`, drops subagent recommendation | Modify |
| `skills/executing-plans/SKILL.md` | **Rewritten** — teaching loop, handover dial, tiered coaching | Replace |
| `skills/test-driven-development/SKILL.md` | **Rewritten** — test-as-exercise | Replace |
| `skills/subagent-driven-development/` | Removed (out of PoC scope) | Delete |
| `hooks/session-start` | Injected branding + `suprapowers:using-superpowers` reference | Modify |
| All `skills/**/SKILL.md` | `superpowers:` → `suprapowers:` invocation prefix | Modify (bulk) |
| `README.md` | Top-level rebrand note (cosmetic) | Modify |

**Note on the inherited plan-header template:** the rewritten `executing-plans` is the teaching executor. Generated plans must point at it, so `writing-plans`' header template is edited to drop the `subagent-driven-development` recommendation. This is the only behavioral touch to the front-end beyond the rename.

**Constants used across tasks** (use these exact strings):
- Plugin name: `suprapowers`
- Renamed skill: `lamestorm` (was `brainstorming`)
- Source tree: `C:/Users/micro/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0`
- Repo root: `C:/Users/micro/Documents/dev/suprapowers`

---

## Task 1: Fork the superpowers tree into the repo

**Files:**
- Create: everything under repo root (copied from source), except `.in_use`

- [ ] **Step 1: Copy the source tree into the repo root**

The repo currently contains only `.git/` and `docs/superpowers/specs|plans`. Copy the full plugin in alongside them. `cp -rn`-style merge is safe because our `docs/superpowers/specs` and `docs/superpowers/plans` filenames do not exist in the source.

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
SRC="C:/Users/micro/.claude/plugins/cache/claude-plugins-official/superpowers/5.1.0"
cp -r "$SRC"/. .
rm -rf .in_use
ls -a
```
Expected: repo root now shows `skills/`, `hooks/`, `scripts/`, `.claude-plugin/`, `README.md`, etc., alongside the existing `docs/` and `.git/`.

- [ ] **Step 2: Confirm the spec and plan survived the copy**

Run:
```bash
ls docs/superpowers/specs docs/superpowers/plans
```
Expected: `2026-06-05-suprapowers-teaching-fork-design.md` and `2026-06-05-suprapowers-teaching-fork.md` are both still present.

- [ ] **Step 3: Confirm the skills that must exist (pre-rename) are present**

Run:
```bash
ls skills
```
Expected: includes `brainstorming`, `executing-plans`, `test-driven-development`, `subagent-driven-development`, `using-superpowers`, `writing-plans`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Fork superpowers 5.1.0 tree into suprapowers repo"
```

---

## Task 2: Write the validator (the test harness)

This Node script is the failing test. It encodes every structural requirement. Right now most assertions FAIL — that is correct (red). Later tasks turn them green.

**Files:**
- Create: `scripts/validate.mjs`

- [ ] **Step 1: Write the validator**

Create `scripts/validate.mjs`:
```javascript
#!/usr/bin/env node
// Structural validator for the suprapowers fork. Exits non-zero on any failure.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : ' — ' + detail}`);
  if (!ok) failures++;
};
const read = (p) => existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), 'utf8') : null;

// Recursively collect all SKILL.md files under skills/
function skillFiles(dir = join(ROOT, 'skills'), out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) skillFiles(full, out);
    else if (entry === 'SKILL.md') out.push(full);
  }
  return out;
}

// 1. plugin.json identity
const pluginJson = read('.claude-plugin/plugin.json');
check('plugin.json parses', (() => { try { JSON.parse(pluginJson); return true; } catch { return false; } })());
check('plugin name is suprapowers', !!pluginJson && JSON.parse(pluginJson).name === 'suprapowers');

// 2. marketplace.json identity
const market = read('.claude-plugin/marketplace.json');
check('marketplace.json parses', (() => { try { JSON.parse(market); return true; } catch { return false; } })());
check('marketplace lists a suprapowers plugin',
  !!market && (JSON.parse(market).plugins || []).some(p => p.name === 'suprapowers'));

// 3. lamestorm rename
check('skills/lamestorm/SKILL.md exists', existsSync(join(ROOT, 'skills/lamestorm/SKILL.md')));
const lame = read('skills/lamestorm/SKILL.md');
check('lamestorm frontmatter name is lamestorm', !!lame && /^name:\s*lamestorm\s*$/m.test(lame));
check('skills/brainstorming removed', !existsSync(join(ROOT, 'skills/brainstorming')));

// 4. subagent skill removed
check('subagent-driven-development removed', !existsSync(join(ROOT, 'skills/subagent-driven-development')));

// 5. no stale superpowers: invocation prefix anywhere in skills
const stale = skillFiles().filter(f => /superpowers:/.test(readFileSync(f, 'utf8')));
check('no "superpowers:" invocation prefix remains in skills', stale.length === 0,
  stale.map(f => f.replace(ROOT, '')).join(', '));

// 6. teaching executing-plans markers
const exec = read('skills/executing-plans/SKILL.md');
check('executing-plans describes the handover dial', !!exec && /handover dial/i.test(exec));
check('executing-plans enforces the keyboard hard-stop',
  !!exec && /hard[- ]stop/i.test(exec) && /(do(es)? not write|never write)/i.test(exec));
check('executing-plans describes tiered coaching', !!exec && /tiered/i.test(exec));
check('executing-plans reads via git diff', !!exec && /git diff/i.test(exec));

// 7. teaching TDD markers
const tdd = read('skills/test-driven-development/SKILL.md');
check('TDD: system writes the failing test', !!tdd && /write[s]? (and explain[s]? )?the (failing|red) test/i.test(tdd));
check('TDD: learner writes the implementation', !!tdd && /(human|they) write[s]? the implementation/i.test(tdd));
check('TDD: learner runs the tests', !!tdd && /(human runs the test|they run (it|the test))/i.test(tdd));

// 8. writing-plans header no longer recommends the subagent executor
const wp = read('skills/writing-plans/SKILL.md');
check('writing-plans header drops subagent-driven recommendation',
  !!wp && !/subagent-driven-development \(recommended\)/.test(wp));

console.log(`\n${failures === 0 ? 'ALL CHECKS PASS' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 2: Run the validator and confirm it FAILS (red)**

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
node scripts/validate.mjs
```
Expected: exits non-zero. `plugin name is suprapowers` FAILS (still `superpowers`), `skills/lamestorm/SKILL.md exists` FAILS, `subagent-driven-development removed` FAILS, the teaching-marker checks FAIL, etc. This proves the harness actually tests something.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate.mjs
git commit -m "Add structural validator (test harness) for suprapowers fork"
```

---

## Task 3: Rebrand plugin metadata

**Files:**
- Modify: `.claude-plugin/plugin.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Rewrite plugin.json**

Replace the entire contents of `.claude-plugin/plugin.json` with:
```json
{
  "name": "suprapowers",
  "description": "Teaching fork of superpowers: coaches you to write the code yourself at the implementation phase instead of doing it for you.",
  "version": "0.1.0",
  "author": {
    "name": "Erik Hoggard",
    "email": "erikhoggard@gmail.com"
  },
  "license": "MIT",
  "keywords": [
    "skills",
    "teaching",
    "coaching",
    "tdd",
    "learning"
  ]
}
```

- [ ] **Step 2: Rewrite marketplace.json**

Replace the entire contents of `.claude-plugin/marketplace.json` with:
```json
{
  "name": "suprapowers-dev",
  "description": "Local marketplace for the suprapowers teaching skills library",
  "owner": {
    "name": "Erik Hoggard",
    "email": "erikhoggard@gmail.com"
  },
  "plugins": [
    {
      "name": "suprapowers",
      "description": "Teaching fork of superpowers: coaches you to write the code yourself.",
      "version": "0.1.0",
      "source": "./",
      "author": {
        "name": "Erik Hoggard",
        "email": "erikhoggard@gmail.com"
      }
    }
  ]
}
```

- [ ] **Step 3: Run the validator — the two metadata checks go green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `plugin name is suprapowers` PASS, `marketplace lists a suprapowers plugin` PASS. (Other checks still fail.)

- [ ] **Step 4: Commit**

```bash
git add .claude-plugin/plugin.json .claude-plugin/marketplace.json
git commit -m "Rebrand plugin metadata to suprapowers"
```

---

## Task 4: Rename the brainstorming skill to lamestorm

**Files:**
- Rename: `skills/brainstorming/` → `skills/lamestorm/`
- Modify: `skills/lamestorm/SKILL.md` (frontmatter `name`)
- Modify: `skills/using-superpowers/SKILL.md` (cross-references)
- Modify: `skills/writing-plans/SKILL.md` (prose reference)

- [ ] **Step 1: Rename the directory**

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
git mv skills/brainstorming skills/lamestorm
```
Expected: `skills/lamestorm/SKILL.md` now exists; `skills/brainstorming` is gone.

- [ ] **Step 2: Update the skill's frontmatter name**

In `skills/lamestorm/SKILL.md`, change the frontmatter line:
```
name: brainstorming
```
to:
```
name: lamestorm
```
(Leave the `description` and body content unchanged — the process is inherited as-is.)

- [ ] **Step 3: Update cross-references in using-superpowers**

In `skills/using-superpowers/SKILL.md`, update the three references to the renamed skill:
- Line in the dot graph: `"Invoke brainstorming skill" [shape=box];` → `"Invoke lamestorm skill" [shape=box];`
- Both graph edges referencing `"Invoke brainstorming skill"` → `"Invoke lamestorm skill"` (the `->` lines).
- Skill Priority prose: `1. **Process skills first** (brainstorming, debugging)` → `(lamestorm, debugging)` and `"Let's build X" → brainstorming first, then implementation skills.` → `"Let's build X" → lamestorm first, then implementation skills.`

- [ ] **Step 4: Update the prose reference in writing-plans**

In `skills/writing-plans/SKILL.md`, change `it should have been broken into sub-project specs during brainstorming.` → `...during lamestorm.`

- [ ] **Step 5: Run the validator — the lamestorm checks go green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `skills/lamestorm/SKILL.md exists` PASS, `lamestorm frontmatter name is lamestorm` PASS, `skills/brainstorming removed` PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Rename brainstorming skill to lamestorm"
```

---

## Task 5: Remove the subagent-driven-development skill

**Files:**
- Delete: `skills/subagent-driven-development/`

- [ ] **Step 1: Delete the skill directory**

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
git rm -r skills/subagent-driven-development
```
Expected: directory removed and staged.

- [ ] **Step 2: Run the validator — the removal check goes green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `subagent-driven-development removed` PASS.

- [ ] **Step 3: Commit**

```bash
git commit -m "Remove subagent-driven-development (out of teaching PoC scope)"
```

---

## Task 6: Rebrand internal `superpowers:` invocation prefixes to `suprapowers:`

This is the bulk rename that makes the standalone plugin route to its own skills. It is scoped to the `superpowers:` token (with colon) so it never touches the `using-superpowers` directory name or the prose word "superpowers".

**Files:**
- Modify: all `skills/**/SKILL.md` and any other markdown under `skills/` containing `superpowers:`
- Modify: `hooks/session-start` (injected branding + reference)

- [ ] **Step 1: Bulk-replace the invocation prefix across skills**

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
grep -rl "superpowers:" skills | while read -r f; do
  sed -i 's/superpowers:/suprapowers:/g' "$f"
done
```
Expected: no error. (This rewrites references like `superpowers:finishing-a-development-branch` → `suprapowers:finishing-a-development-branch` everywhere in `skills/`.)

- [ ] **Step 2: Update the session-start hook's reference and branding**

In `hooks/session-start`, update the injected context string (the `session_context=` line):
- `superpowers:using-superpowers` → `suprapowers:using-superpowers`
- `You have superpowers.` → `You have suprapowers.`

Leave the `skills/using-superpowers/SKILL.md` path in the hook unchanged (the directory keeps its name).

- [ ] **Step 3: Run the validator — the stale-prefix check goes green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `no "superpowers:" invocation prefix remains in skills` PASS. (`executing-plans`/`TDD` teaching checks and the `writing-plans` header check still fail — addressed next.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Rebrand internal skill-invocation prefixes to suprapowers:"
```

---

## Task 7: Point the plan-header template at the teaching executor

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

- [ ] **Step 1: Edit the Plan Document Header template**

In `skills/writing-plans/SKILL.md`, find the header template block (the `> **For agentic workers:**` line, now reading `suprapowers:` after Task 6) and replace its first line so it recommends only the teaching executor:

Replace:
```
> **For agentic workers:** REQUIRED SUB-SKILL: Use suprapowers:subagent-driven-development (recommended) or suprapowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
```
with:
```
> **For agentic workers:** REQUIRED SUB-SKILL: Use suprapowers:executing-plans to coach the human through implementing this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
```

- [ ] **Step 2: Update the Execution Handoff section**

In the same file, the "Execution Handoff" section offers a "Subagent-Driven (recommended)" option. Replace that section's two-option offer with a single teaching option. Replace the block beginning `**"Plan complete and saved...` through the `**Which approach?"**`/`If Subagent-Driven chosen` material with:
```
**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Ready to start the teaching session?"**

When the user is ready:
- **REQUIRED SUB-SKILL:** Use suprapowers:executing-plans
- It will coach you through the plan task-by-task: explaining the why, handing you the coding, and reviewing what you write.
```
(Remove the now-defunct references to subagent-driven-development and inline batch execution choice.)

- [ ] **Step 3: Run the validator — the header check goes green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `writing-plans header drops subagent-driven recommendation` PASS.

- [ ] **Step 4: Commit**

```bash
git add skills/writing-plans/SKILL.md
git commit -m "Route generated plans to the teaching executor"
```

---

## Task 8: Rewrite executing-plans into the teaching loop

**Files:**
- Replace: `skills/executing-plans/SKILL.md`

- [ ] **Step 1: Replace the skill with the teaching version**

Replace the **entire** contents of `skills/executing-plans/SKILL.md` with:

````markdown
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
````

- [ ] **Step 2: Run the validator — the executing-plans checks go green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `executing-plans describes the handover dial` PASS, `executing-plans enforces the keyboard hard-stop` PASS, `executing-plans describes tiered coaching` PASS, `executing-plans reads via git diff` PASS.

- [ ] **Step 3: Commit**

```bash
git add skills/executing-plans/SKILL.md
git commit -m "Rewrite executing-plans into the teaching loop"
```

---

## Task 9: Rewrite test-driven-development into test-as-exercise

**Files:**
- Replace: `skills/test-driven-development/SKILL.md`

- [ ] **Step 1: Replace the skill with the teaching version**

Replace the **entire** contents of `skills/test-driven-development/SKILL.md` with:

````markdown
---
name: test-driven-development
description: Use when coaching a human to implement a feature or bugfix test-first — you write and explain the failing test, they write the implementation to make it pass
---

# Test-Driven Development (Teaching Mode)

## Overview

The failing test is the assignment. You write and explain it; the human writes the code
that makes it pass. "Green" is the unambiguous done signal for their exercise.

**Core principle:** If they didn't watch the test fail, they don't know it tests the
right thing — and if they didn't write the implementation, their skills didn't grow.

## The split

- **You write and explain the failing (red) test.** Writing a good test requires
  understanding the spec, not the implementation, so doing it doesn't rob them of coding
  practice — and it models what a good test looks like and *why* (what it asserts, what
  edge it pins down).
- **You write the implementation? No.** *The human writes the implementation* that makes
  the test pass. That is the handover.
- **The human runs the tests.** You give them the command; they run it and report
  results. Running tests is a skill too, and it keeps them in the loop.

```
NO PRODUCTION CODE FROM YOU. You write the failing test and explain it.
The human writes the code to make it pass.
```

## The loop, per behavior

### RED — you write & explain the failing test
Write one minimal test for one behavior, clear name, real code (mocks only if
unavoidable). Then explain: what it asserts, why this behavior, what edge it pins down,
and what a green bar will prove.

<Good>
```typescript
test('retries failed operations 3 times', async () => {
  let attempts = 0;
  const operation = () => { attempts++; if (attempts < 3) throw new Error('fail'); return 'success'; };
  const result = await retryOperation(operation);
  expect(result).toBe('success');
  expect(attempts).toBe(3);
});
```
Clear name, real behavior, one thing.
</Good>

### Verify RED — the human runs it and watches it fail
Give them the command (e.g. `npm test path/to/test.test.ts`). They run it. Confirm
together: it fails (not errors), and it fails because the feature is missing — not a typo.
This teaches them *why* test-first proves the test works.

### GREEN — the human writes minimal code
Hand over the implementation. **Hard-stop. You do not write it.** They write the simplest
code that passes. While they work, you wait.

### Verify GREEN + review (read-only)
They run the test and report green. Then you review what they wrote via `git diff` —
read-only, point at `file:line`, coach with tiered escalation (hint → leading question →
explanation → only-on-request the code). Firm on correctness/footguns; light-touch on
style ("works — there's a more idiomatic way, want it?").

### REFACTOR — coach, don't grab
If cleanup helps, coach them through it (extract a helper, improve a name) while staying
green. They make the edits.

## When they're stuck

| Problem | Coaching move |
|---------|---------------|
| Don't know how to start | Point them at the assertion. "What's the smallest thing that makes line N pass?" |
| Test feels impossible to satisfy | Maybe the design is hard to use. Discuss the interface. |
| Stuck past several hints | Escalate a tier. Only show the code if they ask. |

## Remember
- You write & explain the red test. They write the implementation. They run the tests.
- Hard-stop at the GREEN handover. Read-only during their turn.
- Watching it fail is mandatory — it's how they learn the test is real.
- Tiered coaching; firm on what matters, light-touch on style.
````

- [ ] **Step 2: Run the validator — the TDD checks go green**

Run:
```bash
node scripts/validate.mjs
```
Expected: `TDD: system writes the failing test` PASS, `TDD: learner writes the implementation` PASS, `TDD: learner runs the tests` PASS.

- [ ] **Step 3: Commit**

```bash
git add skills/test-driven-development/SKILL.md
git commit -m "Rewrite test-driven-development into test-as-exercise"
```

---

## Task 10: Full validation, branding polish, and live smoke test

**Files:**
- Modify: `README.md` (cosmetic rebrand)

- [ ] **Step 1: Run the full validator — expect ALL GREEN**

Run:
```bash
cd "C:/Users/micro/Documents/dev/suprapowers"
node scripts/validate.mjs
```
Expected: every line `PASS`, final line `ALL CHECKS PASS`, exit code 0.

- [ ] **Step 2: Cosmetic README rebrand**

In `README.md`, replace the top title/intro lines that say "Superpowers" with a short
suprapowers description:
```markdown
# suprapowers

A teaching fork of [superpowers](https://github.com/obra/superpowers). Same idea → spec →
plan front-end, but the implementation phase **coaches you to write the code yourself**:
it explains the *why*, teaches the language features, hands you the coding, and reviews
what you write with tiered hints. Run it instead of superpowers.
```
(Leave the rest of the README; this is cosmetic.)

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Rebrand README for suprapowers"
```

- [ ] **Step 4: Live smoke test (manual — run these in Claude Code)**

These are interactive Claude Code slash commands, not bash. Disable superpowers first to
avoid skill-name collisions, then register and install this plugin:

```
/plugin marketplace add C:/Users/micro/Documents/dev/suprapowers
/plugin install suprapowers@suprapowers-dev
```
Then start a fresh session and confirm:
- The SessionStart banner says "You have suprapowers."
- `/suprapowers:lamestorm` starts the brainstorming flow.
- Invoking the executor announces "I'm using the executing-plans skill to **coach you**…"
  and asks the handover-dial question instead of writing code.

Expected: all three behaviors observed. If a skill-name collision appears, confirm
superpowers is disabled.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "suprapowers teaching fork PoC complete" --allow-empty
```

---

## Self-Review Notes

- **Spec coverage:** Fork (Task 1) · inherit front-end (Tasks 1, 6) · lamestorm rename
  (Task 4) · rewrite executing-plans → teaching loop + handover dial + tiered coaching +
  read-only git-diff review (Task 8) · rewrite TDD → test-as-exercise, learner runs tests
  (Task 9) · subagent skill out of scope (Task 5) · run-instead-of-superpowers packaging
  (Tasks 3, 10) · guardrails hard-stop/read-only/err-toward-less (Tasks 8, 9). All spec
  sections map to tasks.
- **Non-goals honored:** no codebase-comprehension mode, no subagent skill, no
  multi-language tuning beyond coaching adaptation, no product polish beyond a cosmetic
  README line.
- **Type/string consistency:** validator assertions match the exact phrases written into
  the rewritten skills (`handover dial`, `hard-stop`, `does not write`, `tiered`,
  `git diff`, `you write the implementation`, `you run the test`).
````
