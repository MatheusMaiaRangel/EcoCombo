const INTRO_SEEN_STORAGE_KEY = 'ecocombo_intro_seen_v1';

const CUTSCENE_SCENES = [
  {
    id: 'waste_crisis',
    chapter: 'CAPÍTULO I · O DESCARTE INCORRETO',
    imageSrc: '/cutscene/scene-1.jpg',
    fxType: 'smog',
    cameraStart: { scale: 1.03, x: -1.2, y: 0.4 },
    cameraEnd: { scale: 1.11, x: 1.4, y: -0.6 },
    objectPosition: '50% 52%',
    lines: [
      'Por toda a cidade, os seres humanos pioraram o excesso de descarte incorreto...',
      'Itens jogados nas lixeiras erradas — e, principalmente, largados no chão e em qualquer canto das ruas.'
    ]
  },
  {
    id: 'trash_awakens',
    chapter: 'CAPÍTULO II · OS RESÍDUOS GANHAM VIDA',
    imageSrc: '/cutscene/scene-2.jpg',
    fxType: 'awakening',
    cameraStart: { scale: 1.03, x: 0.0, y: 0.8 },
    cameraEnd: { scale: 1.13, x: 0.0, y: -1.0 },
    objectPosition: '50% 48%',
    lines: [
      'Até que o excesso cruzou o limite: todos os itens descartados incorretamente ganharam vida.',
      'Garrafas PET, caixas de papelão, vidros e metais despertaram e passaram a tomar o parque e a cidade!'
    ]
  },
  {
    id: 'the_chosen_one',
    chapter: 'CAPÍTULO III · O ÚNICO COM O PODER',
    imageSrc: '/menu-bg-pixelart.jpg',
    fxType: 'conama_stars',
    cameraStart: { scale: 1.46, x: 14.5, y: -2.0 },
    cameraEnd: { scale: 1.62, x: 16.5, y: -4.0 },
    objectPosition: '22% 52%',
    lines: [
      'Diante desse caos, apenas uma pessoa no mundo possui os poderes para combater esses resíduos vivos.',
      'Dominando as 4 energias da coleta seletiva — Plástico, Papel, Vidro e Metal —, ele é a única defesa do parque.'
    ]
  },
  {
    id: 'battle_begins',
    chapter: 'CAPÍTULO IV · PURIFICAR O PARQUE',
    imageSrc: '/menu-bg-pixelart.jpg',
    fxType: 'park_aura',
    cameraStart: { scale: 1.12, x: -2.0, y: 0.0 },
    cameraEnd: { scale: 1.02, x: 1.2, y: 0.0 },
    objectPosition: '50% 50%',
    lines: [
      'Use a lixeira certa contra cada resíduo vivo, varie seus combos e proteja a pureza ambiental. A batalha começa agora!'
    ]
  }
];

/**
 * E4-08 — Reprodutor Cinematográfico da Cutscene Inicial em Pixel Art (Legendada e Pulável)
 */
export class CutscenePlayer {
  constructor({ sound }) {
    this.sound = sound;

    this.overlayEl = document.getElementById('cutscene-overlay');
    this.imageEl = document.getElementById('cutscene-scene-img');
    this.fxCanvas = document.getElementById('cutscene-fx-canvas');
    this.fxCtx = this.fxCanvas ? this.fxCanvas.getContext('2d') : null;
    this.chapterEl = document.getElementById('cutscene-chapter-tag');
    this.subtitleEl = document.getElementById('cutscene-subtitle-text');
    this.dotsEl = document.getElementById('cutscene-progress-dots');
    this.autoBarFillEl = document.getElementById('cutscene-auto-bar-fill');
    this.nextBtn = document.getElementById('btn-cutscene-next');
    this.skipBtn = document.getElementById('btn-cutscene-skip');

    this.active = false;
    this.sceneIndex = 0;
    this.lineIndex = 0;
    this.sceneElapsed = 0;
    this.lineElapsed = 0;

    // Typewriter
    this.currentFullLine = '';
    this.revealedChars = 0;
    this.charAccumulator = 0;
    this.charsPerSec = 36;
    this.lineFinished = false;
    this.autoAdvanceDelay = 3.6;
    this.autoAdvanceTimer = 0;
    this.blipCounter = 0;

    this.onCompleteCallback = null;

    // Partículas procedurais do canvas atmosférico
    this.particles = [];
    this.initParticles();
    this.preloadImages();
    this.bindEvents();
  }

  hasSeenIntro() {
    try {
      return window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  markIntroSeen() {
    try {
      window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, '1');
    } catch {
      // Ignora caso localStorage esteja bloqueado
    }
  }

  preloadImages() {
    const seenUrls = new Set();
    CUTSCENE_SCENES.forEach((scene) => {
      if (seenUrls.has(scene.imageSrc)) return;
      seenUrls.add(scene.imageSrc);
      const img = new Image();
      img.decoding = 'async';
      img.src = scene.imageSrc;
    });
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 28,
        vy: -14 - Math.random() * 28,
        size: 3 + Math.floor(Math.random() * 4),
        phase: Math.random() * Math.PI * 2,
        colorIdx: i % 4
      });
    }
  }

  bindEvents() {
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.skip();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.advanceOrReveal();
      });
    }

    if (this.overlayEl) {
      this.overlayEl.addEventListener('click', (e) => {
        if (!this.active) return;
        if (e.target.closest('button')) return;
        this.advanceOrReveal();
      });
    }
  }

  play({ onComplete } = {}) {
    this.active = true;
    this.onCompleteCallback = onComplete || null;
    this.sceneIndex = 0;
    this.lineIndex = 0;

    if (this.overlayEl) {
      this.overlayEl.classList.remove('hidden');
    }

    this.buildDots();
    this.loadScene(0, 0);
  }

  buildDots() {
    if (!this.dotsEl) return;
    this.dotsEl.innerHTML = CUTSCENE_SCENES.map(
      (_, idx) => `<span class="cutscene-dot" data-scene-dot="${idx}"></span>`
    ).join('');
  }

  updateDots() {
    if (!this.dotsEl) return;
    this.dotsEl.querySelectorAll('.cutscene-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.sceneIndex);
      dot.classList.toggle('passed', idx < this.sceneIndex);
    });
  }

  loadScene(sIdx, lIdx = 0) {
    this.sceneIndex = sIdx;
    this.lineIndex = lIdx;
    const scene = CUTSCENE_SCENES[sIdx];
    if (!scene) {
      this.finish(false);
      return;
    }

    if (lIdx === 0) {
      this.sceneElapsed = 0;
      this.sound.playCutsceneSceneChange(sIdx);
      if (this.imageEl) {
        this.imageEl.classList.remove('scene-fade-in');
        this.imageEl.src = scene.imageSrc;
        this.imageEl.style.objectPosition = scene.objectPosition || '50% 50%';
        void this.imageEl.offsetWidth;
        this.imageEl.classList.add('scene-fade-in');
      }
      if (this.chapterEl) {
        this.chapterEl.textContent = scene.chapter;
      }
      this.updateDots();
    }

    this.currentFullLine = scene.lines[lIdx] || '';
    this.revealedChars = 0;
    this.charAccumulator = 0;
    this.lineFinished = false;
    this.autoAdvanceTimer = 0;
    this.blipCounter = 0;

    if (this.subtitleEl) {
      this.subtitleEl.textContent = '';
    }
    if (this.autoBarFillEl) {
      this.autoBarFillEl.style.width = '0%';
    }
    if (this.nextBtn) {
      const isVeryLast =
        sIdx === CUTSCENE_SCENES.length - 1 && lIdx === scene.lines.length - 1;
      this.nextBtn.textContent = isVeryLast ? '▶ COMEÇAR [ESPAÇO]' : 'CONTINUAR ▸ [ESPAÇO]';
    }
  }

  advanceOrReveal() {
    if (!this.active) return;

    if (!this.lineFinished) {
      // 1º toque revela toda a legenda da fala atual instantaneamente
      this.revealedChars = this.currentFullLine.length;
      this.lineFinished = true;
      if (this.subtitleEl) {
        this.subtitleEl.textContent = this.currentFullLine;
      }
      this.sound.playMenuClick(true);
      return;
    }

    this.sound.playMenuClick(true);
    const scene = CUTSCENE_SCENES[this.sceneIndex];
    if (scene && this.lineIndex + 1 < scene.lines.length) {
      this.loadScene(this.sceneIndex, this.lineIndex + 1);
    } else if (this.sceneIndex + 1 < CUTSCENE_SCENES.length) {
      this.loadScene(this.sceneIndex + 1, 0);
    } else {
      this.finish(false);
    }
  }

  skip() {
    if (!this.active) return;
    this.sound.playMenuClick(false);
    this.finish(true);
  }

  finish(wasSkipped = false) {
    this.active = false;
    this.markIntroSeen();
    if (this.overlayEl) {
      this.overlayEl.classList.add('hidden');
    }
    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    if (cb) {
      cb({ skipped: wasSkipped });
    }
  }

  update(elapsedTime, dt) {
    if (!this.active) return;

    const scene = CUTSCENE_SCENES[this.sceneIndex];
    if (!scene) return;

    this.sceneElapsed += dt;

    // 1. Movimento suave de câmera (Ken Burns) na imagem Pixel Art
    if (this.imageEl) {
      const t = Math.min(1, this.sceneElapsed / 12.0);
      const scale = scene.cameraStart.scale + (scene.cameraEnd.scale - scene.cameraStart.scale) * t;
      const tx = scene.cameraStart.x + (scene.cameraEnd.x - scene.cameraStart.x) * t;
      const ty = scene.cameraStart.y + (scene.cameraEnd.y - scene.cameraStart.y) * t;
      this.imageEl.style.transform = `scale(${scale.toFixed(4)}) translate(${tx.toFixed(2)}%, ${ty.toFixed(2)}%)`;
    }

    // 2. Digitação animada da legenda (Typewriter) + Auto-avanço suave
    if (!this.lineFinished) {
      this.charAccumulator += dt * this.charsPerSec;
      const step = Math.floor(this.charAccumulator);
      if (step > 0) {
        this.charAccumulator -= step;
        const prev = this.revealedChars;
        this.revealedChars = Math.min(this.currentFullLine.length, this.revealedChars + step);
        if (this.subtitleEl) {
          this.subtitleEl.textContent = this.currentFullLine.slice(0, this.revealedChars);
        }
        const newlyRevealed = this.currentFullLine.slice(prev, this.revealedChars);
        if (/\S/.test(newlyRevealed)) {
          this.blipCounter += 1;
          if (this.blipCounter % 3 === 1) {
            this.sound.playCutsceneBlip(this.blipCounter);
          }
        }
        if (this.revealedChars >= this.currentFullLine.length) {
          this.lineFinished = true;
          this.autoAdvanceTimer = 0;
        }
      }
    } else {
      this.autoAdvanceTimer += dt;
      if (this.autoBarFillEl) {
        const pct = Math.min(100, (this.autoAdvanceTimer / this.autoAdvanceDelay) * 100);
        this.autoBarFillEl.style.width = `${pct.toFixed(1)}%`;
      }
      if (this.autoAdvanceTimer >= this.autoAdvanceDelay) {
        const curScene = CUTSCENE_SCENES[this.sceneIndex];
        if (curScene && this.lineIndex + 1 < curScene.lines.length) {
          this.loadScene(this.sceneIndex, this.lineIndex + 1);
        } else if (this.sceneIndex + 1 < CUTSCENE_SCENES.length) {
          this.loadScene(this.sceneIndex + 1, 0);
        } else {
          this.finish(false);
          return;
        }
      }
    }

    // 3. Efeitos atmosféricos em Pixel Art no Canvas sobreposto
    this.renderFx(scene, elapsedTime, dt);
  }

  renderFx(scene, elapsedTime, dt) {
    if (!this.fxCtx || !this.fxCanvas) return;
    const ctx = this.fxCtx;
    const w = this.fxCanvas.width;
    const h = this.fxCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    const palettes = {
      smog: ['#f59e0b', '#fb7185', '#94a3b8', '#fde68a'],
      awakening: ['#c084fc', '#4ade80', '#ef4444', '#facc15'],
      conama_stars: ['#ef4444', '#3b82f6', '#22c55e', '#facc15'],
      park_aura: ['#00f5d4', '#4ade80', '#ffd166', '#93c5fd']
    };
    const colors = palettes[scene.fxType] || palettes.park_aura;

    // Atualiza e desenha partículas pixeladas sutis
    for (const p of this.particles) {
      p.x += (p.vx + Math.sin(elapsedTime * 1.4 + p.phase) * 12) * dt;
      p.y += p.vy * dt;

      if (p.y < -12) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -12) p.x = w + 10;
      if (p.x > w + 12) p.x = -10;

      const alpha = 0.25 + 0.4 * (0.5 + 0.5 * Math.sin(elapsedTime * 3.1 + p.phase));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colors[p.colorIdx];
      const px = Math.round(p.x / 2) * 2;
      const py = Math.round(p.y / 2) * 2;
      ctx.fillRect(px, py, p.size, p.size);
    }

    // Cena 3: desenha as 4 Estrelas CONAMA em Pixel Art orbitando ao redor da esfera do protagonista!
    if (scene.fxType === 'conama_stars') {
      const cx = w * 0.28;
      const cy = h * 0.54;
      const starColors = [
        { main: '#ef4444', light: '#fca5a5', outline: '#7f1d1d' },
        { main: '#3b82f6', light: '#93c5fd', outline: '#1e3a8a' },
        { main: '#22c55e', light: '#86efac', outline: '#14532d' },
        { main: '#eab308', light: '#fef08a', outline: '#713f12' }
      ];

      ctx.globalAlpha = 1;
      starColors.forEach((sc, idx) => {
        const angle = elapsedTime * 1.55 + (idx * Math.PI) / 2;
        const rx = 115;
        const ry = 62;
        const sx = Math.round(cx + Math.cos(angle) * rx);
        const sy = Math.round(cy + Math.sin(angle) * ry);

        // Brilho sutil
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = sc.main;
        ctx.fillRect(sx - 12, sy - 12, 24, 24);

        // Estrela pixel art 4 pontas
        ctx.globalAlpha = 1;
        ctx.fillStyle = sc.outline;
        ctx.fillRect(sx - 10, sy - 4, 20, 8);
        ctx.fillRect(sx - 4, sy - 10, 8, 20);

        ctx.fillStyle = sc.main;
        ctx.fillRect(sx - 8, sy - 2, 16, 4);
        ctx.fillRect(sx - 2, sy - 8, 4, 16);
        ctx.fillRect(sx - 4, sy - 4, 8, 8);

        ctx.fillStyle = sc.light;
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      });
    }

    ctx.globalAlpha = 1;
  }
}
