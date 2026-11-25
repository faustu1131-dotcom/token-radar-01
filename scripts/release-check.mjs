// release-check.mjs — automated post-build release check for the token-radar-01 entry (v6).
// Verifies the GENERATED out/ (not the repo source): the dossier text cap, the dossier file cap,
// the I-07 plan-text presence in the dossier, the board shape, and determinism (two runs).
// Usage: node scripts/release-check.mjs [--input <snapshot.json|dir>] [--out <dir>]
// Exits non-zero on any failure. Reads only; it runs main.ts twice into temp dirs for determinism.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const arg = (name, fb) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fb;
};
const input = arg('input', join(here, '..', 'token-radar-01-kit', 'input', 'snapshot.json'));
const out = arg('out', join(here, 'out'));

let failures = 0;
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

// --- the build output exists ---
check('out/ exists', existsSync(out));
const dossierPath = join(out, 'dossier.json');
const boardPath = join(out, 'board.json');
const dataPath = join(out, 'data.js');
check('dossier.json exists', existsSync(dossierPath));
check('board.json exists', existsSync(boardPath));
check('data.js exists', existsSync(dataPath));
if (!existsSync(dossierPath) || !existsSync(boardPath)) { console.log(`${failures} failure(s)`); process.exit(1); }

const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
const dossierBytes = Buffer.byteLength(readFileSync(dossierPath));
const textBytes = Buffer.byteLength(dossier.text, 'utf8');

// --- caps ---
check('dossier text <= 65,536 B', textBytes <= 65536, `${textBytes} B`);
check('dossier file <= 1.5 MiB', dossierBytes <= 1572864, `${dossierBytes} B`);
check('dossier has 3-4 images', dossier.images.length >= 3 && dossier.images.length <= 4, `${dossier.images.length}`);
for (const img of dossier.images) {
  const bytes = Math.floor((img.base64 || '').length * 3 / 4);
  check(`image ${img.name} <= 512 KiB`, bytes <= 524288, `${bytes} B`);
}

// --- I-07: the 40 hand-written plan texts are in the GENERATED dossier text ---
const board = JSON.parse(readFileSync(boardPath, 'utf8'));
const rows = board.rows;
const top40 = rows.filter((r) => r.rank <= 40);
let plansFound = 0;
const missing = [];
for (const r of top40) {
  // each plan's first step action text must appear in the dossier text
  const first = (r.farm_steps[0] || '').split(' Cost: ')[0];
  if (first && dossier.text.includes(first)) plansFound++;
  else missing.push(r.slug);
}
check('all 40 top-40 plan first-steps in dossier text', plansFound === 40, `${plansFound}/40${missing.length ? ` missing: ${missing.join(', ')}` : ''}`);
// mechanism table + coverage panel in the dossier text
check('MECH table in dossier text', dossier.text.includes('MECH_T'));
check('mechanism coverage panel in dossier text', dossier.text.includes('Mechanism coverage'));
check('FARM sentence (R2 reason) in dossier text', dossier.text.includes('all carry R2 risk'));
// --- fact counts: computed from the fact files (never hardcoded, so they cannot go stale) ---
const factsTop = JSON.parse(readFileSync(join(here, '..', 'token-radar-01', 'protocol-facts.json'), 'utf8'));
const factsRest = JSON.parse(readFileSync(join(here, '..', 'token-radar-01', 'protocol-facts-41-198.json'), 'utf8'));
function verifiedCount(f) {
  let tot = 0, ver = 0, weak = 0;
  for (const p of f.protocols) {
    for (const v of Object.values(p)) {
      if (v && typeof v === 'object' && 'status' in v) {
        tot++;
        if (v.status === 'VERIFIED') { ver++; if (String(v.value || '').includes('WEAK')) weak++; }
      }
    }
  }
  return { tot, ver, weak };
}
const cTop = verifiedCount(factsTop);
const cRest = verifiedCount(factsRest);
check('fact counts in dossier text (from files)', dossier.text.includes(`${cTop.ver}/${cTop.tot}`) && dossier.text.includes(`${cRest.ver.toLocaleString('en-US')}/${cRest.tot.toLocaleString('en-US')}`), `top ${cTop.ver}/${cTop.tot} (weak ${cTop.weak}), rest ${cRest.ver}/${cRest.tot} (weak ${cRest.weak})`);
// [WEAK] handling is verified by the facts-sync patch (weak_not_applied list) and the
// self-audit, not here: the tables must keep "unknown" for weak facts, which this
// text check cannot see. See v6/facts-sync-patch-1550.json.

// --- board shape ---
check('board has 198 rows', rows.length === 198, `${rows.length}`);
check('ranks 1..198', rows.every((r, i) => r.rank === i + 1));
check('implied values non-increasing', rows.every((r, i) => i === 0 || r.implied_value_usd <= rows[i - 1].implied_value_usd));
const verdicts = {};
for (const r of rows) verdicts[r.verdict] = (verdicts[r.verdict] || 0) + 1;
check('no FARM verdicts (honest)', (verdicts.FARM || 0) === 0, JSON.stringify(verdicts));
check('farm_steps 3-12, 20-600 chars each', rows.every((r) => r.farm_steps.length >= 3 && r.farm_steps.length <= 12 && r.farm_steps.every((s) => s.length >= 20 && s.length <= 600)));
// watchlist coverage: read the snapshot watchlist
const snap = JSON.parse(readFileSync(input.endsWith('.json') ? input : join(input, 'snapshot.json'), 'utf8'));
const boardSlugs = new Set(rows.map((r) => r.slug));
const missingWatch = snap.watchlist.filter((s) => !boardSlugs.has(s));
check('watchlist 40/40 on board', missingWatch.length === 0, missingWatch.length ? `missing: ${missingWatch.join(', ')}` : '');

// --- determinism: two fresh runs, byte-identical ---
const d1 = mkdtempSync(join(tmpdir(), 'radar-a-'));
const d2 = mkdtempSync(join(tmpdir(), 'radar-b-'));
try {
  for (const d of [d1, d2]) {
    execFileSync('node', ['main.ts', '--input', input], { cwd: here, env: { ...process.env, MAKEFUN_OUTPUT_DIR: d }, stdio: 'pipe' });
  }
  const names = ['board.json', 'data.js', 'dossier.json'];
  let same = true;
  for (const n of names) {
    const a = readFileSync(join(d1, n));
    const b = readFileSync(join(d2, n));
    if (!a.equals(b)) { same = false; console.log(`  differ: ${n}`); }
  }
  check('two runs byte-identical (board/data/dossier)', same);
} finally {
  rmSync(d1, { recursive: true, force: true });
  rmSync(d2, { recursive: true, force: true });
}

console.log(failures === 0 ? 'release-check: ALL PASS' : `release-check: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
