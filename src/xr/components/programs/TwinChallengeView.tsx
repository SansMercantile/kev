/**
 * XR Science Twin Challenge - the Daily Lab Calibration.
 *
 * One target 3D state is published to every student for the day (a bent SO2
 * molecule, a Lagrange resonance, a critical-angle ray, a mitotic phase...).
 * Students tune the physics vectors on the sliders - electronegativity, launch
 * velocity, refractive index - and/or explain the state in their own words.
 * Similarity against the published target is scored live (60% parameters in a
 * tolerance band + 40% scientific vocabulary), and a submitted calibration
 * banks XP toward the weekly Study Goal (capped server-side).
 *
 * All scoring is server-side (`POST /xr/challenges/score|submit`) so the
 * tolerance bands and the XP ledger cannot be edited from the browser.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Target, FlaskConical, Send, Trophy, RefreshCw, ExternalLink } from 'lucide-react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';
import { getTierId, SCIENCE_TIERS } from '../../lib/studyTier';
import PlethStrip from './PlethStrip';

interface ChallengeParam {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  target: number;
  tolerance: number;
}

interface Challenge {
  id: string;
  date: string;
  title: string;
  brief: string;
  /** Routable bench for "Open lab": one of the four labs, 'physics', or null. */
  lab: string | null;
  /** 'tune' renders sliders; 'order' renders per-item position pickers. */
  kind: 'tune' | 'order';
  /** Row labels for order challenges (item i's correct slot is params[i].target). */
  itemLabels: string[];
  params: ChallengeParam[];
  keyTerms: string[];
  /** Pack-compiled challenges carry their source attribution (CC BY 4.0 etc.). */
  attribution?: string;
  /** Pulse twins (P5): fixed sensor context - site + LED wavelength - that
   * both the strip-chart preview and the server scorer merge with the
   * slider params. Null for every other challenge. */
  context?: { site?: string; wavelength?: string } | null;
}

const ROUTABLE_LABS = ['chemistry', 'astrophysics', 'biology', 'optics', 'physics', 'pulse'];

interface ParamBreakdown {
  key: string;
  label: string;
  yours: number | null;
  target: number;
  tolerance: number;
  score: number;
}

interface ScoreResult {
  score: number;
  parameterScore: number;
  descriptionScore: number;
  termsHit: string[];
  termsMissed: string[];
  breakdown: ParamBreakdown[];
}

/** GET /xr/challenges/xp returns { weeks: { "2026-W37": { xp, entries[] } } }. */
interface XpLedger {
  student: string;
  weeks: Record<string, { xp: number; entries: { date: string; challengeId: string; score: number; xpGained: number }[] }>;
}

interface XpSummary {
  week: string;
  weeklyXp: number;
  weeklyCap: number;
  submissions: number;
}

interface Props {
  studentId?: string;
  onOpenLab?: (labId: string) => void;
  onXpGained?: (xpGained: number, weeklyXp: number) => void;
}

const WEEKLY_CAP = 500;

export default function TwinChallengeView({ studentId, onOpenLab, onXpGained }: Props) {
  const student = studentId || 'kev-student';
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [params, setParams] = useState<Record<string, number>>({});
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [xp, setXp] = useState<XpSummary | null>(null);
  const [scoring, setScoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitInfo, setSubmitInfo] = useState<{ xpGained: number; weeklyXp: number; banked: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(xrApi('/challenges/daily'), { headers: xrAuthHeaders() });
        const body = await res.json();
        if (!alive || !body?.success) return;
        const ch = body.challenge as Challenge;
        setChallenge(ch);
        // Start mid-range so every slider has room to travel.
        const initial: Record<string, number> = {};
        ch.params.forEach((p, i) => {
          // Order challenges start in listed order (1..n); tune challenges
          // start mid-range so every slider has room to travel.
          initial[p.key] = ch.kind === 'order' ? i + 1 : Number(((p.min + p.max) / 2).toFixed(2));
        });
        setParams(initial);
      } catch {
        if (alive) setError('Could not load today\'s challenge. Is the KEV backend running?');
      }
    })();
    (async () => {
      try {
        const res = await fetch(xrApi(`/challenges/xp?student=${encodeURIComponent(student)}`), { headers: xrAuthHeaders() });
        const body = (await res.json()) as XpLedger & { success?: boolean };
        if (!alive || !body?.success) return;
        // Current ISO week is the latest key in the ledger.
        const week = Object.keys(body.weeks || {}).sort().pop();
        const entry = week ? body.weeks[week] : undefined;
        setXp({
          week: week || '-',
          weeklyXp: entry?.xp ?? 0,
          weeklyCap: WEEKLY_CAP,
          submissions: entry?.entries?.length ?? 0,
        });
      } catch {
        /* XP panel is a nice-to-have */
      }
    })();
    return () => {
      alive = false;
    };
  }, [student]);

  const scoreNow = useCallback(async (nextParams: Record<string, number>, nextDescription: string) => {
    if (!challenge) return;
    setScoring(true);
    try {
      const res = await fetch(xrApi('/challenges/score'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        body: JSON.stringify({ challengeId: challenge.id, params: nextParams, description: nextDescription }),
      });
      const body = await res.json();
      if (body?.success) setResult(body.result as ScoreResult);
      else setError(body?.detail || 'Scoring failed.');
    } catch {
      /* transient: next slider move retries */
    } finally {
      setScoring(false);
    }
  }, [challenge]);

  // Live similarity: debounce so dragging a slider doesn't hammer the server.
  useEffect(() => {
    if (!challenge) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void scoreNow(params, description);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [challenge, params, description, scoreNow]);

  const submit = useCallback(async () => {
    if (!challenge || !result) return;
    setSubmitting(true);
    setSubmitInfo(null);
    try {
      const res = await fetch(xrApi('/challenges/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        // The server re-scores from params+description; the client never
        // sends a score it computed itself.
        body: JSON.stringify({
          student,
          challengeId: challenge.id,
          params,
          description,
        }),
      });
      const body = await res.json();
      if (body?.success) {
        setSubmitted(true);
        // The server re-scores on submit (client scores are never trusted):
        // adopt its verdict as the displayed result.
        if (body.result) setResult(body.result as ScoreResult);
        const bank = body.xp as { xpGained: number; weeklyXp: number };
        const info = {
          xpGained: bank?.xpGained ?? 0,
          weeklyXp: bank?.weeklyXp ?? 0,
          banked: (bank?.xpGained ?? 0) > 0,
        };
        setSubmitInfo(info);
        setXp((prev) => prev ? { ...prev, weeklyXp: info.weeklyXp, submissions: prev.submissions + 1 } : prev);
        onXpGained?.(info.xpGained, info.weeklyXp);
      } else {
        setError(body?.detail || 'Submission failed.');
      }
    } catch {
      setError('Could not submit calibration.');
    } finally {
      setSubmitting(false);
    }
  }, [challenge, result, student, params, description, onXpGained]);

  const bandColor = useMemo(() => {
    const map: Record<string, string> = {};
    if (!challenge) return map;
    for (const p of challenge.params) {
      const value = params[p.key];
      if (value === undefined) continue;
      const d = Math.abs(value - p.target);
      map[p.key] = d <= p.tolerance ? 'text-emerald-400' : d <= p.tolerance * 3 ? 'text-amber-400' : 'text-rose-400';
    }
    return map;
  }, [challenge, params]);

  if (error && !challenge) {
    return (
      <div className="p-6 text-rose-300 text-sm bg-rose-950/40 border border-rose-800 rounded-lg">{error}</div>
    );
  }
  if (!challenge) {
    return (
      <div className="p-6 text-slate-400 text-sm animate-pulse">Publishing today's twin challenge...</div>
    );
  }

  const score = result?.score ?? null;
  const tierOptions = SCIENCE_TIERS;

  return (
    <div className="w-full h-full overflow-y-auto p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <Target className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-white">XR Science Twin Challenge</h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Daily Lab Calibration - {challenge.date}
        </span>
        {onOpenLab && challenge.lab && ROUTABLE_LABS.includes(challenge.lab) && (
          <button
            onClick={() => onOpenLab(challenge.lab as string)}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            title={`Reproduce this state in the ${challenge.lab} lab`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Open {challenge.lab} lab
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: the published target + tuning vectors */}
        <div className="xl:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-white">{challenge.title}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">{challenge.brief}</p>
            {challenge.attribution && (
              <p className="mt-1.5 text-[10px] text-slate-600 leading-relaxed">{challenge.attribution}</p>
            )}

            {/* P5 pulse twins: live strip-chart preview above the sliders.
                Context (site + wavelength) is fixed by the challenge; the
                same params the student tunes are what the server scores. */}
            {challenge.lab === 'pulse' && challenge.kind !== 'order' && (
              <div className="mt-3">
                <PlethStrip
                  params={{
                    ...(challenge.context ?? {}),
                    ...Object.fromEntries(challenge.params.map((p) => [p.key, params[p.key]])),
                  }}
                  targetParams={{
                    ...(challenge.context ?? {}),
                    ...Object.fromEntries(challenge.params.map((p) => [p.key, p.target])),
                  }}
                  height={170}
                />
                <p className="mt-1.5 text-[10px] text-slate-500 leading-relaxed">
                  Solid cyan: the trace your current slider state produces.
                  Dashed amber: the published target twin. Sensor site and LED
                  wavelength are fixed by the challenge - tune the physiology
                  until the traces overlap and the metrics agree.
                </p>
              </div>
            )}

            <div className="mt-4 space-y-4">
              {challenge.kind === 'order'
                ? challenge.params.map((p, i) => (
                    <div key={p.key} className="flex items-center gap-3">
                      <span className="w-6 text-right text-[11px] text-slate-600 tabular-nums">{i + 1}.</span>
                      <span className="flex-1 text-xs text-slate-200">
                        {challenge.itemLabels[i] || p.label}
                      </span>
                      <label className="text-[10px] text-slate-500" htmlFor={`slot-${p.key}`}>slot</label>
                      <select
                        id={`slot-${p.key}`}
                        value={params[p.key] ?? i + 1}
                        onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                        className="rounded-md bg-slate-950 border border-slate-700 text-xs text-slate-200 px-2 py-1.5 focus:outline-none focus:border-cyan-500"
                      >
                        {challenge.params.map((_, slot) => (
                          <option key={slot} value={slot + 1}>{slot + 1}</option>
                        ))}
                      </select>
                    </div>
                  ))
                : challenge.params.map((p) => (
                    <div key={p.key}>
                      <div className="flex items-baseline justify-between text-[11px]">
                        <label className="text-slate-300 font-medium">
                          {p.label} {p.unit ? <span className="text-slate-500">({p.unit})</span> : null}
                        </label>
                        <span className="flex items-center gap-2">
                          <span className={bandColor[p.key] || 'text-slate-300'}>
                            {params[p.key]?.toFixed(p.tolerance < 1 ? 2 : 0)}
                          </span>
                          <span className="text-slate-500">target {p.target}{p.unit ? ` ${p.unit}` : ''} ±{p.tolerance}</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.tolerance / 5 || 0.01}
                        value={params[p.key] ?? (p.min + p.max) / 2}
                        onChange={(e) => setParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                        className="w-full accent-cyan-400"
                        aria-label={p.label}
                      />
                    </div>
                  ))}
            </div>

            <div className="mt-4">
              <label className="text-[11px] text-slate-300 font-medium" htmlFor="twin-description">
                Or explain this state in your own words (counts for 40% of the score)
              </label>
              <textarea
                id="twin-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="e.g. The molecule is bent because a lone pair on sulfur pushes the bonds down to about 119 degrees, and the polar bonds do not cancel, so it has a net dipole..."
                className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 p-2.5 focus:outline-none focus:border-cyan-500 resize-y"
              />
              {!result && challenge.keyTerms.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Vocabulary that counts:</span>
                  {challenge.keyTerms.map((term) => (
                    <span key={`key-${term}`} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-400 border border-slate-700">
                      {term}
                    </span>
                  ))}
                </div>
              )}
              {result && (result.termsHit.length > 0 || result.termsMissed.length > 0) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.termsHit.map((term) => (
                    <span key={`hit-${term}`} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-800">
                      {term}
                    </span>
                  ))}
                  {result.termsMissed.map((term) => (
                    <span key={`miss-${term}`} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-500 border border-slate-700">
                      {term}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Per-vector feedback from the server's scoring breakdown */}
          {result && result.breakdown.length > 0 && (
            <ul className="rounded-xl border border-slate-800 bg-slate-900/50 p-3 space-y-1">
              {result.breakdown.map((b) => (
                <li key={b.key} className="text-[11px] text-slate-400 leading-relaxed">
                  - {b.label}:{' '}
                  <span className={b.score >= 90 ? 'text-emerald-400' : b.score >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                    {b.yours === null ? 'not set' : `${b.yours}`}
                  </span>{' '}
                  {challenge.kind === 'order'
                    // Order challenges are puzzles: the correct slot is never
                    // echoed back, only how close the arrangement is.
                    ? `(${Math.round(b.score)}% placed)`
                    : `vs target ${b.target} ±${b.tolerance} (${Math.round(b.score)}% match)`}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: live similarity + XP */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-500">Live similarity</div>
            <div className={`mt-1 text-4xl font-bold tabular-nums ${score === null ? 'text-slate-600' : score >= 90 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
              {score === null ? '--' : `${Math.round(score)}%`}
            </div>
            {scoring && <div className="mt-1 text-[10px] text-cyan-400 animate-pulse">scoring...</div>}
            {result && (
              <div className="mt-2 grid grid-cols-2 gap-2 text-[10px]">
                <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2">
                  <div className="text-slate-500">Parameters (60%)</div>
                  <div className="text-slate-200 font-semibold tabular-nums">{Math.round(result.parameterScore)}%</div>
                </div>
                <div className="rounded-lg bg-slate-950/60 border border-slate-800 p-2">
                  <div className="text-slate-500">Explanation (40%)</div>
                  <div className="text-slate-200 font-semibold tabular-nums">{Math.round(result.descriptionScore)}%</div>
                </div>
              </div>
            )}
            <button
              onClick={submit}
              disabled={submitting || submitted || score === null}
              className="mt-3 w-full flex items-center justify-center gap-2 text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
            >
              {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {submitted ? 'Calibration submitted' : 'Submit calibration for XP'}
            </button>
            {submitInfo && (
              <div className="mt-2 text-[11px] text-emerald-300">
                {submitInfo.banked
                  ? `+${submitInfo.xpGained} XP banked (week total ${submitInfo.weeklyXp}/${WEEKLY_CAP})`
                  : `No XP this time - weekly Study Goal cap (${WEEKLY_CAP} XP) reached. Keep calibrating for practice.`}
              </div>
            )}
            {error && <div className="mt-2 text-[11px] text-rose-400">{error}</div>}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Weekly Study Goal XP
            </div>
            <div className="mt-2 text-sm text-slate-200 font-semibold tabular-nums">
              {xp?.weeklyXp ?? 0} <span className="text-slate-500 font-normal">/ {xp?.weeklyCap ?? WEEKLY_CAP} XP</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                style={{ width: `${Math.min(100, ((xp?.weeklyXp ?? 0) / (xp?.weeklyCap ?? WEEKLY_CAP)) * 100)}%` }}
              />
            </div>
            <div className="mt-1.5 text-[10px] text-slate-500">
              ISO week {xp?.week ?? '-'} - {xp?.submissions ?? 0} calibration{xp?.submissions === 1 ? '' : 's'} submitted
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <div className="text-[10px] text-slate-500 mb-1">
              Register: <span className="text-slate-300">{tierOptions.find((t) => t.id === getTierId())?.label}</span>
            </div>
            <div className="text-[10px] text-slate-600 leading-relaxed">
              Change your teaching tier in the Labs toolbar - briefs, study kits and Professor KEV all adapt to it.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
