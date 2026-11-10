/**
 * Experiment Manager: runs controlled A/B experiments with proper controls.
 * Deterministic, explainable, and exportable.
 */
import { randomUUID } from 'node:crypto';
import { scoreClaim } from './scorer.js';

export interface Variant {
  id: string;
  name: string;
  claim: string;
  evidence: { text: string; source: string }[];
}

export interface ExperimentResult {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'completed';
  variants: Array<{
    id: string;
    name: string;
    score: number;
    compliant: boolean;
    violations: string[];
  }>;
  control?: { name: string; score: number };
  createdAt: string;
  completedAt?: string;
  exportedAt?: string;
}

export class ExperimentManager {
  private experiments = new Map<string, ExperimentResult>();

  create(name: string, variants: Variant[]): { id: string } {
    const id = randomUUID();
    const results = variants.map(v => ({
      ...v,
      score: scoreClaim({ claim: v.claim, evidence: v.evidence }),
    }));
    const control = variants.length > 0
      ? scoreClaim({ claim: variants[0].claim, evidence: variants[0].evidence })
      : 0;
    const result: ExperimentResult = {
      id,
      name,
      status: 'draft',
      variants: results.map((r, i) => ({
        id: `v${i + 1}`,
        name: r.claim,
        score: r.score,
        compliant: r.compliant,
        violations: r.violations,
      })),
      control: { name: 'Control', score: control.score },
      createdAt: new Date().toISOString(),
    };
    this.experiments.set(id, result);
    return { id };
  }

  get(id: string) {
    return this.experiments.get(id);
  }

  complete(id: string) {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment ${id} not found`);
    exp.status = 'completed';
    exp.completedAt = new Date().toISOString();
  }

  export(id: string) {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment ${id} not found`);
    exp.exportedAt = new Date().toISOString();
    return { exportedAt: exp.exportedAt };
  }

  list() {
    return Array.from(this.experiments.values());
  }
}

export const experimentManager = new ExperimentManager();