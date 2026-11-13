import { planCrystalBellChimes } from './crystalBells';
import { SpecialType } from './types';

// Pentatonic C-major scale frequencies for satisfying ascending cascade chimes
const CASCADE_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('kromatik_muted') : null;
      if (saved === '1') this.muted = true;
    } catch {
      // ignore storage errors
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(next: boolean): void {
    this.muted = next;
    try {
      window.localStorage.setItem('kromatik_muted', next ? '1' : '0');
    } catch {
      // ignore
    }
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) this.playClick();
    return this.muted;
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
    gain.connect(ctx.destination);
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
    const destination: AudioNode =
      typeof ctx.createStereoPanner === 'function'
        ? (() => {
            const panner = ctx.createStereoPanner();
            panner.pan.setValueAtTime(pan, now);
            panner.connect(ctx.destination);
            return panner;
          })()
        : ctx.destination;

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
        : [587.33, 880];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'sine', 0.09, i * 0.04);
    });
  }

  playBlast(kind: 'beam' | 'nova' | 'prism' | 'crack'): void {
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
