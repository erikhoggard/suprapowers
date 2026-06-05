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
check('marketplace top-level name is suprapowers-dev', !!market && JSON.parse(market).name === 'suprapowers-dev');
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
