/**
 * Pulse Lab (P5) - photoplethysmography (PPG) exploration bench.
 *
 * The wearable-optics counterpart to the Twin Challenge: pick one of 7
 * sensor sites (transmission clips and reflectance patches), one of 3 LED
 * wavelengths, and drive the physiology - heart rate, perfusion, vascular
 * compliance, respiration, motion and Fitzpatrick skin tone. The
 * deterministic server engine (POST /xr/pleth/simulate) returns the
 * waveform; PlethStrip renders it. Every site carries an honest BodyParts3D
 * arterial anchor (CC BY 4.0) - including the earlobe, which has no named
 * artery and says so.
 *
 * All educational copy is KEV-original: the physiology taught here (beat
 * morphology, dicrotic notch, AC/DC, perfusion index, wavelength
 * penetration, motion artefact, melanin/SNR equity) is standard
 * pulse-oximetry science, written for this programme.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { xrApi, xrAuthHeaders } from '../../lib/xrApi';
import PlethStrip, { PlethParams } from './PlethStrip';

interface SiteInfo {
  id: string;
  label: string;
  mode: string;
  perfusion: number;
  depth: number;
  motionSensitivity: number;
  atlasPartId: string | null;
  atlasPartName: string | null;
  blurb: string;
}

interface WavelengthInfo {
  id: string;
  label: string;
  penetration: number;
  absorption: number;
}

interface SitesPayload {
  success: boolean;
  sites: SiteInfo[];
  wavelengths: WavelengthInfo[];
  defaults: Record<string, number>;
  limits: Record<string, [number, number]>;
  sampleRate: number;
  windowSeconds: number;
  disclaimer: string;
}

interface Props {
  onOpenProgram?: (mode: string) => void;
  onRequestAITutor?: (prompt: string) => void;
}

const WAVELENGTH_COPY: Record<string, string> = {
  green: 'Green (~550 nm): haemoglobin absorbs it strongly, but it barely reaches past the superficial capillary plexus - which is exactly why wrist wearables use green.',
  red: 'Red (~660 nm): deeper penetration, weaker absorption. Transmission clips (finger, earlobe, toe) shine red/IR straight through thin tissue; red vs IR absorption ratios are how SpO2 is estimated.',
  infrared: 'Infrared (~880 nm): the deepest reach of the three - the wavelength of choice for bulky reflectance sites like the upper arm and neck.',
};

const SLIDERS: Array<{ key: string; label: string; step: number; hint: string }> = [
  { key: 'heartRate', label: 'Heart rate', step: 1, hint: 'beats/min - sets the beat period' },
  { key: 'perfusion', label: 'Perfusion', step: 1, hint: '% of site baseline - vasoconstriction shrinks the AC pulse' },
  { key: 'compliance', label: 'Vascular compliance', step: 1, hint: 'soft young vessels bounce (deep dicrotic notch); stiff vessels do not' },
  { key: 'respirationRate', label: 'Respiration rate', step: 1, hint: 'breaths/min - breathing rocks the baseline and modulates amplitude' },
  { key: 'motion', label: 'Motion', step: 1, hint: '% - artefact that swamps the pulse, worst on reflectance sites' },
  { key: 'skinTone', label: 'Skin tone (Fitzpatrick)', step: 1, hint: 'I-VI - affects reflectance-mode SNR, barely touches transmission' },
];

export default function PulseLabView({ onOpenProgram, onRequestAITutor }: Props) {
  const [meta, setMeta] = useState<SitesPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [site, setSite] = useState('finger');
  const [wavelength, setWavelength] = useState('red');
  const [values, setValues] = useState<Record<string, number>>({});

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(xrApi('/pleth/sites'), { headers: xrAuthHeaders() });
        const body = (await res.json()) as SitesPayload;
        if (!alive || !body?.success) return;
        setMeta(body);
        setValues({ ...body.defaults });
      } catch {
        if (alive) setLoadError('Pulse Lab could not reach the KEV backend.');
      }
    })();
    return () => { alive = false; };
  }, []);

  const activeSite = useMemo(
    () => meta?.sites.find((s) => s.id === site) ?? null,
    [meta, site],
  );

  const params = useMemo<PlethParams>(() => ({
    site,
    wavelength,
    heartRate: values.heartRate,
    perfusion: values.perfusion,
    compliance: values.compliance,
    respirationRate: values.respirationRate,
    motion: values.motion,
    skinTone: values.skinTone,
  }), [site, wavelength, values]);

  const setVal = (key: string, v: number) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const limits = meta?.limits ?? {};
  const isReflectance = activeSite?.mode === 'reflectance';
  const tone = values.skinTone ?? 3;

  if (loadError) {
    return (
      <div className="p-4 text-sm text-rose-300">
        <p>{loadError}</p>
        <button
          type="button"
          className="mt-2 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
          onClick={() => onOpenProgram?.('challenge')}
        >
          Back to Twin Challenge
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold tracking-wide text-rose-200">
          Pulse Lab - Photoplethysmography Bench
        </h2>
        <p className="mt-0.5 max-w-3xl text-xs text-slate-400">
          An LED and a photodetector, worn on the skin, watching blood volume
          pulse through tissue. Choose where to sense, which light to use, and
          whose physiology to simulate - the waveform is generated
          server-side by the same deterministic engine the Twin Challenge
          twins are scored against.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Left: controls + strip chart */}
        <div className="space-y-3">
          {/* Sensor site picker */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Sensor site
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(meta?.sites ?? []).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSite(s.id);
                    // Sensible wavelength pairing per mode, still fully changeable.
                    setWavelength(s.mode === 'transmission' ? 'red' : 'green');
                  }}
                  className={`rounded-full border px-3 py-1 text-[11px] transition ${
                    site === s.id
                      ? 'border-rose-400 bg-rose-600/20 text-rose-100'
                      : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                  title={`${s.mode} mode - ${s.blurb}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Wavelength picker */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              LED wavelength
            </p>
            <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
              {(meta?.wavelengths ?? []).map((wl) => (
                <button
                  key={wl.id}
                  type="button"
                  onClick={() => setWavelength(wl.id)}
                  className={`px-3 py-1 text-[11px] transition ${
                    wavelength === wl.id
                      ? 'bg-rose-600/30 font-semibold text-rose-100'
                      : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {wl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Waveform */}
          <PlethStrip params={params} height={210} />

          {/* Physiology sliders */}
          <div className="grid gap-x-5 gap-y-2.5 sm:grid-cols-2">
            {SLIDERS.map((s) => {
              const [min, max] = limits[s.key] ?? [0, 100];
              const v = values[s.key];
              if (v === undefined) return null;
              return (
                <label key={s.key} className="block text-xs" title={s.hint}>
                  <span className="mb-1 flex items-baseline justify-between text-slate-300">
                    <span>{s.label}</span>
                    <span className="tabular-nums text-cyan-300">{v}</span>
                  </span>
                  <input
                    type="range"
                    className="w-full accent-rose-500"
                    min={min}
                    max={max}
                    step={s.step}
                    value={v}
                    onChange={(e) => setVal(s.key, Number(e.target.value))}
                  />
                  <span className="flex justify-between text-[9px] text-slate-600">
                    <span>{min}</span>
                    <span className="px-1 text-slate-500">{s.hint}</span>
                    <span>{max}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Right: interpretation panel */}
        <div className="space-y-3">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Reading the trace
            </h3>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-300">
              <li><span className="text-cyan-300">Systolic upstroke</span> - the tall first wave: ventricular ejection pushing volume into the site.</li>
              <li><span className="text-cyan-300">Dicrotic notch</span> - the small dip as the aortic valve snaps shut. Deep in soft, compliant vessels; it flattens away in stiff ones (watch compliance).</li>
              <li><span className="text-cyan-300">Diastolic re-reflection</span> - the second bump: pressure waves bouncing back from downstream resistance.</li>
              <li><span className="text-cyan-300">Baseline wander</span> - slow rocking from breathing: vessels squeeze a little on every inhale.</li>
              <li><span className="text-cyan-300">Motion artefact</span> - ragged noise that can swallow the pulse entirely; the #1 enemy of wrist wearables.</li>
            </ul>
          </div>

          {activeSite && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                {activeSite.label}
                <span className="ml-2 rounded-full border border-slate-700 px-2 py-0.5 text-[9px] font-normal uppercase tracking-wide text-slate-300">
                  {activeSite.mode}
                </span>
              </h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{activeSite.blurb}</p>
              <p className="mt-2 text-[10px] text-slate-500">
                {activeSite.atlasPartId ? (
                  <>
                    Arterial anchor: <span className="text-slate-300">{activeSite.atlasPartName}</span>{' '}
                    (<span className="font-mono text-slate-400">{activeSite.atlasPartId}</span>)
                  </>
                ) : (
                  <>
                    No named artery anchors this site - the earlobe is a capillary
                    bed, and this lab says so rather than inventing one.
                  </>
                )}
                {' '}Anatomy labels from{' '}
                <a
                  href="https://bodyparts3d.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 underline hover:text-cyan-300"
                >
                  BodyParts3D 4.0
                </a>{' '}
                by the DBCLS, CC BY 4.0.
              </p>
            </div>
          )}

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Why {wavelength === 'infrared' ? 'infrared' : wavelength} light?
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
              {WAVELENGTH_COPY[wavelength] ?? ''}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Amplitude depends on how well the light's reach matches the
              tissue depth of the vessels: {activeSite ? activeSite.label.toLowerCase() : 'this site'} is{' '}
              {activeSite ? activeSite.depth.toFixed(1) : '-'} depth units of
              tissue over its arterial bed.
            </p>
          </div>

          <div
            className={`rounded-lg border p-3 ${
              isReflectance && tone >= 4
                ? 'border-amber-700/60 bg-amber-950/30'
                : 'border-slate-800 bg-slate-900/60'
            }`}
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-200">
              Equity note: melanin and signal quality
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">
              Reflectance-mode signals trend weaker and noisier as Fitzpatrick
              tone rises (I to VI) - a documented pulse-oximetry equity gap,
              not a property of any one person's circulation. Transmission
              clips barely change. Try it: set tone to VI here
              {isReflectance ? '' : ', then switch to the finger clip'} and watch
              the quality metric.
            </p>
            {!isReflectance && (
              <p className="mt-1.5 text-[10px] text-slate-500">
                Current site is transmission mode - tone is nearly irrelevant,
                which is part of why hospital clips use it.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-cyan-800/70 bg-cyan-900/25 px-3 py-1.5 text-[11px] font-semibold text-cyan-200 transition hover:bg-cyan-900/40"
              onClick={() => onOpenProgram?.('challenge')}
              title="Open the Twin Challenge hub - the PPG twins live there"
            >
              Take a Pulse Twin Challenge
            </button>
            {onRequestAITutor && (
              <button
                type="button"
                className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition hover:bg-slate-800"
                onClick={() =>
                  onRequestAITutor(
                    `I am in the Pulse Lab simulating a PPG waveform at the ${activeSite?.label ?? site} ` +
                    `(${activeSite?.mode ?? ''} mode) with ${wavelength} light: heart rate ${values.heartRate ?? '?'}, ` +
                    `perfusion ${values.perfusion ?? '?'}%, compliance ${values.compliance ?? '?'}%, motion ${values.motion ?? '?'}%. ` +
                    'Help me interpret the waveform morphology and what the metrics mean.',
                  )
                }
              >
                Ask the tutor about this trace
              </button>
            )}
          </div>

          {meta && (
            <p className="text-[9px] leading-relaxed text-slate-600">
              {meta.disclaimer} Engine: deterministic KEV PPG model,{' '}
              {meta.sampleRate} samples/s over {meta.windowSeconds}s - not a
              medical device.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
