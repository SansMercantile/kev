/**
 * Working demo of the complete campaign pipeline.
 * Plain JS, no build step. Run: node demo.mjs
 */

// 1) SCORER: deterministic, evidence-gated
function scoreClaim({ claim, evidence }) {
  const text = claim.toLowerCase().trim();
  const violations = [];
  const banned = ['free', 'guaranteed', 'instant', 'risk-free', 'no-risk'];
  for (const term of banned) {
    if (text.includes(term)) violations.push(`banned term: ${term}`);
  }
  const claimTokens = new Set(text.split(/\W+/).filter(w => w.length > 2));
  const matched = [];
  for (const snip of evidence) {
    const snipText = snip.text.toLowerCase();
    let overlap = 0;
    for (const tok of claimTokens) if (snipText.includes(tok)) overlap++;
    if (overlap > 0) matched.push({ snippet: snipText, relevance: overlap / claimTokens.size });
  }
  const best = matched.length ? Math.max(...matched.map(m => m.relevance)) : 0;
  const avg = matched.length ? matched.reduce((s, m) => s + m.relevance, 0) / matched.length : 0;
  const score = Math.round((best * 0.6 + avg * 0.4) * 100);
  return { score, violations, matched: matched.length };
}

// 2) Run a controlled A/B experiment
function runExperiment(variants) {
  const results = variants.map(v => {
    const result = scoreClaim(v);
    return { ...v, result };
  });
  return {
    id: `exp-${Date.now()}`,
    name: 'Landing page headline A/B test',
    status: 'completed',
    variants: results,
    control: { score: 0 },
    createdAt: new Date().toISOString(),
  };
}

// 3) Evidence for the demo
const evidence = [
  { text: 'Our case study measured 2.3x more qualified leads after the redesign.', source: 'Case study 2024' },
  { text: 'Users who completed the tutorial were 40% more likely to subscribe.', source: 'Learning research 2024' },
];

// 4) Variants to test
const variants = [
  { id: 'A', claim: 'Double your leads in 30 days', evidence: [evidence[0]] },
  { id: 'B', claim: 'Learn faster with interactive courses.', evidence: [evidence[1]] },
];

// 5) Run the experiment
const experiment = runExperiment(variants);

// 6) Exports
console.log('=== EXPERIMENT CREATED ===');
console.log(JSON.stringify(experiment, null, 2));

// CSV export
const headers = ['id', 'claim', 'score', 'compliant', 'violations'];
const rows = experiment.variants.map(v => [
  v.id,
  v.claim,
  v.result.score.toFixed(2),
  v.compliant ? 'yes' : 'no',
  v.result.violations.join('; '),
]);
const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
console.log('\n=== CSV EXPORT ===\n' + csv);

// Flattened prose for an LLM prompt
const prose = `Campaign: ${experiment.name}\nVariants:\n${experiment.variants.map(v => `- ${v.claim} (score ${v.result.score}, compliant: ${v.compliant})`).join('\n')}\nControl: baseline score ${experiment.control.score}`;
console.log('\n=== FLATTENED PROSE (for LLM prompt) ===\n' + prose);

// Verification
console.log('\n=== VERIFICATION ===');
const bad = experiment.variants.filter(v => !v.compliant);
console.log('Non-compliant variants:', bad.length);
if (bad.length) {
  console.log('Needs revision before launch:');
  bad.forEach(v => console.log(`- ${v.id}: ${v.result.violations.join(', ')}`));
} else {
  console.log('All variants are compliant and ready to launch.');
}

// Audit trail
const audit = {
  id: experiment.id,
  timestamp: new Date().toISOString(),
  variants: experiment.variants.map(v => ({
    id: v.id,
    score: v.result.score,
    compliant: v.compliant,
    violations: v.result.violations,
  })),
};
console.log('\n=== AUDIT TRAIL ===');
console.log(JSON.stringify(audit, null, 2));
console.log('\nDone.');
