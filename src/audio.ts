import { config, ticks } from './sim/config';
import type { State } from './sim/types';

const SCALE = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22]; // mineur pentatonisch over twee octaven
const grid = 0.25; // noten vallen op een raster van een kwart seconde

function seedSemitone(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 12;
}

/** Klein generatief geluid: noten bij afleveringen, een toonladder uit de seed, een pad dat met de spanning meeklinkt. */
export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private padFilter!: BiquadFilterNode;
  private padGain!: GainNode;
  private muted = false;
  private tension = 0;
  private prev = { score: 0, over: false, ringing: false, choice: false, cycling: 0, seed: '' };
  private root = 196;

  /** Moet vanuit een gebruikersactie komen, anders blokkeert de browser de AudioContext. */
  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(ctx.destination);
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0;
    this.padFilter.connect(this.padGain).connect(this.master);
    for (const [ratio, detune] of [[0.5, -6], [0.75, 5]] as const) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = this.root * ratio;
      o.detune.value = detune;
      o.connect(this.padFilter);
      o.start();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  private note(freq: number, len: number, type: OscillatorType, vol: number, quantise = true) {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    const t = quantise ? Math.ceil(now / grid) * grid : now;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + len + 0.05);
  }

  /** Leest alleen de state; de sim weet niets van geluid. */
  update(s: State) {
    if (!this.ctx) return;
    if (s.seed !== this.prev.seed) {
      this.root = 196 * 2 ** (seedSemitone(s.seed) / 12);
      this.prev = { score: s.score, over: s.over, ringing: false, choice: false, cycling: 0, seed: s.seed };
    }
    const freq = (i: number) => this.root * 2 ** ((SCALE[i % SCALE.length]!) / 12);

    if (s.score > this.prev.score) this.note(freq(s.score * 3), 0.7, 'triangle', 0.25);
    const cycling = s.locks.filter((l) => l.cycleLeft > 0).length;
    if (cycling > this.prev.cycling) this.note(this.root / 2, 0.5, 'sine', 0.3, false);
    const ringing = s.quays.some((q) => q.ring > 0);
    if (ringing && !this.prev.ringing) this.note(this.root * 2, 0.2, 'square', 0.08, false);
    if (s.choice && !this.prev.choice) {
      this.note(freq(4), 0.5, 'sine', 0.2);
      this.note(freq(7), 0.7, 'sine', 0.2);
    }
    if (s.over && !this.prev.over) this.note(this.root / 2, 1.5, 'triangle', 0.3, false);
    this.prev = { ...this.prev, score: s.score, over: s.over, ringing, choice: s.choice !== null, cycling };

    // spanning 0..1: hoe dichter het volste quay bij zijn grens zit
    const ringTicks = ticks(config.ringSeconds);
    const target = Math.max(0, ...s.quays.map((q) => Math.max(q.pending / (config.quayCapacity + 1), q.ring / ringTicks)));
    this.tension += (Math.min(1, target) - this.tension) * 0.02;
    const t = this.ctx.currentTime;
    this.padFilter.frequency.setTargetAtTime(200 + this.tension * 1800, t, 0.3);
    this.padGain.gain.setTargetAtTime(s.over ? 0 : 0.015 + this.tension * 0.05, t, 0.3);
  }
}
