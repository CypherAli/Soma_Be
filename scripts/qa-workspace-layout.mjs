import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reportFile = path.join(workspace, 'soma_be/docs/audits/workspace-layout.json');
const moves = [
  ['medical_kb', 'soma_be/resources/medical_kb'],
  ['research', 'Soma_Fe/docs/research'],
  ['.thumbnails-cu', 'Soma_Fe/docs/reference-assets/thumbnails'],
  ...[
    '15cd9501-37f8-4739-8dd9-a616d6197a39.jpg',
    '91c6229d-ed6e-40f7-9472-9f6fedce4ea4.jpg',
    'e5546594-ccc2-4838-9f29-79742249802b.jpg',
    'Gemini_Generated_Image_re34elre34elre34.png',
    'video_contact.jpg', 'video_detail.png',
  ].map(name => [name, `Soma_Fe/docs/reference-assets/${name}`]),
];

function fingerprint(target, base = target) {
  const entries = [];
  if (fs.statSync(target).isDirectory()) {
    for (const item of fs.readdirSync(target).sort()) entries.push(...fingerprint(path.join(target, item), base));
  } else {
    const relative = path.relative(base, target).replaceAll('\\', '/');
    // These source files are deliberately edited to use the new paths.
    if ((base.endsWith('medical_kb') && (relative.startsWith('scripts/') || relative === 'README.md')) || relative === 'wondersnap/audit.mjs') return entries;
    entries.push({ file: relative || path.basename(target), sha256: crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex') });
  }
  return entries;
}

if (process.argv[2] === '--capture') {
  assert(!fs.existsSync(reportFile), 'Do not overwrite the original migration snapshot');
  const records = moves.map(([from, to]) => ({ from, to, files: fingerprint(path.join(workspace, from)) }));
  fs.writeFileSync(reportFile, JSON.stringify({ capturedAt: new Date().toISOString(), records }, null, 2) + '\n');
  console.log('Captured original source, reference and repository file hashes.');
} else {
  const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
  for (const record of report.records) {
    assert(!fs.existsSync(path.join(workspace, record.from)), `Old location remains: ${record.from}`);
    assert.deepEqual(fingerprint(path.join(workspace, record.to)), record.files, `Files changed or missing: ${record.to}`);
  }
  assert.deepEqual(fs.readdirSync(workspace).sort(), ['Soma_Bo', 'Soma_Fe', 'soma_be'].sort());
  report.verifiedAt = new Date().toISOString(); report.passed = true;
  report.verifiedFiles = report.records.reduce((sum, record) => sum + record.files.length, 0);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
  console.log(`Root has exactly three projects; ${report.verifiedFiles} preserved file hashes match.`);
}
