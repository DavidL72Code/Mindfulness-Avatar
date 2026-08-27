#!/usr/bin/env node
/**
 * Measure how long the guide avatar takes to become usable.
 *
 *   node scripts/eval_performance.js                 # 3 runs of each scenario
 *   node scripts/eval_performance.js --runs 5
 *   node scripts/eval_performance.js --url http://localhost:8010
 *
 * Loads avatar.html directly, so it needs no sign-in. Two scenarios:
 *   cold  — cache cleared: what a first-time visitor pays
 *   warm  — model cached: what a rebuild after release costs
 * Fails (exit 1) if any median breaks the budget in evals/perf_budgets.json.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
const RUNS = Number(opt('runs', 3));
const BASE = opt('url', 'http://localhost:8010');
const PORT = Number(opt('port', 9333));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdp(port) {
  // Chrome can take several seconds to bind the debugging port on macOS.
  let list = null;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const j = await r.json();
      if (Array.isArray(j) && j.some((t) => t.type === 'page')) { list = j; break; }
    } catch {}
    await sleep(400);
  }
  if (!list) throw new Error(`Chrome never exposed a debug target on port ${port}`);
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pending = new Map();
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Page.addScriptToEvaluateOnNewDocument', { source: RECORDER });
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r?.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r?.result?.value;
  };
  return { send, evaluate, close: () => ws.close() };
}

// Installed before any page script runs, so it can timestamp the exact moment
// the loading veil lifts — measured from navigation start rather than from
// whenever the harness happens to attach.
const RECORDER = `(() => {
  const mark = () => {
    const lov = document.getElementById('lov');
    if (!lov) return false;
    if (lov.classList.contains('hidden')) { window.__readyAt = performance.now(); return true; }
    return false;
  };
  const watch = () => {
    if (mark()) return;
    const obs = new MutationObserver(() => { if (mark()) obs.disconnect(); });
    obs.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['class'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch);
  else watch();
})()`;

// Polled by the harness once the page is live.
const PROBE = `(async () => {
  for (let i = 0; i < 1200; i++) {
    if (typeof window.__readyAt === 'number') break;
    const sub = (document.getElementById('lsub') || {}).textContent || '';
    if (/error/i.test(sub)) return { error: sub.slice(0, 200) };
    await new Promise(r => setTimeout(r, 50));
  }
  if (typeof window.__readyAt !== 'number') return { error: 'never became ready' };
  const res = performance.getEntriesByType('resource');
  const pick = (re) => res.filter(r => re.test(r.name))
    .map(r => ({ kb: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024), ms: Math.round(r.duration) }))[0] || { kb: 0, ms: 0 };
  return {
    build_ms: Math.round(window.__readyAt),
    glb: pick(/guide\\.glb/),
    doc_kb: Math.round((performance.getEntriesByType('navigation')[0] || {}).transferSize / 1024) || 0,
  };
})()`;

async function runOnce({ cold }) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'respire-perf-'));
  const chrome = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu-vsync', 'about:blank',
  ], { stdio: 'ignore' });
  try {
    const c = await cdp(PORT);
    const url = `${BASE}/avatar.html?host=home-dock&compact=1&controlled=1&locale=en`;
    if (cold) {
      await c.send('Network.clearBrowserCache');
    } else {
      // prime the cache, then reload so the model comes from disk
      await c.send('Page.navigate', { url });
      await c.evaluate(PROBE).catch(() => {});
      await sleep(500);
    }
    // Stamp the current document, then wait for a context where the stamp is
    // gone but the app's DOM exists. location.href alone is not enough: it
    // updates at commit while the old document is briefly still live, which
    // makes the probe measure the previous, already-built page.
    await c.send('Page.navigate', { url: `${url}&t=${Date.now()}` });
    const out = await c.evaluate(PROBE);
    c.close();
    return out;
  } finally {
    chrome.kill();
    await sleep(400);                     // let Chrome release its profile dir
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  }
}

const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

(async () => {
  if (!fs.existsSync(CHROME)) { console.error('Google Chrome not found at', CHROME); process.exit(2); }
  const budgets = JSON.parse(fs.readFileSync(path.join(ROOT, 'evals', 'perf_budgets.json'))).budgets;
  const results = {};

  for (const scenario of ['cold', 'warm']) {
    const builds = [], glbKb = [], docKb = [];
    for (let i = 0; i < RUNS; i++) {
      const r = await runOnce({ cold: scenario === 'cold' });
      if (r.error) { console.error(`  ${scenario} run ${i + 1}: ${r.error}`); continue; }
      builds.push(r.build_ms); glbKb.push(r.glb.kb); docKb.push(r.doc_kb);
      console.log(`  ${scenario} run ${i + 1}: ${r.build_ms}ms  glb ${r.glb.kb}KB (${r.glb.ms}ms)  doc ${r.doc_kb}KB`);
    }
    if (!builds.length) { console.error(`${scenario}: every run failed`); process.exit(1); }
    results[scenario] = { runs: builds.length, build_ms: median(builds), glb_kb: median(glbKb), doc_kb: median(docKb) };
  }

  const checks = [
    ['cold_build_ms', results.cold.build_ms],
    ['warm_build_ms', results.warm.build_ms],
    ['glb_kb', results.cold.glb_kb],
    ['avatar_html_kb', results.cold.doc_kb],
  ];
  console.log('\n' + JSON.stringify(results, null, 1));
  let failed = false;
  console.log('\nbudget check');
  for (const [key, value] of checks) {
    const b = budgets[key];
    if (!b) continue;
    const ok = value <= b.budget;
    if (!ok) failed = true;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${key.padEnd(16)} ${String(value).padStart(6)}  budget ${b.budget}`);
  }
  fs.writeFileSync(path.join(ROOT, 'evals', 'last_perf_run.json'), JSON.stringify({ results, budgets }, null, 2));
  console.log(`\nsaved -> evals/last_perf_run.json`);
  process.exit(failed ? 1 : 0);
})();
