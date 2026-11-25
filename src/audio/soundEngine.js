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
    gain.connect(this.getOutput(ctx));

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
    gain.connect(this.getOutput(ctx));
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
    gain.connect(this.getOutput(ctx));
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
