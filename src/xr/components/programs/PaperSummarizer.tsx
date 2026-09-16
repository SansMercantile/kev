/**
 * AI Research Paper Summarizer (Curriculum view).
 *
 * Paste a paper URL - or the paper text, when the deployment has no egress or
 * the source is paywalled - and get a kid-friendly, tier-leveled extractive
 * summary plus the key concepts to know before stepping into the lab. All
 * summarisation runs server-side (`POST /xr/curriculum/summarize`); a fetch
 * failure comes back honestly as 502 with the paste fallback explained.
 */

import React, { useCallback, useState } from 'react';
import { FileSearch, Link2, ClipboardPaste, Sparkles } from 'lucide-react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';
import { getTierId, SCIENCE_TIERS } from '../../lib/studyTier';

interface SummaryResult {
  summary: string[];
  keyConcepts: string[];
  tier: { id: string; label: string };
  note: string;
  /** 'human-atlas' | 'ev-systems' when the reference is recognised (M5). */
  discipline: string | null;
  disciplineLabel: string | null;
}

export default function PaperSummarizer() {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [tier, setTier] = useState(getTierId());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const summarize = useCallback(async () => {
    if (!url.trim() && !text.trim()) {
      setError('Paste a paper URL or the paper text.');
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(xrApi('/curriculum/summarize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        body: JSON.stringify({
          url: url.trim() || undefined,
          text: text.trim() || undefined,
          tier,
        }),
      });
      const body = await res.json();
      if (body?.success) {
        setResult({
          summary: body.summary as string[],
          keyConcepts: body.keyConcepts as string[],
          tier: body.tier as SummaryResult['tier'],
          note: (body.note as string) || '',
          discipline: (body.discipline as string) || null,
          disciplineLabel: (body.disciplineLabel as string) || null,
        });
      } else {
        setError(body?.detail || 'Summariser failed.');
      }
    } catch {
      setError('Summariser unreachable.');
    } finally {
      setBusy(false);
    }
  }, [url, text, tier]);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-center gap-2">
        <FileSearch className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">AI Research Paper Summarizer</h3>
        <span className="text-[10px] text-slate-500">read the science before the lab</span>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paper URL (e.g. https://arxiv.org/abs/...)"
            className="w-full rounded-lg bg-slate-950 border border-slate-700 pl-8 pr-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            aria-label="Research paper URL"
          />
        </div>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="rounded-lg bg-slate-950 border border-slate-700 px-2 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          aria-label="Summary tier"
        >
          {SCIENCE_TIERS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={summarize}
          disabled={busy}
          className="flex items-center justify-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          <Sparkles className={`w-3.5 h-3.5 ${busy ? 'animate-pulse' : ''}`} />
          {busy ? 'Reading...' : 'Summarise'}
        </button>
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <ClipboardPaste className="w-3 h-3" />
          No access to the link? Paste the paper text instead - the summariser works offline on pasted text.
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="...or paste abstract / full text here"
          className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 p-2.5 focus:outline-none focus:border-cyan-500 resize-y"
          aria-label="Paper text"
        />
      </div>

      {error && (
        <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/30 border border-amber-900/60 rounded-lg p-2.5 leading-relaxed">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            Kid-friendly summary - {result.tier.label}
          </div>
          <ul className="mt-1.5 space-y-1">
            {result.summary.map((s, i) => (
              <li key={i} className="text-[11px] text-slate-300 leading-relaxed flex gap-1.5">
                <span className="text-cyan-500 shrink-0">•</span>{s}
              </li>
            ))}
          </ul>
          {result.keyConcepts.length > 0 && (
            <div className="mt-2.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Key concepts before the lab</div>
              <div className="flex flex-wrap gap-1.5">
                {result.keyConcepts.map((c) => (
                  <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-900">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
          {result.discipline && (
            <div className="mt-2.5">
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-900">
                {result.disciplineLabel || result.discipline} reference detected
              </span>
            </div>
          )}
          {result.note && <p className="mt-2 text-[10px] text-slate-600 leading-relaxed">{result.note}</p>}
        </div>
      )}
    </div>
  );
}
