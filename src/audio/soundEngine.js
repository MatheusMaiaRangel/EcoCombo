import { CONAMA_ELEMENTS } from '../constants/recipes.js';

/**
 * Sintetizador de Áudio 100% Procedural via Web Audio API (Seção 5 do Documento Mestre)
 */
export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = true;
    this.volumePercent = 85;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volumePercent / 100, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volumePercent / 100, this.ctx.currentTime);
    }
    return this.ctx;
  }

  getOutput(ctx) {
    return this.masterGain || ctx.destination;
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    return this.enabled;
  }

  setVolumePercent(percent) {
    this.volumePercent = Math.max(0, Math.min(100, Number(percent) || 0));
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.volumePercent / 100, this.ctx.currentTime);
    }
    return this.volumePercent;
  }

  /**
   * Som curto de clique/interação nos botões do Menu Inicial e Menu de Pausa (ESC)
   */
  playMenuClick(high = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = high ? 587.33 : 440;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.065);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Som ao abrir ou fechar o Menu de Pausa na tecla ESC
   */
  playPauseToggle(paused = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = paused ? [523.25, 392.0] : [392.0, 523.25];
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.055);

      gain.gain.setValueAtTime(0.001, now + idx * 0.055);
      gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.055 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.11);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(now + idx * 0.055);
      osc.stop(now + idx * 0.055 + 0.12);
    });
  }

  /**
   * E4-03 — Som distinto ao selecionar/abrir cada uma das 4 Lixeiras CONAMA (Q/1, E/2, R/3, F/4)
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
    gain.gain.linearRampToValueAtTime(0.13, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.115);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.125);

    // Harmônico sutil para diferenciar ainda mais o timbre de cada material
    const overtone = ctx.createOscillator();
    const overGain = ctx.createGain();
    overtone.type = 'sine';
    const ratio = elementId === 'GLASS' ? 2.0 : elementId === 'METAL' ? 1.5 : 1.25;
    overtone.frequency.setValueAtTime(freq * ratio, now);
    overtone.frequency.exponentialRampToValueAtTime(freq * ratio * 1.15, now + 0.08);

    overGain.gain.setValueAtTime(0.001, now);
    overGain.gain.linearRampToValueAtTime(0.055, now + 0.012);
    overGain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    overtone.connect(overGain);
    overGain.connect(this.getOutput(ctx));
    overtone.start(now);
    overtone.stop(now + 0.105);
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
      gain.connect(this.getOutput(ctx));
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
      gain.connect(this.getOutput(ctx));
      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.17);
    });
  }

  /**
   * E4-03 — Som progressivo ao disparar:
   * - Em 1.0x / combo desgastado: som opaco/abafado (filtro passa-baixas) indicando necessidade de variar
   * - Em multiplicadores altos (>= 4.0x): pulso energizado com camada harmônica brilhante
   */
  playShoot(multiplier = 1.0, isStale = false, binId = null) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const elem = binId ? CONAMA_ELEMENTS[binId] : null;
    const isDull = multiplier <= 1.0 || isStale;

    if (isDull) {
      // Disparo desgastado em 1.0x: filtro passa-baixas para timbre claramente opaco
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isStale ? 320 : 440, now);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isStale ? 155 : 185, now);
      osc.frequency.exponentialRampToValueAtTime(68, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.13, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(now);
      osc.stop(now + 0.18);
      return;
    }

    // Disparo energizado progressivo proporcional ao multiplicador (1.5x até 6.0x)
    const elemPitchOffset = elem ? (elem.freq - 440) * 0.18 : 0;
    const startFreq = Math.max(220, 250 + multiplier * 88 + elemPitchOffset);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = binId === 'GLASS' ? 'triangle' : 'sawtooth';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.15);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.13, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.165);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.175);

    // Em multiplicador >= 4.0x (Rank S/SS/SSS), adiciona camada brilhante aguda
    if (multiplier >= 4.0) {
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(startFreq * 1.5, now);
      shimmer.frequency.exponentialRampToValueAtTime(startFreq * 2.0, now + 0.14);

      sGain.gain.setValueAtTime(0.001, now);
      sGain.gain.linearRampToValueAtTime(0.08, now + 0.012);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      shimmer.connect(sGain);
      sGain.connect(this.getOutput(ctx));
      shimmer.start(now);
      shimmer.stop(now + 0.17);
    }
  }

  /**
   * E4-03 — Som progressivo ao atingir ou purificar inimigos:
   * - Em >= 4.0x (Rank S/SS/SSS): acorde harmônico brilhante (3–4 notas)
   * - Em 2.0x–3.0x: intervalo consonante nítido
   * - Em 1.0x ou lixeira errada: golpe opaco/grave
   */
  playEnemyHit(multiplier = 1.0, defeated = false, binId = null, isMatchingBin = true) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const elem = binId ? CONAMA_ELEMENTS[binId] : null;
    const rootFreq = elem ? elem.freq : 440;

    if (!isMatchingBin) {
      // Erro de lixeira: som opaco dissonante
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(360, now);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.linearRampToValueAtTime(98, now + 0.14);

      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(now);
      osc.stop(now + 0.16);
      return;
    }

    if (multiplier >= 4.0) {
      // E4-03: Multiplicador >= 4.0x toca um acorde brilhante (tríade/tétrade maior cintilante!)
      const scaleBoost = multiplier >= 5.0 ? 1.125 : 1.0;
      const chordRatios = defeated ? [1.0, 1.25, 1.5, 2.0] : [1.0, 1.25, 1.5];
      chordRatios.forEach((ratio, idx) => {
        const t0 = now + idx * 0.022;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === chordRatios.length - 1 ? 'sine' : 'triangle';
        const f = rootFreq * ratio * scaleBoost;
        osc.frequency.setValueAtTime(f, t0);
        if (defeated) {
          osc.frequency.exponentialRampToValueAtTime(f * 1.08, t0 + 0.24);
        }

        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.12 : 0.085, t0 + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + (defeated ? 0.28 : 0.18));

        osc.connect(gain);
        gain.connect(this.getOutput(ctx));
        osc.start(t0);
        osc.stop(t0 + (defeated ? 0.3 : 0.19));
      });
      return;
    }

    if (multiplier >= 2.0) {
      // Multiplicador intermediário (2.0x–3.0x): impacto nítido de 2 notas (tônica + quinta)
      const ratios = defeated ? [1.0, 1.5] : [1.0, 1.25];
      ratios.forEach((ratio, idx) => {
        const t0 = now + idx * 0.025;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = defeated ? 'triangle' : 'square';
        const f = rootFreq * ratio * (defeated ? 1.15 : 0.85);
        osc.frequency.setValueAtTime(f, t0);
        osc.frequency.exponentialRampToValueAtTime(defeated ? f * 1.22 : f * 0.72, t0 + (defeated ? 0.2 : 0.1));

        gain.gain.setValueAtTime(0.001, t0);
        gain.gain.linearRampToValueAtTime(idx === 0 ? 0.11 : 0.075, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + (defeated ? 0.22 : 0.11));

        osc.connect(gain);
        gain.connect(this.getOutput(ctx));
        osc.start(t0);
        osc.stop(t0 + (defeated ? 0.23 : 0.12));
      });
      return;
    }

    // Multiplicador baixo (1.0x–1.5x): som compacto (e filtrado/opaco em 1.0x)
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = defeated ? 'triangle' : 'square';
    const base = defeated ? 440 : 250;
    const target = defeated ? 660 : 135;

    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(target, now + (defeated ? 0.18 : 0.085));

    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (defeated ? 0.2 : 0.095));

    if (multiplier <= 1.0) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);
      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + (defeated ? 0.21 : 0.105));
  }

  /**
   * E4-04 — Cadência descendente sintetizada ao encerrar a partida (Pureza Ambiental 0%)
   */
  playGameOver() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.0, 349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.14;
      const isLast = idx === notes.length - 1;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isLast ? 620 : 950, t0);

      osc.type = isLast ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      if (isLast) {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.88, t0 + 0.55);
      }

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(isLast ? 0.16 : 0.12, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (isLast ? 0.62 : 0.24));

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + (isLast ? 0.65 : 0.26));
    });
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
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.31);
  }

  /**
   * E1-03 — Som seco de impacto quando um projétil se dissipa em um obstáculo 3D sólido
   */
  playObstacleHit() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(85, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.11, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.11);
  }

  /**
   * E3-04 — Fanfarra cristalina ao completar 4 combos inéditos seguidos (Maestria Elemental +10% Pureza)
   */
  playMasteryPulse() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [392.0, 493.88, 587.33, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx >= 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.04, t0 + 0.28);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(idx === notes.length - 1 ? 0.16 : 0.12, t0 + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (idx === notes.length - 1 ? 0.52 : 0.26));

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + (idx === notes.length - 1 ? 0.55 : 0.28));
    });
  }

  /**
   * E2-06 / E2-03 — Fanfarra ascendente sintetizada ao avançar para o Estágio 2 (01:30) ou Estágio 3 (03:00)
   */
  playStageTransition(stage = 2) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes =
      stage >= 3
        ? [440.0, 554.37, 659.25, 880.0, 1108.73]
        : [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.085;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (idx === notes.length - 1) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.03, t0 + 0.32);
      }

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(idx === notes.length - 1 ? 0.16 : 0.11, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (idx === notes.length - 1 ? 0.44 : 0.16));

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + (idx === notes.length - 1 ? 0.46 : 0.18));
    });
  }

  /**
   * E2-04 — Som metálico de resistência quando um ataque direto acerta um Inimigo Blindado (-50% dano)
   */
  playArmorDeflect() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [320, 485].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'square';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.62, now + 0.12);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.12 : 0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(now);
      osc.stop(now + 0.14);
    });
  }

  /**
   * E2-04 — Som cristalino de quebra de blindagem ao usar Controle de Grupo [E]
   */
  playArmorBreak() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.12, t0 + 0.16);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.14, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.2);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + 0.22);
    });
  }

  /**
   * E4-07 — Som suave de tecla bloqueada durante uma etapa do Tutorial Interativo
   */
  playBlockedKey() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(125, now + 0.08);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.095);
  }

  /**
   * E4-07 — Som positivo ao concluir uma etapa do Tutorial Interativo
   */
  playTutorialStepComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.065;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.11, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + 0.19);
    });
  }

  /**
   * E4-07 — Fanfarra curta ao concluir todo o Tutorial Interativo
   */
  playTutorialComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const t0 = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx >= 3 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.12, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + (idx === notes.length - 1 ? 0.45 : 0.2));

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + (idx === notes.length - 1 ? 0.48 : 0.22));
    });
  }

  /**
   * E4-08 — Pulso delicado estilo visual novel / pixel RPG durante a digitação da legenda da Cutscene
   */
  playCutsceneBlip(pitchShift = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const base = 420 + (pitchShift % 4) * 28;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.92, now + 0.032);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.035, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.036);

    osc.connect(gain);
    gain.connect(this.getOutput(ctx));
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * E4-08 — Acorde atmosférico sintetizado ao transitar de cena na Cutscene Inicial
   */
  playCutsceneSceneChange(sceneIndex = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Progressão narrativa: melancólico (cena 0) -> tensão (cena 1) -> despertar (cena 2) -> heroico (cena 3)
    const chords = [
      [220.0, 261.63, 329.63], // Am (descarte)
      [196.0, 233.08, 293.66], // Gm (lixo ganhando vida)
      [261.63, 329.63, 392.0], // C (único com poderes)
      [293.66, 369.99, 440.0, 587.33] // D maior brilhante (batalha começa)
    ];
    const chord = chords[sceneIndex % chords.length];

    chord.forEach((freq, idx) => {
      const t0 = now + idx * 0.055;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t0);

      gain.gain.setValueAtTime(0.001, t0);
      gain.gain.linearRampToValueAtTime(0.065, t0 + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.85);

      osc.connect(gain);
      gain.connect(this.getOutput(ctx));
      osc.start(t0);
      osc.stop(t0 + 0.9);
    });
  }
}
