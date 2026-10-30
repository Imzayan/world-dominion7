/* PERF BASELINE SUMMARIZER — merges perf-results/<tag>-run*.json into a
 * comparison table (median across runs) for PERF_BASELINE.md.
 * usage: node scripts/perf-summarize.mjs [tag1 tag2 ...]
 */
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve('scripts/perf-results');
const tags = process.argv.slice(2).length ? process.argv.slice(2)
  : [...new Set(fs.readdirSync(DIR).filter((f) => /-run\d+\.json$/.test(f)).map((f) => f.replace(/-run\d+\.json$/, '')))];

const med = (a) => { if (!a || !a.length) return null; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const r1 = (v) => (v == null ? '—' : (Math.round(v * 10) / 10 + ''));

function load(tag) {
  const runs = fs.readdirSync(DIR).filter((f) => f.startsWith(tag + '-run') && f.endsWith('.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')));
  return runs;
}
function cell(runs, pick) { return r1(med(runs.map(pick).filter((v) => v != null && !(v < 0)))); }

const rows = [];
for (const tag of tags) {
  const runs = load(tag);
  if (!runs.length) continue;
  const lt = (ph) => runs.map((r) => r[ph] && r[ph].lt).filter(Boolean);
  const g1 = cell(runs, (r) => r.g1_flicks && r.g1_flicks.p50) + '/' + cell(runs, (r) => r.g1_flicks && r.g1_flicks.p95) + '/' + cell(runs, (r) => r.g1_flicks && r.g1_flicks.max);
  const g2 = cell(runs, (r) => r.g2_pinch && r.g2_pinch.p50) + '/' + cell(runs, (r) => r.g2_pinch && r.g2_pinch.p95) + '/' + cell(runs, (r) => r.g2_pinch && r.g2_pinch.max);
  const g3 = cell(runs, (r) => r.g3_browse && r.g3_browse.p50) + '/' + cell(runs, (r) => r.g3_browse && r.g3_browse.p95) + '/' + cell(runs, (r) => r.g3_browse && r.g3_browse.max);
  const ltSum = (ph) => { const l = lt(ph); const n = med(l.map((x) => x.n)); const t = med(l.map((x) => x.total)); return (n == null ? '—' : n) + ' (' + (t == null ? '—' : t) + 'ms)'; };
  const cop = cell(runs, (r) => { const o = (r.countryOpens || []).filter((c) => c.opened); return o.length ? o.reduce((a, b) => a + b.ms, 0) / o.length : null; });
  rows.push({
    tag,
    runs: runs.length,
    cpu: runs[0].cpu,
    net: runs[0].net,
    mode: runs[0].mode,
    oth: cell(runs, (r) => r.world && r.world.oth),
    boot: cell(runs, (r) => r.boot && r.boot.mapReadyMs),
    idleFps: cell(runs, (r) => r.idle5s && r.idle5s.fps),
    idleLt: ltSum('idle5s'),
    g1, g2, g3,
    g1Lt: ltSum('g1_flicks'),
    cop,
    heap: cell(runs, (r) => r.heap && r.heap.startMB) + '→' + cell(runs, (r) => r.heap && r.heap.endMB),
    /* main-thread decomposition of the g1 window (CDP Performance.getMetrics deltas, ms) */
    scriptMs: cell(runs, (r) => r.g1_flicks && r.g1_flicks.metrics && r.g1_flicks.metrics.ScriptDuration),
    styleMs: cell(runs, (r) => r.g1_flicks && r.g1_flicks.metrics && r.g1_flicks.metrics.RecalcStyleDuration),
    layoutMs: cell(runs, (r) => r.g1_flicks && r.g1_flicks.metrics && r.g1_flicks.metrics.LayoutDuration),
    taskMs: cell(runs, (r) => r.g1_flicks && r.g1_flicks.metrics && r.g1_flicks.metrics.TaskDuration),
    g2Lt: ltSum('g2_pinch'),
    rpcN: cell(runs, (r) => r.net_audit && r.net_audit.sum.rpc.n),
    kb: cell(runs, (r) => r.net_audit && r.net_audit.sum.all.bytes / 1024),
    errs: cell(runs, (r) => r.pageerrors && r.pageerrors.length),
  });
}

console.log('| tag | runs | cpu | net | OTH | bootMs | idle FPS | idle LT | g1 p50/p95/max | g1 LT | g2 LT | g3 p50/p95/max | country open ms | heap MB | script ms | style ms | layout ms | task ms | rpc# | KB | errors |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) {
  console.log(`| ${r.tag} | ${r.runs} | ${r.cpu}x | ${r.net} | ${r.oth} | ${r.boot} | ${r.idleFps} | ${r.idleLt} | ${r.g1} | ${r.g1Lt} | ${r.g2Lt} | ${r.g3} | ${r.cop} | ${r.heap} | ${r.scriptMs} | ${r.styleMs} | ${r.layoutMs} | ${r.taskMs} | ${r.rpcN} | ${r.kb} | ${r.errs} |`);
}
