/**
 * One-click lab study kit (Adaptive Science Briefs).
 *
 * Fetches the tiered kit for a lab from `POST /xr/briefs`: a leveled summary,
 * the tier's framing (register / math formality / scaffolding), flip
 * flashcards and a quiz whose prompt style matches the tier. Two exports:
 *  - Print / Save as PDF: opens a clean print stylesheet window.
 *  - Quiz CSV: Google Forms import-compatible (Question, Type, Answer).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { X, Printer, FileSpreadsheet, Layers, RefreshCw } from 'lucide-react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';

interface Kit {
  labId: string;
  labName: string;
  tier: { id: string; label: string; register: string; mathFormality: string; scaffolding: string[] };
  summary: string;
  tieredFraming: { register: string; mathFormality: string; scaffolding: string[] };
  flashcards: { front: string; back: string }[];
  quiz: { question: string; tier: string; expected: string; promptStyle: string }[];
  /** Pack-sourced kits (anatomy, vehicle) carry their license attribution. */
  attribution?: string;
}

interface Props {
  labId: string;
  tier: string;
  onClose: () => void;
}

export default function StudyKitModal({ labId, tier, onClose }: Props) {
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [answersShown, setAnswersShown] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(xrApi('/briefs'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
          body: JSON.stringify({ labId, tier }),
        });
        const body = await res.json();
        if (!alive) return;
        if (body?.success) {
          setKit(body.kit as Kit);
          setFlipped({});
          setAnswersShown(false);
        } else {
          setError(body?.detail || 'Could not build the study kit.');
        }
      } catch {
        if (alive) setError('Study kit service offline.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [labId, tier]);

  const printKit = useCallback(() => {
    if (!kit) return;
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(kit.labName)} study kit (${esc(kit.tier.label)})</title>
<style>
  body { font-family: Georgia, serif; margin: 40px; color: #111; }
  h1 { font-size: 20px; } h2 { font-size: 15px; margin-top: 24px; border-bottom: 1px solid #999; padding-bottom: 4px; }
  .meta { color: #555; font-size: 12px; }
  ul, ol { font-size: 13px; line-height: 1.6; }
  .card { border: 1px solid #ccc; border-radius: 6px; padding: 8px 12px; margin: 6px 0; font-size: 13px; }
  .card b { display: block; }
  @media print { body { margin: 20px; } }
</style></head><body>
<h1>${esc(kit.labName)} - Lab Study Kit</h1>
<p class="meta">Tier: ${esc(kit.tier.label)} - KEV Academy science programmes</p>
<h2>Leveled summary</h2><p style="font-size:13px;line-height:1.6">${esc(kit.summary)}</p>
<h2>How this tier teaches</h2><ul>
  <li><b>Register:</b> ${esc(kit.tieredFraming.register)}</li>
  <li><b>Math:</b> ${esc(kit.tieredFraming.mathFormality)}</li>
  ${kit.tieredFraming.scaffolding.map((s) => `<li>${esc(s)}</li>`).join('')}
</ul>
<h2>Flashcards</h2>
${kit.flashcards.map((c) => `<div class="card"><b>${esc(c.front)}</b>${esc(c.back)}</div>`).join('')}
<h2>Quiz</h2>
<ol>${kit.quiz.map((q) => `<li style="margin-bottom:10px;font-size:13px">${esc(q.question)}<br><span class="meta">Expected: ${esc(q.expected)}</span></li>`).join('')}</ol>
${kit.attribution ? `<p class="meta" style="margin-top:24px;border-top:1px solid #ccc;padding-top:8px">${esc(kit.attribution)}</p>` : ''}
</body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }, [kit]);

  const exportQuizCsv = useCallback(() => {
    if (!kit) return;
    // Google Forms CSV import columns: Question Text, Question Type, Answer.
    const rows = [['Question Text', 'Question Type', `Answer 1`, 'Correct Answer']];
    for (const q of kit.quiz) {
      rows.push([q.question, 'Paragraph', q.expected, 'TRUE']);
    }
    const csv = rows
      .map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kev-quiz-${kit.labId}-${kit.tier.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [kit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
          <Layers className="w-4 h-4 text-cyan-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">
              {kit ? `${kit.labName} study kit` : 'Lab study kit'}
            </h3>
            {kit && <div className="text-[10px] text-slate-500">{kit.tier.label}</div>}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={printKit}
              disabled={!kit}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              title="Print / Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={exportQuizCsv}
              disabled={!kit}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
              title="Google Forms-compatible quiz CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Quiz CSV
            </button>
            <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800" aria-label="Close study kit">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" /> Building your {tier} kit...
            </div>
          )}
          {error && <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-lg p-2.5">{error}</div>}

          {kit && (
            <>
              <section>
                <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1">Leveled summary</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{kit.summary}</p>
                <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-[10px] text-slate-400 space-y-1">
                  <div><span className="text-slate-500">Register:</span> {kit.tieredFraming.register}</div>
                  <div><span className="text-slate-500">Math:</span> {kit.tieredFraming.mathFormality}</div>
                  <div><span className="text-slate-500">Scaffolding:</span> {kit.tieredFraming.scaffolding.join(' - ')}</div>
                </div>
              </section>

              <section>
                <h4 className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">
                  Flashcards <span className="normal-case text-slate-600">(tap to flip)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {kit.flashcards.map((card, i) => (
                    <button
                      key={card.front}
                      onClick={() => setFlipped((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="text-left rounded-lg border border-slate-800 bg-slate-900/70 hover:border-cyan-800 p-2.5 transition-colors min-h-[64px]"
                    >
                      <div className="text-[11px] font-semibold text-cyan-300">{card.front}</div>
                      <div className={`mt-1 text-[11px] leading-relaxed ${flipped[i] ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                        {flipped[i] ? card.back : 'tap to reveal'}
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-[11px] uppercase tracking-wider text-slate-500">Quiz ({kit.quiz.length})</h4>
                  <button
                    onClick={() => setAnswersShown((v) => !v)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300"
                  >
                    {answersShown ? 'Hide answers' : 'Show answers'}
                  </button>
                </div>
                <ol className="space-y-2">
                  {kit.quiz.map((q, i) => (
                    <li key={i} className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
                      <div className="text-[11px] text-slate-200">{q.question}</div>
                      <div className="mt-0.5 text-[9px] text-slate-600">{q.promptStyle}</div>
                      {answersShown && (
                        <div className="mt-1 text-[10px] text-emerald-400/90 border-t border-slate-800 pt-1">
                          Expected: {q.expected}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </section>

              {kit.attribution && (
                <p className="text-[10px] text-slate-600 leading-relaxed border-t border-slate-800 pt-2.5">
                  {kit.attribution}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
