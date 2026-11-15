import { planCrystalBellChimes } from './crystalBells';
import { MUSIC_BAR_SECONDS, MusicNote, planMusicBar } from './music';
import { getSettings, subscribeSettings, updateSettings } from './settings';
import { SpecialType } from './types';

// Pentatonic C-major scale frequencies for satisfying ascending cascade chimes
const CASCADE_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

// The effect gains below were tuned with the bus at 1.0; the default effects
// volume (0.8) maps back to exactly that level.
const SFX_BUS_SCALE = 1.25;
const MUSIC_BUS_SCALE = 1.0;
/** How far ahead of the audio clock music bars are scheduled. */
const MUSIC_LOOKAHEAD_SECONDS = 1.5;
const MUSIC_TICK_MS = 400;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private musicPadInput: AudioNode | null = null;
  private musicMelodyInput: AudioNode | null = null;

  private musicWanted = false;
  private musicTimer: number | null = null;
  private nextBarTime = 0;
  private barIndex = 0;

  constructor() {
    subscribeSettings(() => this.applySettings());
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => this.handleVisibility());
    }
  }

  private get muted(): boolean {
    return getSettings().muted;
  }

  private isHidden(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'hidden';
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
        this.buildGraph(this.ctx);
      } catch {
        this.ctx = null;
        return null;
      }
    }
    if (this.ctx.state === 'suspended' && !this.isHidden()) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private buildGraph(ctx: AudioContext): void {
    const settings = getSettings();

    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = settings.sfxVolume * SFX_BUS_SCALE;
    this.sfxBus.connect(ctx.destination);

    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 0;
    this.musicBus.connect(ctx.destination);

    // Pads go through a low-pass so they sit behind the effects.
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 1300;
    padFilter.Q.value = 0.4;
    padFilter.connect(this.musicBus);
    this.musicPadInput = padFilter;

    // Melody gets a soft feedback echo for a sense of space.
    const melodyIn = ctx.createGain();
    melodyIn.connect(this.musicBus);
    const delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.45;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    melodyIn.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(this.musicBus);
    this.musicMelodyInput = melodyIn;
  }

  /** Where one-shot effects connect: the effects bus, or the raw output as a fallback. */
  private sfxOut(ctx: AudioContext): AudioNode {
    return this.sfxBus ?? ctx.destination;
  }

  private applySettings(): void {
    const settings = getSettings();
    if (this.ctx && this.sfxBus) {
      this.sfxBus.gain.setTargetAtTime(
        settings.sfxVolume * SFX_BUS_SCALE,
        this.ctx.currentTime,
        0.03
      );
    }
    this.syncMusic();
  }

  private handleVisibility(): void {
    if (!this.ctx) return;
    if (this.isHidden()) {
      // Stop everything (effects mid-flight and music) while the tab is in the background.
      this.stopMusicScheduler(0.05);
      this.ctx.suspend().catch(() => {});
    } else {
      if (!this.muted) this.ctx.resume().catch(() => {});
      this.syncMusic();
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(next: boolean): void {
    updateSettings({ muted: next });
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) this.playClick();
    return this.muted;
  }

  /**
   * Call from a user gesture (browsers block audio before one). Creates the
   * audio context and starts the background music if it is enabled.
   */
  unlock(): void {
    this.musicWanted = true;
    this.syncMusic();
  }

  private syncMusic(): void {
    const settings = getSettings();
    const shouldPlay =
      this.musicWanted && !settings.muted && settings.musicVolume > 0 && !this.isHidden();
    if (!shouldPlay) {
      this.stopMusicScheduler(0.4);
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.musicBus) return;
    this.musicBus.gain.setTargetAtTime(
      settings.musicVolume * MUSIC_BUS_SCALE,
      ctx.currentTime,
      0.25
    );
    if (this.musicTimer === null) {
      this.nextBarTime = ctx.currentTime + 0.15;
      this.musicTimer = window.setInterval(() => this.scheduleMusic(), MUSIC_TICK_MS);
      this.scheduleMusic();
    }
  }

  private stopMusicScheduler(fadeSeconds: number): void {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.ctx && this.musicBus) {
      // Already-scheduled notes fade out with the bus instead of being cut.
      this.musicBus.gain.setTargetAtTime(0, this.ctx.currentTime, Math.max(0.01, fadeSeconds / 3));
    }
  }

  private scheduleMusic(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    // After a long pause, skip ahead instead of stacking missed bars.
    if (this.nextBarTime < ctx.currentTime) this.nextBarTime = ctx.currentTime + 0.1;
    while (this.nextBarTime < ctx.currentTime + MUSIC_LOOKAHEAD_SECONDS) {
      const bar = planMusicBar(this.barIndex);
      for (const note of bar.pad) this.playPadNote(ctx, note, this.nextBarTime);
      for (const note of bar.melody) this.playMelodyNote(ctx, note, this.nextBarTime);
      this.nextBarTime += MUSIC_BAR_SECONDS;
      this.barIndex += 1;
    }
  }

  private playPadNote(ctx: AudioContext, note: MusicNote, barStart: number): void {
    if (!this.musicPadInput) return;
    const at = barStart + note.start;
    const end = at + note.duration;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(note.gain, at + 1.8);
    gain.gain.setValueAtTime(note.gain, Math.max(at + 1.8, end - 2.6));
    gain.gain.linearRampToValueAtTime(0.0001, end);
    gain.connect(this.musicPadInput);

    // Two slightly detuned voices give the pad a slow, warm shimmer.
    for (const [type, detune, level] of [
      ['sine', -4, 1],
      ['triangle', 5, 0.45],
    ] as Array<[OscillatorType, number, number]>) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(note.freq, at);
      osc.detune.setValueAtTime(detune, at);
      const voice = ctx.createGain();
      voice.gain.value = level;
      osc.connect(voice);
      voice.connect(gain);
      osc.start(at);
      osc.stop(end + 0.05);
    }
  }

  private playMelodyNote(ctx: AudioContext, note: MusicNote, barStart: number): void {
    if (!this.musicMelodyInput) return;
    const at = barStart + note.start;
    const end = at + note.duration;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(note.gain, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(this.musicMelodyInput);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, at);
    osc.connect(gain);
    osc.start(at);
    osc.stop(end + 0.05);

    // Quiet octave partial for a glassy, music-box colour.
    const partial = ctx.createOscillator();
    const partialGain = ctx.createGain();
    partial.type = 'sine';
    partial.frequency.setValueAtTime(note.freq * 2, at);
    partialGain.gain.setValueAtTime(0.0001, at);
    partialGain.gain.linearRampToValueAtTime(note.gain * 0.18, at + 0.02);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, at + note.duration * 0.5);
    partial.connect(partialGain);
    partialGain.connect(this.musicMelodyInput);
    partial.start(at);
    partial.stop(at + note.duration * 0.5 + 0.05);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainPeak = 0.12,
    delay = 0,
    freqEnd?: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxOut(ctx));
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playCrystalBellStrike(
    freq: number,
    overtoneRatio: number,
    duration: number,
    gainPeak: number,
    delay: number,
    pan: number
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const out = this.sfxOut(ctx);
    const destination: AudioNode =
      typeof ctx.createStereoPanner === 'function'
        ? (() => {
            const panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(pan, now);
            panner.connect(out);
            return panner;
          })()
        : out;

    // 1. Pure glassy crystal fundamental
    const fundamentalOsc = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    fundamentalOsc.type = 'sine';
    fundamentalOsc.frequency.setValueAtTime(freq, now);
    fundamentalGain.gain.setValueAtTime(0.0001, now);
    fundamentalGain.gain.linearRampToValueAtTime(gainPeak, now + 0.008);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    fundamentalOsc.connect(fundamentalGain);
    fundamentalGain.connect(destination);
    fundamentalOsc.start(now);
    fundamentalOsc.stop(now + duration + 0.03);

    // 2. Soft octave shimmer partial
    const octaveOsc = ctx.createOscillator();
    const octaveGain = ctx.createGain();
    octaveOsc.type = 'sine';
    octaveOsc.frequency.setValueAtTime(freq * 2, now);
    octaveGain.gain.setValueAtTime(0.0001, now);
    octaveGain.gain.linearRampToValueAtTime(gainPeak * 0.22, now + 0.006);
    octaveGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.55);
    octaveOsc.connect(octaveGain);
    octaveGain.connect(destination);
    octaveOsc.start(now);
    octaveOsc.stop(now + duration * 0.55 + 0.03);

    // 3. Crystalline bell inharmonic partial (~2.76x) with brief glassy strike
    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(freq * overtoneRatio, now);
    bellGain.gain.setValueAtTime(0.0001, now);
    bellGain.gain.linearRampToValueAtTime(gainPeak * 0.26, now + 0.005);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.36);
    bellOsc.connect(bellGain);
    bellGain.connect(destination);
    bellOsc.start(now);
    bellOsc.stop(now + duration * 0.36 + 0.03);
  }

  playClick(): void {
    this.playTone(620, 0.06, 'sine', 0.07, 0, 740);
  }

  playSwap(): void {
    this.playTone(320, 0.08, 'triangle', 0.08, 0, 440);
  }

  playInvalidSwap(): void {
    this.playTone(210, 0.11, 'sawtooth', 0.06, 0, 150);
    this.playTone(170, 0.12, 'sawtooth', 0.05, 0.07, 130);
  }

  playMatch(cascadeIndex: number, matchCount: number): void {
    const idx = Math.min(cascadeIndex - 1, CASCADE_FREQS.length - 1);
    const base = CASCADE_FREQS[Math.max(0, idx)];
    const jitter = 0.98 + Math.random() * 0.04;
    this.playTone(base * jitter, 0.22, 'triangle', 0.12);
    this.playTone(base * 1.5 * jitter, 0.18, 'sine', 0.06, 0.03);
    if (matchCount >= 4) {
      this.playTone(base * 2 * jitter, 0.26, 'sine', 0.07, 0.06);
    }
  }

  playCascadeCrystalBells(cascadeIndex: number): void {
    if (this.muted) return;
    const notes = planCrystalBellChimes(cascadeIndex);
    for (const note of notes) {
      this.playCrystalBellStrike(
        note.freq,
        note.overtoneRatio,
        note.duration,
        note.gain,
        note.delay,
        note.pan
      );
    }
  }

  playSpecialCreate(special: SpecialType): void {
    if (special === 'none') return;
    const notes =
      special === 'prism'
        ? [523.25, 659.25, 783.99, 1046.5, 1318.51]
        : special === 'nova'
        ? [440, 554.37, 659.25, 880]
        : special === 'scout'
        ? [659.25, 987.77, 1318.51]
        : [587.33, 880];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'sine', 0.09, i * 0.04);
    });
  }

  playBlast(kind: 'beam' | 'nova' | 'prism' | 'crack' | 'scout'): void {
    if (kind === 'scout') {
      // A quick upward whoosh followed by two chirps as the scout lands.
      this.playTone(420, 0.2, 'sine', 0.07, 0, 1500);
      this.playTone(1760, 0.06, 'triangle', 0.06, 0.17);
      this.playTone(2093, 0.08, 'triangle', 0.06, 0.24);
      return;
    }
    if (kind === 'crack') {
      this.playTone(260, 0.09, 'square', 0.06, 0, 110);
      return;
    }
    if (kind === 'beam') {
      this.playTone(980, 0.2, 'sawtooth', 0.07, 0, 280);
      return;
    }
    if (kind === 'nova') {
      this.playTone(220, 0.28, 'triangle', 0.14, 0, 65);
      this.playTone(660, 0.22, 'sine', 0.08, 0.02, 220);
      return;
    }
    // prism
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.playTone(freq, 0.34, 'triangle', 0.09, i * 0.045);
    });
  }

  playVictory(): void {
    const chord = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    chord.forEach((f, i) => {
      this.playTone(f, 0.42, 'triangle', 0.11, i * 0.08);
    });
  }

  playGameOver(): void {
    const desc = [392.0, 349.23, 311.13, 261.63];
    desc.forEach((f, i) => {
      this.playTone(f, 0.32, 'triangle', 0.09, i * 0.1);
    });
  }
}

export const soundEngine = new SoundEngine();
