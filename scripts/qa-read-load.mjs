import fs from 'node:fs';
import assert from 'node:assert/strict';
const routes = ['/api/health','/api/species','/api/pathologies'];
const rows = []; let next = 0;
await Promise.all(Array.from({ length: 20 }, async () => {
  while (next < 100) {
    const index = next++, route = routes[index % routes.length], started = performance.now();
    try {
      const response = await fetch('http://localhost:4000' + route, { signal: AbortSignal.timeout(15000) });
      await response.arrayBuffer(); rows.push({ route, status: response.status, ms: Math.round(performance.now()-started) });
    } catch { rows.push({ route, status: 0, ms: Math.round(performance.now()-started) }); }
  }
}));
const times = rows.map(r=>r.ms).sort((a,b)=>a-b);
const report = { at: new Date().toISOString(), environment: 'local workstation; read-only HTTP', requests:100, concurrency:20, failures: rows.filter(r=>r.status!==200).length, p50:times[49], p95:times[94], max:times.at(-1), rows };
fs.writeFileSync('docs/audits/read-load-qa.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({requests:report.requests,concurrency:report.concurrency,failures:report.failures,p95ms:report.p95,maxMs:report.max}));
assert.equal(report.failures,0);
