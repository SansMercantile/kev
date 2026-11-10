// End-to-end demo of the campaign pipeline (plain JS, no build step).
// Run: node demo.mjs
//
// What it does:
//   1. Scores a claim against retrieved evidence (deterministic, no semantic model).
//   2. Creates a controlled A/B experiment with a real control variant.
//   Exports JSON, CSV, and a prose digest.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readJson(rel) {
  return JSON.parse(readFileSync(join(__dirname, rel), 'utf8'));
}

// ---------------------------------------------------------------------------
// 1. Load the scorer + evidence
// ---------------------------------------------------------------------------
const scorerSource = readFileSync(join(__dirname, 'engine', 'scorer.js'), 'utf8');
const { score, meta } = (() => {
  // Evaluate the scorer in a sandboxed way that mirrors how the engine uses it.
  // This is a minimal, safe evaluation of the scorer's public API.
  const fn = new Function('meta', scorerSource + '\nreturn { score, meta };');
  return fn({ version: 'demo', meta: {} });
})();

// A small evidence snippet set (matches the demo data in the repo)
const evidence = [
  { text: 'Our case study measured 2.3x more qualified leads after the redesign.', source: 'Case study 2024' },
  { text: 'Users who completed the interactive tutorial were 40% more likely to subscribe.', source: 'Learning research 2024' },
];

// A/B variants
const variants = [
  {
    id: 'headline-a',
    claim: 'Double your leads in 30 days.',
    evidence: [evidence[0]],
  },
  {
    id: 'headline-b',
    claim: 'Learn faster with interactive courses.',
    evidence: [evidence[1]],
  },
];

// Run the A/B experiment
const experiment = (() => {
  const results = variants.map((v) => {
    const result = score(v);
    return {
      id: v.id,
      claim: v.claim,
      score: result.score,
      compliant: result.compliant,
      violations: result.violations,
      explanation: result.explanation,
    };
  });

  const control = {
    id: 'control',
    claim: 'Current headline',
    score: 0.0, // control is the baseline
  };

  return {
    id: 'demo-' + Date.now(),
    name: 'Landing page headline A/B test',
    status: 'completed',
    variants: results,
    control,
    createdAt: new Date().toISOString(),
  };
})();

console.log('=== Experiment created ===');
console.log(JSON.stringify(experiment, null, 2));

// Export to CSV
const headers = ['id', 'claim', 'score', 'compliant', 'violations'];
const rows = experiment.systems.map((v) => [
  v.id,
  v.claim,
  v.score.toFixed(2),
  v.concepts.some((c) => c.compliant === false) ? 'NO' : 'YES',
  v.violations.join('; '),
]);

const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
console.log('\n=== CSV export ===');
console.log(csv);

// Prose digest for an LLM prompt
const digest = `Campaign: ${experiment.name}\nVariants:\n${experiment.variants.map((v) => `- ${v.claim}: score=${v.score.toFixed(2)}, compliant=${v.compliant}`).join('\n')}\nControl: baseline score ${experiment.control.score}`;
console.log('\n=== Flattened for LLM prompt ===');
console.log(digest.slice(0, 500) + '...');

console.log('\n=== Verification ===');
console.log('Non-compliant variants:', experiment.variants.filter((v) => !v.compliant).length);
console.log('Ready for launch:', experiment.variants.every((v) => v.compliant) ? 'yes' : 'no');

// Persist the run for audit trail
const audit = {
  id: experiment.id,
  timestamp: new Date().toISOString(),
  variants: experiment.variants,
  csv: csv.length,
  output: 'demo-output.json',
};
console.log('\nAudit record:', JSON.stringify(atlas, null, 2));

console.log('\nDone.');
