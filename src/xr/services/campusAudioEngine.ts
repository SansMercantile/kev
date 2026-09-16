/**
 * KEV Virtual Campus Background Audio Engine
 * Provides synthesized atmospheric soundscapes for the 3D virtual campus,
 * including auditorium chatter, cleanroom lab whirring, atrium biophilic resonance,
 * and seasonal holiday acoustic accents.
 * 
 * Implemented using Web Audio API so it requires zero external audio files.
 */

export interface AudioEngineSettings {
  masterVolume: number; // 0.0 to 1.0
  isMuted: boolean;
  auditoriumChatterEnabled: boolean;
  labWhirringEnabled: boolean;
  atriumAmbienceEnabled: boolean;
  seasonalSoundscapeEnabled: boolean;
}

type AudioListener = (settings: AudioEngineSettings) => void;

class CampusAudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isRunning = false;

  // Audio Nodes
  private masterGain: GainNode | null = null;
  private chatterGain: GainNode | null = null;
  private labWhirGain: GainNode | null = null;
  private atriumGain: GainNode | null = null;
  private seasonalGain: GainNode | null = null;

  // Generators
  private chatterSource: AudioNode | null = null;
  private labWhirSource: AudioNode | null = null;
  private atriumSource: AudioNode | null = null;
  private seasonalSource: AudioNode | null = null;

  // Active settings
  private settings: AudioEngineSettings = {
    masterVolume: 0.35,
    isMuted: false,
    auditoriumChatterEnabled: true,
    labWhirringEnabled: true,
    atriumAmbienceEnabled: true,
    seasonalSoundscapeEnabled: true,
  };

  private listeners: Set<AudioListener> = new Set();
  private currentSeasonTheme: string = 'academic';

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    try {
      const savedVol = localStorage.getItem('kev_campus_audio_volume');
      if (savedVol !== null) {
        const num = parseFloat(savedVol);
        if (!isNaN(num) && num >= 0 && num <= 1) {
          this.settings.masterVolume = num;
        }
      }

      const savedMute = localStorage.getItem('kev_campus_audio_muted');
      if (savedMute !== null) {
        this.settings.isMuted = savedMute === 'true';
      }
    } catch (_) {}
  }

  private persistSettings() {
    try {
      localStorage.setItem('kev_campus_audio_volume', this.settings.masterVolume.toString());
      localStorage.setItem('kev_campus_audio_muted', this.settings.isMuted.toString());
    } catch (_) {}
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.settings }));
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.settings });
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getSettings(): AudioEngineSettings {
    return { ...this.settings };
  }

  public setMasterVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.settings.masterVolume = clamped;
    this.applyGains();
    this.persistSettings();
    this.notify();
  }

  public toggleMute() {
    this.settings.isMuted = !this.settings.isMuted;
    this.applyGains();
    this.persistSettings();
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.settings.isMuted = muted;
    this.applyGains();
    this.persistSettings();
    this.notify();
  }

  public toggleChannel(channel: keyof Omit<AudioEngineSettings, 'masterVolume' | 'isMuted'>) {
    this.settings[channel] = !this.settings[channel];
    this.applyGains();
    this.notify();
  }

  public setSeasonTheme(theme: string) {
    this.currentSeasonTheme = theme;
    if (this.isRunning && this.ctx) {
      this.rebuildSeasonalSoundscape();
    }
  }

  /**
   * Adjust spatial mix dynamically based on player position in the 3D campus.
   * x, z are coordinates in meters (center atrium is 0, 0, wings are ~18m out).
   */
  public updateSpatialPosition(x: number, z: number) {
    if (!this.isRunning || !this.ctx) return;

    const distFromCenter = Math.hypot(x, z);
    const now = this.ctx.currentTime;

    // Center atrium (0, 0): Auditorium chatter and atrium resonance are prominent
    // Wings (>10m): Lab whirring increases
    const atriumRatio = Math.max(0, 1 - distFromCenter / 20);
    const labRatio = Math.min(1, distFromCenter / 16);

    if (this.chatterGain && this.settings.auditoriumChatterEnabled) {
      const targetChatter = this.settings.isMuted ? 0 : 0.08 * atriumRatio * this.settings.masterVolume;
      this.chatterGain.gain.setTargetAtTime(targetChatter, now, 0.2);
    }

    if (this.labWhirGain && this.settings.labWhirringEnabled) {
      const targetLab = this.settings.isMuted ? 0 : (0.04 + 0.12 * labRatio) * this.settings.masterVolume;
      this.labWhirGain.gain.setTargetAtTime(targetLab, now, 0.2);
    }
  }

  private applyGains() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const effectiveVol = this.settings.isMuted ? 0 : this.settings.masterVolume;

    this.masterGain.gain.setTargetAtTime(effectiveVol, now, 0.1);

    if (this.atriumGain) {
      const g = this.settings.atriumAmbienceEnabled ? 0.09 : 0;
      this.atriumGain.gain.setTargetAtTime(g, now, 0.1);
    }

    if (this.seasonalGain) {
      const g = this.settings.seasonalSoundscapeEnabled ? 0.05 : 0;
      this.seasonalGain.gain.setTargetAtTime(g, now, 0.1);
    }
  }

  /**
   * Start the atmospheric soundscape
   */
  public async start(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass();
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      if (!this.isInitialized) {
        this.buildAudioGraph();
        this.isInitialized = true;
      }

      this.isRunning = true;
      this.applyGains();
      return true;
    } catch (e) {
      console.warn('CampusAudioEngine autoplay prevented or unsupported:', e);
      return false;
    }
  }

  public stop() {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend();
    }
    this.isRunning = false;
  }

  public playInteractiveKioskChime() {
    if (!this.ctx || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12 * this.settings.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }

  public playPortalWarpSound() {
    if (!this.ctx || this.settings.isMuted) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.32);

      gain.gain.setValueAtTime(0.18 * this.settings.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (_) {}
  }

  private buildAudioGraph() {
    if (!this.ctx) return;

    // Master bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.settings.isMuted ? 0 : this.settings.masterVolume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Soft Auditorium Murmur / Chatter
    this.buildAuditoriumChatter();

    // 2. Cleanroom & Lab Whirring / Fan Hum
    this.buildLabWhirring();

    // 3. Atrium Biophilic Resonance
    this.buildAtriumAmbience();

    // 4. Seasonal Atmospheric Soundscape
    this.rebuildSeasonalSoundscape();
  }

  private createPinkNoiseBuffer(seconds: number = 4): AudioBuffer {
    if (!this.ctx) throw new Error('No context');
    const bufferSize = this.ctx.sampleRate * seconds;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private buildAuditoriumChatter() {
    if (!this.ctx || !this.masterGain) return;

    try {
      const noiseBuffer = this.createPinkNoiseBuffer(5);
      const source = this.ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      // Bandpass filter to simulate muffled human vocal presence (250Hz - 1200Hz)
      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(480, this.ctx.currentTime);
      bandpass.Q.setValueAtTime(1.8, this.ctx.currentTime);

      // Lowpass to soften
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1100, this.ctx.currentTime);

      // Subtle LFO modulation to simulate ebb and flow of crowd murmurs
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.18, this.ctx.currentTime); // gentle wave every 5s
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

      this.chatterGain = this.ctx.createGain();
      this.chatterGain.gain.setValueAtTime(0.07, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(this.chatterGain.gain);

      source.connect(bandpass);
      bandpass.connect(lowpass);
      lowpass.connect(this.chatterGain);
      this.chatterGain.connect(this.masterGain);

      source.start();
      lfo.start();
      this.chatterSource = source;
    } catch (_) {}
  }

  private buildLabWhirring() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // 1. Low frequency motor / chiller hum (60Hz & 120Hz)
      const humOsc = this.ctx.createOscillator();
      humOsc.type = 'sine';
      humOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      const harmonicOsc = this.ctx.createOscillator();
      harmonicOsc.type = 'sine';
      harmonicOsc.frequency.setValueAtTime(120, this.ctx.currentTime);

      // 2. Airflow ventilation whir
      const airBuffer = this.createPinkNoiseBuffer(4);
      const airSource = this.ctx.createBufferSource();
      airSource.buffer = airBuffer;
      airSource.loop = true;

      const airFilter = this.ctx.createBiquadFilter();
      airFilter.type = 'bandpass';
      airFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      airFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      this.labWhirGain = this.ctx.createGain();
      this.labWhirGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      const humMix = this.ctx.createGain();
      humMix.gain.setValueAtTime(0.3, this.ctx.currentTime);
      humOsc.connect(humMix);
      harmonicOsc.connect(humMix);

      const airMix = this.ctx.createGain();
      airMix.gain.setValueAtTime(0.25, this.ctx.currentTime);
      airSource.connect(airFilter);
      airFilter.connect(airMix);

      humMix.connect(this.labWhirGain);
      airMix.connect(this.labWhirGain);
      this.labWhirGain.connect(this.masterGain);

      humOsc.start();
      harmonicOsc.start();
      airSource.start();
      this.labWhirSource = this.labWhirGain;
    } catch (_) {}
  }

  private buildAtriumAmbience() {
    if (!this.ctx || !this.masterGain) return;

    try {
      // Subdued deep architectural resonance (sub-bass 48Hz with slow breathing envelope)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(48, this.ctx.currentTime);

      this.atriumGain = this.ctx.createGain();
      this.atriumGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      subOsc.connect(this.atriumGain);
      this.atriumGain.connect(this.masterGain);

      subOsc.start();
      this.atriumSource = subOsc;
    } catch (_) {}
  }

  private rebuildSeasonalSoundscape() {
    if (!this.ctx || !this.masterGain) return;

    // Disconnect old seasonal source if active
    if (this.seasonalSource) {
      try {
        (this.seasonalSource as AudioNode).disconnect();
      } catch (_) {}
      this.seasonalSource = null;
    }

    this.seasonalGain = this.ctx.createGain();
    this.seasonalGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    this.seasonalGain.connect(this.masterGain);

    try {
      if (this.currentSeasonTheme === 'halloween') {
        // Hollow wind draft + eerie harmonic overtone (A3 / 220Hz resonant band)
        const windNoise = this.ctx.createBufferSource();
        windNoise.buffer = this.createPinkNoiseBuffer(4);
        windNoise.loop = true;

        const windFilter = this.ctx.createBiquadFilter();
        windFilter.type = 'bandpass';
        windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
        windFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

        windNoise.connect(windFilter);
        windFilter.connect(this.seasonalGain);
        windNoise.start();
        this.seasonalSource = windNoise;
      } else if (this.currentSeasonTheme === 'christmas') {
        // Soft high crystalline shimmer / festive overtone
        const shimmerOsc = this.ctx.createOscillator();
        shimmerOsc.type = 'sine';
        shimmerOsc.frequency.setValueAtTime(1046.5, this.ctx.currentTime); // C6

        const shimmerLfo = this.ctx.createOscillator();
        shimmerLfo.frequency.setValueAtTime(0.3, this.ctx.currentTime);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.025, this.ctx.currentTime);

        shimmerLfo.connect(lfoGain);
        lfoGain.connect(subGain.gain);

        shimmerOsc.connect(subGain);
        subGain.connect(this.seasonalGain);

        shimmerOsc.start();
        shimmerLfo.start();
        this.seasonalSource = shimmerOsc;
      } else if (this.currentSeasonTheme === 'easter') {
        // Vernal warmth: soft harmonic chord pulse (523.25Hz C5)
        const springOsc = this.ctx.createOscillator();
        springOsc.type = 'sine';
        springOsc.frequency.setValueAtTime(523.25, this.ctx.currentTime);

        const springGain = this.ctx.createGain();
        springGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

        springOsc.connect(springGain);
        springGain.connect(this.seasonalGain);
        springOsc.start();
        this.seasonalSource = springOsc;
      } else if (this.currentSeasonTheme === 'thanksgiving') {
        // Warm hearth resonance (146.83Hz D3)
        const harvestOsc = this.ctx.createOscillator();
        harvestOsc.type = 'triangle';
        harvestOsc.frequency.setValueAtTime(146.83, this.ctx.currentTime);

        const harvestFilter = this.ctx.createBiquadFilter();
        harvestFilter.type = 'lowpass';
        harvestFilter.frequency.setValueAtTime(260, this.ctx.currentTime);

        harvestOsc.connect(harvestFilter);
        harvestFilter.connect(this.seasonalGain);
        harvestOsc.start();
        this.seasonalSource = harvestOsc;
      }
    } catch (_) {}
  }
}

export const campusAudio = new CampusAudioEngine();
