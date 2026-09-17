/**
 * Earth & Planetary Biome Reconnaissance (Floor 3 Planetarium).
 *
 * Three evidence feeds - satellite imagery, rover rock-strata scans and
 * exoplanet transit data - plus the field mission. The backend identifies
 * rock type (igneous / sedimentary / metamorphic) and Köppen climate zone
 * from the measured evidence, names the dominant erosion mechanism, scores
 * exoplanet habitability with reasons, and checks the mission: students
 * derive their latitude from the noon solar zenith angle and the season's
 * solar declination (latitude = declination + zenith at local noon).
 *
 * Evidence stays hidden until analysed, and the mission answer never ships
 * to the browser (routes strip `_answer`).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Globe2, Mountain, Satellite, Telescope, Compass, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';

interface Specimen {
  id: string;
  kind: string;
  name: string;
}

interface Analysis {
  rock?: { rockType: string; reason: string };
  climate?: { zone: string; label: string; reason: string };
  erosion?: { mechanism: string; reason: string };
  habitability?: { score: number | null; reasons: string[] };
}

interface Mission {
  date: string;
  dayOfYear: number;
  declinationDeg: number;
  noonZenithDeg: number;
  scatteringNote: string;
  question: string;
}

interface MissionCheck {
  correct: boolean;
  deltaDeg: number;
  answer: number;
  score: number;
}

interface Props {
  onOpenLab?: (labId: string) => void;
}

// Keyed by the specimen `kind` the catalogue ships.
const FEED_META: Record<string, { icon: React.ReactNode; tone: string }> = {
  'satellite feed': { icon: <Satellite className="w-3.5 h-3.5" />, tone: 'text-sky-300' },
  'planetary rover': { icon: <Telescope className="w-3.5 h-3.5" />, tone: 'text-violet-300' },
  'rock strata': { icon: <Mountain className="w-3.5 h-3.5" />, tone: 'text-amber-300' },
  'exoplanet survey': { icon: <Telescope className="w-3.5 h-3.5" />, tone: 'text-fuchsia-300' },
};

export default function BiomeReconView({ onOpenLab }: Props) {
  const [specimens, setSpecimens] = useState<Specimen[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysing, setAnalysing] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [guess, setGuess] = useState('');
  const [check, setCheck] = useState<MissionCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [specRes, missionRes] = await Promise.all([
          fetch(xrApi('/biome/specimens'), { headers: xrAuthHeaders() }),
          fetch(xrApi('/biome/missions'), { headers: xrAuthHeaders() }),
        ]);
        const specBody = await specRes.json();
        const missionBody = await missionRes.json();
        if (!alive) return;
        if (specBody?.success) {
          setSpecimens(specBody.specimens as Specimen[]);
          setSelectedId((specBody.specimens as Specimen[])[0]?.id ?? null);
        }
        if (missionBody?.success) setMission(missionBody.mission as Mission);
      } catch {
        if (alive) setError('Reconnaissance feeds offline - is the KEV backend running?');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const analyse = useCallback(async (id: string) => {
    setAnalysing(true);
    setAnalysis(null);
    setError(null);
    try {
      const res = await fetch(xrApi('/biome/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        body: JSON.stringify({ specimenId: id }),
      });
      const body = await res.json();
      if (body?.success) setAnalysis(body.analysis as Analysis);
      else setError(body?.detail || 'Analysis failed.');
    } catch {
      setError('Could not reach the analysis engine.');
    } finally {
      setAnalysing(false);
    }
  }, []);

  const checkMission = useCallback(async () => {
    if (!mission || !guess) return;
    setChecking(true);
    setCheck(null);
    try {
      const res = await fetch(xrApi('/biome/missions/check'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...xrAuthHeaders() },
        body: JSON.stringify({ latitude: Number(guess), dayOfYear: mission.dayOfYear, noonZenithDeg: mission.noonZenithDeg }),
      });
      const body = await res.json();
      if (body?.success) setCheck(body.check as MissionCheck);
      else setError(body?.detail || 'Mission check failed.');
    } catch {
      setError('Could not check the mission.');
    } finally {
      setChecking(false);
    }
  }, [mission, guess]);

  const selected = specimens.find((s) => s.id === selectedId) || null;

  return (
    <div className="w-full h-full overflow-y-auto p-4 lg:p-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-cyan-300">
          <Globe2 className="w-5 h-5" />
          <h2 className="text-lg font-semibold text-white">Earth &amp; Planetary Biome Reconnaissance</h2>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          Floor 3 - Planetarium field station
        </span>
        {onOpenLab && (
          <button
            onClick={() => onOpenLab('astrophysics')}
            className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Open planetarium lab
          </button>
        )}
      </div>
      {error && <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-900 rounded-lg p-2.5">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Feeds + evidence bench */}
        <div className="xl:col-span-3 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Evidence feeds</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {specimens.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedId(s.id);
                    setAnalysis(null);
                  }}
                  className={`text-left rounded-lg border p-2.5 transition-all ${
                    s.id === selectedId
                      ? 'border-cyan-600 bg-cyan-950/30 shadow shadow-cyan-900/20'
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-600'
                  }`}
                >
                  <div className={`flex items-center gap-1.5 text-[10px] ${FEED_META[s.kind]?.tone || 'text-slate-400'}`}>
                    {FEED_META[s.kind]?.icon}
                    {s.kind}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-200">{s.name}</div>
                  <div className="text-[10px] text-slate-500">{s.id}</div>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selected.name}</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">{selected.kind} - evidence sealed until analysed</p>
                </div>
                <button
                  onClick={() => analyse(selected.id)}
                  disabled={analysing}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white transition-colors"
                >
                  {analysing ? 'Identifying...' : 'Run AI analysis'}
                </button>
              </div>

              {analysis && (
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.rock && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Rock identification</div>
                      <div className="mt-1 text-sm font-semibold text-amber-300 capitalize">{analysis.rock.rockType}</div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{analysis.rock.reason}</p>
                    </div>
                  )}
                  {analysis.climate && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Köppen climate zone</div>
                      <div className="mt-1 text-sm font-semibold text-sky-300">{analysis.climate.zone}</div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{analysis.climate.reason}</p>
                    </div>
                  )}
                  {analysis.erosion && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Dominant erosion mechanism</div>
                      <div className="mt-1 text-sm font-semibold text-emerald-300">{analysis.erosion.mechanism}</div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{analysis.erosion.reason}</p>
                    </div>
                  )}
                  {analysis.habitability && (
                    <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <div className="text-[10px] uppercase tracking-wider text-slate-500">Habitability assessment</div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-violet-300">
                          {analysis.habitability.score === null
                            ? 'Not an exoplanet target'
                            : analysis.habitability.score >= 70
                              ? 'Promising'
                              : analysis.habitability.score >= 40
                                ? 'Marginal'
                                : 'Unlikely'}
                        </span>
                        {analysis.habitability.score !== null && (
                          <span className="text-xs text-slate-400 tabular-nums">{analysis.habitability.score}/100</span>
                        )}
                      </div>
                      {analysis.habitability.score !== null && (
                        <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-400" style={{ width: `${analysis.habitability.score}%` }} />
                        </div>
                      )}
                      <ul className="mt-2 space-y-1">
                        {analysis.habitability.reasons.map((r, i) => (
                          <li key={i} className="text-[11px] text-slate-400 leading-relaxed">- {r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Field mission */}
        <div className="xl:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Field mission - solar navigation
            </div>
            {mission ? (
              <>
                <h3 className="mt-2 text-sm font-semibold text-white">Field survey - {mission.date}</h3>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">{mission.question}</p>
                <div className="mt-3 rounded-lg bg-slate-950/60 border border-slate-800 p-3 text-[11px] text-slate-300 space-y-1">
                  <div className="text-slate-500 leading-relaxed">{mission.scatteringNote}</div>
                  <div>Noon solar zenith angle: <span className="text-cyan-300 font-semibold tabular-nums">{mission.noonZenithDeg.toFixed(1)}°</span></div>
                  <div>Solar declination (day {mission.dayOfYear}): <span className="text-cyan-300 font-semibold tabular-nums">{mission.declinationDeg.toFixed(2)}°</span></div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Your latitude (°)"
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 px-2.5 py-2 focus:outline-none focus:border-cyan-500"
                    aria-label="Latitude answer in degrees"
                  />
                  <button
                    onClick={checkMission}
                    disabled={checking || !guess}
                    className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white transition-colors"
                  >
                    {checking ? 'Checking...' : 'Check'}
                  </button>
                </div>
                {check && (
                  <div className={`mt-3 rounded-lg border p-3 ${check.correct ? 'border-emerald-800 bg-emerald-950/40' : 'border-rose-800 bg-rose-950/40'}`}>
                    <div className={`flex items-center gap-1.5 text-xs font-semibold ${check.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                      {check.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {check.correct ? `Fix confirmed - ${check.score}%` : `Off by ${check.deltaDeg.toFixed(1)}°`}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                      φ = δ + z = {mission.declinationDeg.toFixed(2)}° + {mission.noonZenithDeg.toFixed(1)}° = {check.answer.toFixed(2)}° (northern branch).
                      {check.correct ? ' Your navigation is sound.' : ' Re-measure the shadow tip and try again.'}
                    </p>
                  </div>
                )}
                <div className="mt-2 text-[10px] text-slate-600 leading-relaxed">
                  Hint: at local noon, latitude = solar declination + zenith angle (same hemisphere sign rules apply).
                </div>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500 animate-pulse">Receiving today's mission briefing...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
