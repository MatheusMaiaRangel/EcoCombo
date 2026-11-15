import { CONAMA_ELEMENTS } from '../constants/recipes.js';

/**
 * Sintetizador de Áudio 100% Procedural via Web Audio API (Seção 5 do Documento Mestre)
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  /**
   * Som ao canalizar uma das 4 cores da reciclagem (1/Q, 2/E, 3/R, 4/F)
   */
  playElementSelect(elementId, slotIndex = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const elem = CONAMA_ELEMENTS[elementId];
    const baseFreq = elem ? elem.freq : 440;
    const freq = slotIndex === 1 ? baseFreq * 1.125 : baseFreq;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = elementId === 'METAL' ? 'sawtooth' : elementId === 'GLASS' ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Som ao formar o Objeto/Conceito/Energia Reciclada (2 elementos combinados)
   */
  playComboReady(recipe, predictedMultiplier = 4.0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const isStale = predictedMultiplier <= 1.0;

    if (isStale) {
      // Som opaco/desgastado alertando que o combo está saturado em 1.0x
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(165, now);
      osc.frequency.linearRampToValueAtTime(115, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }

    // Acorde harmônico brilhante proporcional ao multiplicador
    const notes = [440, 554.37, 659.25];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const pitchBoost = predictedMultiplier >= 4.0 ? 1.15 : 1.0;
      osc.frequency.setValueAtTime(f * pitchBoost, now + idx * 0.03);

      gain.gain.setValueAtTime(0.001, now + idx * 0.03);
      gain.gain.linearRampToValueAtTime(0.09, now + idx * 0.03 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.03 + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.17);
    });
  }

  /**
   * Som ao disparar o objeto/energia na direção do mouse (LMB)
   */
  playShoot(multiplier = 4.0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (multiplier <= 1.0) {
      // Disparo desgastado em 1x (som abafado e grave)
      osc.type = 'square';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.14);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    } else {
      // Disparo energizado (quanto maior o multiplicador, mais brilhante o pulso)
      osc.type = 'sawtooth';
      const startFreq = 260 + multiplier * 95;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.16);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Som ao atingir ou derrotar um "bicho" da poluição na arena
   */
  playEnemyHit(multiplier = 4.0, defeated = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = defeated ? 'triangle' : 'square';
    const base = defeated ? 520 : 300;
    const target = defeated ? 880 * (multiplier >= 4 ? 1.2 : 1.0) : 160;

    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(target, now + (defeated ? 0.22 : 0.09));

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (defeated ? 0.24 : 0.1));

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (defeated ? 0.25 : 0.11));
  }

  /**
   * Som quando um bicho encosta no protagonista (-15% Pureza)
   */
  playPlayerHurt() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(62, now + 0.28);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  }
}
