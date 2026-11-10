/**
 * Experiment Manager: runs controlled A/B experiments with proper controls.
 *
 * Deterministic, explainable, and exportable.
 */
import { randomUUID } from 'node:crypto';
import { scoreClaim, isCompliant } from './scorer.js';

export interface ExperimentVariant {
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
    evidence: { text: string; relevance: number }[];
  }>;
  control?: { name: string; score: number };
  createdAt: string;
  completedAt?: string;
  exportedAt?: string;
}

export class ExperimentManager {
  private experiments = new Map<string, any>();

  createExperiment(name: string, variants: ExperimentVariant[]): { id: string } {
    const id = randomUUID();
    const variantsWithScores = variants.map(v => ({
      ...v,
      result: scoreClaim({ claim: v.claim, evidence: v.evidence }),
    }));
    const controlScore = variants.length > 0 ? scoreClaim({
      claim: variants[0].claim,
      evidence: variants[0].evidence,
    }).score : 0;
    const result: ExperimentResult = {
      id,
      name,
      status: 'draft',
      variants: variantsWithScores,
      control: { name: 'Control', score: controlScore },
      createdAt: new Date().toISOString(),
    };
    this.experiments.set(id, result);
    return { id };
  }

  getResult(id: string) {
    return this.experiments.get(id);
  }

  completeExperiment(id: string): void {
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment ${id} not found`);
    exp.status = 'completed';
    exp.completedAt = new Date().toISOString();
  }

  exportResult(id: string): { exportedAt: string } {
    const exportedAt = new Date().toISOString();
    const exp = this.experiments.get(id);
    if (!exp) throw new Error(`Experiment ${id} not found`);
    exp.exportedAt = exportedAt;
    return { exportedAt };
  }

  listExperiments() {
    return Array.from(this.experiments.values());
  }
}

export const experimentManager = new ExperimentManager();