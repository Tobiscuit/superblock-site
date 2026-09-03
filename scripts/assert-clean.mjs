// Fail the build rather than publish internal topology.
//
// The diagrams are sanitised when copied in from the private architecture repo.
// This is the independent check that the sanitising actually happened - a silent
// regression there would publish tailnet addresses, cluster IPs and internal
// hostnames to a public site.
//
// It lives in the build, not in a CI workflow, so it runs identically under
// Cloudflare Workers Builds, GitHub Actions, and `npm run build` on a laptop.
// A guard that only exists in one CI provider is a guard you lose the day you
// change providers.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PATTERNS = [
  // CGNAT 100.64.0.0/10 - the tailnet range
  { re: /\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/g, what: 'tailnet (CGNAT) address' },
  { re: /\btail[0-9a-f]{6,}\.ts\.net\b/gi, what: 'tailnet hostname' },
  // RFC1918, but only when it looks like a real host rather than a version
  { re: /\b10\.43\.\d{1,3}\.\d{1,3}\b/g, what: 'cluster service IP' },
  { re: /\b192\.168\.\d{1,3}\.\d{1,3}\b/g, what: 'private address' },
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g, what: 'private key' },
];

function walk(dir) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk('dist').filter((f) => /\.(html|svg|js|css|json|txt)$/.test(f));
const findings = [];
for (const f of files) {
  const text = readFileSync(f, 'utf8');
  for (const { re, what } of PATTERNS) {
    const hits = text.match(re);
    if (hits) findings.push({ f, what, sample: [...new Set(hits)].slice(0, 3) });
  }
}

if (findings.length) {
  console.error('\nBuild rejected — internal detail found in dist/:\n');
  for (const { f, what, sample } of findings) {
    console.error(`  ${f}\n    ${what}: ${sample.join(', ')}`);
  }
  console.error('\nSanitise at copy time, then rebuild.\n');
  process.exit(1);
}
console.log(`assert-clean: ${files.length} files scanned, nothing internal found`);
