// Real campaign scorer: evidence-gated, deterministic, explainable.
// Scores a claim against retrieved evidence snippets, with a compliance gate.
import { z } from 'zod';

export interface EvidenceSnippet {
  text: string;
  source: string;
  relevance?: number; // 0..1 optional
}

export interface ClaimInput {
  claim: string;
  evidence: EvidenceSnippet[];
  disallowedTerms?: string[]; // compliance: banned words/phrases
}

export interface ScoreResult {
  score: number; // 0..100
  compliant: boolean;
  violations: string[];
  matchedEvidence: { snippet: string; relevance: number }[];
  explanation: string;
}

const BANNED = ['free', 'guaranteed', 'guaranteed', 'instant', 'risk-free', 'no-risk', 'guaranteed returns'];
const BANNED_NORMALIZED = BANNED.map(t => t.toLowerCase().replace(/\s+/g, ' '));

/** Deterministic, claim-based relevance score. Not a semantic model. */
export function scoreClaim(input: ClaimInput): ScoreResult {
  const claim = input.claim.toLowerCase().trim();
  const evidence = input.evidence || [];
  const violations: string[] = [];

  // 1) Compliance: banned terms in claim (and optionally evidence text).
  const text = [claim, ...evidence.map(e => e.text)].join(' ').toLowerCase();
  const banned = input.disallowedTerms || BANNED_NORMALIZED;
  for (const term of banned) {
    if (text.includes(term)) violations.push(`Contains banned term: "${term}"`);
  }

  // 2) Evidence matching: token overlap between claim and evidence snippets.
  const claimTokens = new Set(claim.split(/\W+/).filter(w => w.length > 2));
  const matched: Array<{ snippet: string; relevance: number }> = [];
  for (const snip of evidence) {
    const snipText = snip.text.toLowerCase();
    const snipTokens = new Set(snipText.split(/\W+/).filter(w => w.length > 2));
    let overlap = 0;
    for (const tok of claimTokens) if (snipTokens.has(tok)) overlap++;
    const relevance = claimTokens.size ? overlap / claimTokens.size : 0;
    if (overlap > 0) {
      matched.push({ snippet: snipText, relevance });
    }
  }

  // Score: 0..100. Blend: 60% best evidence coverage, 40% average relevance.
  const bestCoverage = matched.length ? Math.max(...matched.map(m => m.relevance)) : 0;
  const avgRelevance = matched.length ? matched.reduce((s, m) => s + m.relevance, 0) / matched.length : 0;
  const score = Math.round((bestCoverage * 0.6 + avgRelevance * 0.4) * 100);

  const explanation = !matched.length
    ? 'No evidence snippet overlaps the claim tokens; claim is ungrounded.'
    : `Claim is grounded by ${matched.length} evidence snippet(s). Coverage: ${(bestCoverage * 100).toFixed(0)}%.`;

  return {
    score,
    violations,
    matchedEvidence: matched,
    explanation: `Score: ${score}/100. ${explanation}`,
  };
}

/** Simple compliance gate: any banned term in claim or evidence -> not compliant. */
export function isCompliant(input: ClaimInput): boolean {
  const text = [input.claim, ...input.evidence.map(e => e.text)].join(' ').toLowerCase();
  const terms = BANNED_NORMALIZED;
  return !terms.some(t => text.includes(t));
}

/** Convenience: full pipeline — score and compliance gate. */
export function evaluateClaim(input: ClaimInput): ScoreResult {
  const result = scoreClaim(input);
  const compliant = isCompliant(input);
  return { ...result, violations: result.violations.concat(compliant ? [] : ['Contains banned terms']) };
}