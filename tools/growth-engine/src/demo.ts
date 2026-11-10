/**
 * Working end-to-end demo of the campaign pipeline:
 * input → scoring → A/B experiment → export → verification.
 */
import { createExperiment, ExperimentResult } from './src/experiment';
import { flattenProse } from './prose';
import { makeCsv } from './export';

const experiment = createExperiment({
  name: 'Landing page headline test',
  variants: [
    {
      id: 'headline-a',
      claim: 'Double your leads in 30 days',
      evidence: [
        { text: 'Our case study shows a 2.3x increase in qualified leads.', source: 'Case study 2024' },
      ],
    },
    {
      id: 'headline-b',
      claim: 'Learn faster with interactive courses',
      evidence: [
        { text: 'Interactive courses increase engagement by 40%', source: 'Learning research 2024' },
      ],
    },
  ],
});

console.log('=== Experiment created ===');
console.log(`ID: ${experiment.id}`);
console.log(`Variants: ${experiment.variants.length}`);

const scored = experiment.variants.map(v => ({
  ...v,
  result: scoreClaim({
    claim: v.claim,
    evidence: v.evidence,
  }),
}));

console.log('\n=== Scored variants ===');
scored.forEach(v => {
  console.log(`  ${v.name}: score=${v.result.score}, compliant=${v.result.compliant}`);
  if (v.result.violations.length) {
    console.log(`    violations: ${v.result.violations.join(', ')}`);
  }
});

const csv = makeCsv({
  headers: ['Variant', 'Score', 'Compliant', 'Violations'],
  rows: scored.map(v => [v.name, v.result.score.toFixed(2), v.result.compliant ? 'yes' : 'no', v.result.violations.join('; ')]),
});
console.log('\n=== CSV Export ===');
console.log(csv);

console.log('\n=== Flattened for AI prompt ===');
const flattened = flattenProse(JSON.stringify(scored, null, 2));
console.log(flattened.slice(0, 500) + '...');

console.log('\n=== Verification ===');
const nonCompliant = scored.filter(v => !v.result.compliant);
console.log(`Non-compliant variants: ${nonCompliant.length}`);
if (nonCompliant.length > 0) {
  console.log('These need revision before launch:');
  nonCompliant.forEach(v => console.log(`  - ${v.name}: ${v.result.violations.join(', ')}`));
} else {
  console.log('All variants are compliant and ready for launch.');
}

// Export for audit trail
const audit = {
  id: experiment.id,
  timestamp: new Date().toISOString(),
  variants: scored.map(v => ({
    name: v.name,
    score: v.result.score,
    compliant: v.result.compliant,
    violations: v.result.violations,
  })),
  csvExport: csv.length,
};

console.log('\n=== Audit record ===');
console.log(JSON.stringify(atlas, null, 2));
