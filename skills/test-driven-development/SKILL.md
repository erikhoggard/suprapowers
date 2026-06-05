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
