import { CONAMA_ELEMENTS } from '../constants/recipes.js';

/**
 * E4-01 — Renderizador Procedural em Canvas Pixel Art para o Painel Lateral Esquerdo:
 * - Disposição estrutural inspirada em Capsule (@Docs/2d.webp)
 * - Design de personagem e estética inspirados em Until Then (@Docs/until-then-2.webp)
 */
export class SidebarCharacterRenderer {
  constructor(upperCanvas, portraitCanvas) {
    this.upperCanvas = upperCanvas;
    this.portraitCanvas = portraitCanvas;
    this.upperCtx = upperCanvas.getContext('2d');
    this.portraitCtx = portraitCanvas.getContext('2d');

    // Buffer offscreen em baixa resolução para pixel art autêntico (escala inteira sem blur)
    this.upperBuffer = document.createElement('canvas');
    this.upperBuffer.width = 65;
    this.upperBuffer.height = 60;
    this.ubCtx = this.upperBuffer.getContext('2d');

    this.portraitBuffer = document.createElement('canvas');
    this.portraitBuffer.width = 28;
    this.portraitBuffer.height = 28;
    this.pbCtx = this.portraitBuffer.getContext('2d');

    this.state = {
      slots: [],
      recipe: null,
      multiplier: 1.0,
      repeatCount: 0,
      isStale: false,
      purity: 100,
      hurtTimer: 0,
      shootFlashTimer: 0,
      masteryFlashTimer: 0
    };
  }

  updateState(partial) {
    Object.assign(this.state, partial);
  }

  triggerHurt() {
    this.state.hurtTimer = 0.75;
  }

  triggerShootFlash() {
    this.state.shootFlashTimer = 0.25;
  }

  triggerMasteryFlash() {
    this.state.masteryFlashTimer = 1.5;
  }

  render(elapsedTime, dt) {
    if (this.state.hurtTimer > 0) {
      this.state.hurtTimer = Math.max(0, this.state.hurtTimer - dt);
    }
    if (this.state.shootFlashTimer > 0) {
      this.state.shootFlashTimer = Math.max(0, this.state.shootFlashTimer - dt);
    }
    if (this.state.masteryFlashTimer > 0) {
      this.state.masteryFlashTimer = Math.max(0, this.state.masteryFlashTimer - dt);
    }

    this.drawUpperCharacter(elapsedTime);
    this.drawPortrait(elapsedTime);
  }

  /**
   * Desenha o protagonista (estilo Until Then) da cintura para cima canalizando o combo entre as mãos
   * (Posição equivalente ao personagem grande na lateral esquerda de @Docs/2d.webp)
   */
  drawUpperCharacter(t) {
    const ctx = this.ubCtx;
    const W = this.upperBuffer.width;
    const H = this.upperBuffer.height;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);

    const breathe = Math.sin(t * 3.2) > 0.3 ? -1 : 0;
    const { slots, recipe, multiplier, isStale, hurtTimer, shootFlashTimer, masteryFlashTimer } =
      this.state;
    const isEnergized = !isStale && hurtTimer <= 0 && (multiplier >= 4.0 || masteryFlashTimer > 0);
    const hurtShakeX = hurtTimer > 0 ? Math.round(Math.sin(t * 60) * 1.5) : 0;

    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(x + hurtShakeX),
        Math.round(y + breathe),
        Math.round(w),
        Math.round(h)
      );
    };

    // E4-02 — Aura cintilante atrás do personagem quando energizado (>= 4.0x) ou em Maestria Elemental
    if (isEnergized) {
      const auraColor = masteryFlashTimer > 0 ? '#ffd166' : '#00f5d4';
      for (let i = 0; i < 6; i++) {
        const phase = (t * 2.4 + i * 0.45) % 1;
        const sx = 14 + ((i * 11) % 38);
        const sy = Math.round(54 - phase * 48);
        ctx.fillStyle = i % 2 === 0 ? auraColor : '#ffffff';
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // 1. Mochila azul escolar nas costas (Until Then)
    px(14, 24, 9, 22, '#164b96');
    px(15, 25, 6, 19, '#2364c2');
    px(13, 30, 2, 10, '#103770');

    // 2. Calça verde-oliva na base (quadril/cintura igual @Docs/until-then-2.webp)
    ctx.fillStyle = '#38543a';
    ctx.fillRect(19, 49, 28, 11);
    ctx.fillStyle = '#4a6b4d';
    ctx.fillRect(21, 50, 11, 10);
    ctx.fillRect(35, 50, 10, 10);
    ctx.fillStyle = '#263b28';
    ctx.fillRect(32, 51, 2, 9);
    // Cinto escuro
    ctx.fillStyle = '#291d18';
    ctx.fillRect(19, 47, 28, 2);
    ctx.fillStyle = '#d4a238';
    ctx.fillRect(31, 47, 4, 2);

    // 3. Tronco — Camisa escolar branca com gola, gravata e alças azuis da mochila
    px(18, 23, 30, 25, '#dce2ec');
    px(20, 24, 26, 23, '#f4f7fc');
    // Sombras dramáticas estilo Until Then (iluminação quente vinda da direita/topo)
    px(19, 25, 6, 22, '#c6d0e0');
    px(41, 25, 5, 22, '#ffe8c2'); // Rim light quente solar

    // Alças azuis da mochila sobre os ombros
    px(20, 23, 4, 21, '#1d5bb8');
    px(21, 24, 2, 19, '#2b73de');
    px(42, 23, 4, 21, '#1d5bb8');
    px(43, 24, 2, 19, '#2b73de');

    // Gola e gravata escolar
    px(27, 22, 12, 4, '#cfd6e3');
    px(31, 25, 4, 15, '#526661');
    px(32, 25, 2, 13, '#678079');

    // 4. Pescoço e Cabeça (Protagonista Until Then)
    px(29, 18, 8, 5, '#cf9474');
    // Rosto
    px(25, 8, 16, 12, '#ebba9a');
    px(25, 16, 16, 4, '#d9a182');
    px(38, 9, 3, 10, '#ffe3b8'); // Luz dramática lateral no rosto

    // Cabelo castanho bagunçado característico de Until Then
    px(23, 2, 20, 5, '#42261b');
    px(21, 4, 24, 5, '#5c3626');
    px(22, 7, 22, 3, '#734531');
    // Mechas soltas
    px(25, 0, 4, 2, '#5c3626');
    px(33, 0, 5, 2, '#734531');
    px(43, 3, 4, 2, '#5c3626');
    px(20, 8, 3, 5, '#42261b');
    px(43, 8, 3, 5, '#42261b');
    // Franja caindo na testa
    px(26, 8, 3, 3, '#42261b');
    px(31, 8, 4, 2, '#5c3626');
    px(37, 8, 4, 3, '#42261b');

    // Expressão nos olhos do palco superior (E4-02)
    if (hurtTimer > 0) {
      // Olhos cerrados de dor (> <) + boca aberta de impacto + marca de alerta
      px(27, 11, 2, 1, '#2b1912');
      px(29, 12, 2, 1, '#2b1912');
      px(27, 13, 2, 1, '#2b1912');
      px(37, 11, 2, 1, '#2b1912');
      px(35, 12, 2, 1, '#2b1912');
      px(37, 13, 2, 1, '#2b1912');
      px(31, 16, 4, 3, '#8f1d24');
      px(32, 17, 2, 1, '#ffccd5');
      // Alerta vermelho perto da cabeça
      px(45, 5, 2, 4, '#ff3b30');
      px(45, 10, 2, 2, '#ffd166');
    } else if (isStale) {
      // Olhar cansado/fadiga de combo repetido (1.0x) + gota de suor
      px(27, 11, 4, 1, '#2b1912');
      px(35, 11, 4, 1, '#2b1912');
      px(28, 13, 3, 1, '#1c1518');
      px(36, 13, 3, 1, '#1c1518');
      // Boca cansada/tensa
      px(30, 17, 6, 1, '#8c584c');
      // Gota de suor animada
      const dropY = 9 + (Math.floor(t * 4) % 2);
      px(41, dropY, 2, 3, '#38bdf8');
      px(41, dropY, 1, 1, '#e0f2fe');
    } else if (isEnergized) {
      // Olhar energizado/confiante (>= 4.0x / Ranks S-SSS / Maestria)
      px(27, 10, 4, 1, '#2b1912');
      px(35, 10, 4, 1, '#2b1912');
      px(28, 11, 3, 3, '#1c1518');
      px(36, 11, 3, 3, '#1c1518');
      const eyeGlow = masteryFlashTimer > 0 ? '#ffd166' : '#00f5d4';
      px(28, 11, 2, 1, eyeGlow);
      px(36, 11, 2, 1, eyeGlow);
      px(30, 13, 1, 1, '#ffffff');
      px(38, 13, 1, 1, '#ffffff');
      // Sorriso amplo e confiante
      px(30, 16, 6, 2, '#b55645');
      px(31, 16, 4, 1, '#ffffff');
    } else {
      // Olhar determinado/focado
      px(27, 11, 4, 1, '#2b1912');
      px(35, 11, 4, 1, '#2b1912');
      px(28, 12, 3, 2, '#1c1518');
      px(36, 12, 3, 2, '#1c1518');
      px(28, 12, 1, 1, '#ffffff');
      px(36, 12, 1, 1, '#ffffff');
      // Sorriso simpático
      px(31, 17, 4, 1, '#b55645');
      px(30, 16, 1, 1, '#b55645');
      px(35, 16, 1, 1, '#b55645');
    }

    // 5. Braços e Mãos erguidas na frente do peito (Canalizando a cápsula/objeto igual @Docs/2d.webp!)
    // Mangas brancas
    px(12, 24, 7, 9, '#dce2ec');
    px(47, 24, 7, 9, '#f4f7fc');
    // Antebraços dobrados para o centro
    px(11, 32, 10, 7, '#e6b190');
    px(45, 32, 10, 7, '#e6b190');
    // Mãos / Luvas de canalização segurando a energia no centro (x: 21..44, y: 31..39)
    px(19, 31, 6, 7, '#f7f9fc');
    px(41, 31, 6, 7, '#f7f9fc');
    px(23, 30, 2, 3, '#dce2ec');
    px(41, 30, 2, 3, '#dce2ec');

    // 6. Objeto / Energia Reciclada Canalizada entre as Mãos!
    const cx = 33;
    const cy = 34 + breathe;
    const pulse = Math.round(Math.sin(t * 7) * 1.5);

    if (recipe) {
      // Aura externa brilhante nas cores combinadas
      ctx.fillStyle = isStale ? '#ff3b30' : recipe.secondaryHex;
      ctx.fillRect(cx - 7 - pulse, cy - 7 - pulse, 14 + pulse * 2, 14 + pulse * 2);

      // Núcleo da receita formada
      ctx.fillStyle = recipe.primaryHex;
      ctx.fillRect(cx - 5, cy - 5, 10, 10);

      // Brilho branco central (cápsula/cristal/esfera)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 2, cy - 3, 4, 6);

      // Partículas orbitando as mãos
      for (let i = 0; i < 4; i++) {
        const ang = t * 4 + i * (Math.PI / 2);
        const ox = Math.round(cx + Math.cos(ang) * 9);
        const oy = Math.round(cy + Math.sin(ang) * 7);
        ctx.fillStyle = i % 2 === 0 ? recipe.primaryHex : recipe.secondaryHex;
        ctx.fillRect(ox, oy, 2, 2);
      }
    } else if (slots.length === 1) {
      const elem = CONAMA_ELEMENTS[slots[0]];
      ctx.fillStyle = elem.hex;
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 1, cy - 2, 2, 4);
    } else if (shootFlashTimer > 0) {
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
    } else {
      // 4 micro-orbes aguardando seleção entre as mãos
      const colors = ['#FF3B30', '#007AFF', '#34C759', '#FFCC00'];
      colors.forEach((c, idx) => {
        const ang = t * 2.5 + idx * (Math.PI / 2);
        const ox = Math.round(cx + Math.cos(ang) * 6);
        const oy = Math.round(cy + Math.sin(ang) * 4);
        ctx.fillStyle = c;
        ctx.fillRect(ox - 1, oy - 1, 3, 3);
      });
    }

    // Transfere o buffer pixel art para o canvas principal sem suavização
    this.upperCtx.imageSmoothingEnabled = false;
    this.upperCtx.clearRect(0, 0, this.upperCanvas.width, this.upperCanvas.height);
    this.upperCtx.drawImage(
      this.upperBuffer,
      0,
      0,
      this.upperCanvas.width,
      this.upperCanvas.height
    );
  }

  /**
   * Desenha o Retrato 2D Reativo no quadro inferior esquerdo (E4-01 / E4-02)
   */
  drawPortrait(t) {
    const ctx = this.pbCtx;
    const W = this.portraitBuffer.width;
    const H = this.portraitBuffer.height;
    ctx.imageSmoothingEnabled = false;

    const { multiplier, isStale, purity, hurtTimer, masteryFlashTimer } = this.state;
    const isEnergized = !isStale && hurtTimer <= 0 && (multiplier >= 4.0 || masteryFlashTimer > 0);
    const shakeX = hurtTimer > 0 ? (Math.floor(t * 36) % 2 === 0 ? -1 : 1) : 0;

    // Fundo reativo ao estado do multiplicador, fadiga (1x), dano ou maestria
    if (hurtTimer > 0) {
      ctx.fillStyle = Math.floor(t * 20) % 2 === 0 ? '#ef4444' : '#b91c1c';
    } else if (isStale) {
      ctx.fillStyle = '#c2410c';
    } else if (masteryFlashTimer > 0) {
      ctx.fillStyle = '#0d9488';
    } else if (isEnergized) {
      ctx.fillStyle = '#06b6d4';
    } else if (purity < 30) {
      ctx.fillStyle = '#581c87';
    } else {
      ctx.fillStyle = '#38bdf8';
    }
    ctx.fillRect(0, 0, W, H);

    // Detalhes de fundo reativos (E4-02)
    if (hurtTimer > 0) {
      // Linhas de choque vermelho-amarelo de impacto
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 3, W, 2);
      ctx.fillRect(0, 23, W, 2);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(2, 2, 2, 5);
      ctx.fillRect(2, 8, 2, 2);
    } else if (isStale) {
      // Faixas de fadiga / alerta laranja escuro
      ctx.fillStyle = '#9a3412';
      ctx.fillRect(0, 4, W, 2);
      ctx.fillRect(0, 12, W, 1);
      ctx.fillRect(0, 22, W, 2);
    } else if (isEnergized) {
      // Estrelas e brilho energético de Rank S / SS / SSS (>= 4.0x)
      const starCol = masteryFlashTimer > 0 ? '#fde047' : '#a5f3fc';
      const blink = Math.floor(t * 8) % 2 === 0;
      ctx.fillStyle = '#fde047';
      ctx.fillRect(2, 2, 4, 4);
      ctx.fillStyle = starCol;
      ctx.fillRect(blink ? 22 : 21, 3, 2, 2);
      ctx.fillRect(3, blink ? 12 : 13, 2, 2);
      ctx.fillRect(23, blink ? 14 : 13, 2, 2);
      // Gramado luminoso
      ctx.fillStyle = '#34d399';
      ctx.fillRect(0, 20, W, 8);
    } else {
      // Solzinho dourado, nuvem branca e colina verde no fundo do retrato
      ctx.fillStyle = purity < 30 ? '#c084fc' : '#fde047';
      ctx.fillRect(2, 2, 4, 4);
      ctx.fillStyle = purity < 30 ? '#7e22ce' : '#ffffff';
      ctx.fillRect(19, 3, 7, 3);
      ctx.fillRect(21, 2, 4, 2);
      ctx.fillStyle = purity < 30 ? '#3b0764' : '#4ade80';
      ctx.fillRect(0, 19, W, 9);
      ctx.fillStyle = purity < 30 ? '#2e1065' : '#22c55e';
      ctx.fillRect(0, 22, W, 6);
    }

    const r = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x + shakeX, y, w, h);
    };

    // Ombros da camisa branca + alças azuis da mochila
    r(4, 21, 20, 7, '#e8ecf2');
    r(6, 21, 3, 7, '#1d5bb8');
    r(19, 21, 3, 7, '#1d5bb8');
    r(13, 22, 2, 6, '#526661');

    // Pescoço e Rosto
    r(11, 18, 6, 4, '#cf9474');
    r(7, 7, 14, 12, '#ebba9a');
    r(7, 16, 14, 3, '#d9a182');
    // Rim light quente lateral
    r(19, 8, 2, 9, '#ffe3b8');

    // Cabelo castanho bagunçado (Until Then)
    r(6, 2, 16, 5, '#42261b');
    r(5, 4, 18, 4, '#5c3626');
    r(5, 7, 3, 6, '#5c3626');
    r(20, 7, 3, 6, '#5c3626');
    // Franja
    r(8, 7, 4, 2, '#5c3626');
    r(15, 7, 4, 2, '#5c3626');

    // Expressão Facial Reativa (E4-02)
    if (hurtTimer > 0) {
      // Dano sofrido (> <) bem nítido + boca aberta de susto
      r(9, 10, 2, 1, '#2b1912');
      r(11, 11, 1, 1, '#2b1912');
      r(9, 12, 2, 1, '#2b1912');

      r(17, 10, 2, 1, '#2b1912');
      r(16, 11, 1, 1, '#2b1912');
      r(17, 12, 2, 1, '#2b1912');

      // Bochechas avermelhadas de impacto + boca aberta
      r(8, 14, 2, 1, '#f87171');
      r(18, 14, 2, 1, '#f87171');
      r(12, 15, 4, 3, '#7f1d1d');
      r(13, 16, 2, 1, '#fca5a5');
    } else if (isStale) {
      // Desgastado em 1.0x / combo repetido (pálpebras pesadas + sobrancelha caída + gota de suor)
      r(9, 10, 4, 1, '#2b1912');
      r(15, 10, 4, 1, '#2b1912');
      // Pálpebra pesada
      r(9, 11, 4, 1, '#d9a182');
      r(15, 11, 4, 1, '#d9a182');
      // Pupila semicerrada
      r(10, 12, 2, 1, '#1c1518');
      r(16, 12, 2, 1, '#1c1518');
      // Boca cansada/ondulada
      r(11, 16, 2, 1, '#8c4f43');
      r(13, 15, 2, 1, '#8c4f43');
      r(15, 16, 2, 1, '#8c4f43');
      // Gota de suor azul animada
      const dropY = 9 + (Math.floor(t * 4) % 3);
      r(19, dropY, 2, 3, '#38bdf8');
      r(19, dropY, 1, 1, '#ffffff');
    } else if (isEnergized) {
      // 4.0x+ / Ranks S-SSS / Maestria: Confiante e energizado!
      r(9, 9, 3, 1, '#2b1912');
      r(12, 10, 1, 1, '#2b1912');
      r(16, 9, 3, 1, '#2b1912');
      r(15, 10, 1, 1, '#2b1912');

      r(10, 11, 2, 3, '#1c1518');
      r(16, 11, 2, 3, '#1c1518');
      // Brilho cyan/dourado nos olhos
      const eyeSpark = masteryFlashTimer > 0 ? '#ffd166' : '#00f5d4';
      r(10, 11, 1, 1, eyeSpark);
      r(16, 11, 1, 1, eyeSpark);
      r(11, 13, 1, 1, '#ffffff');
      r(17, 13, 1, 1, '#ffffff');
      // Sorriso confiante e radiante
      r(11, 15, 6, 2, '#9e5847');
      r(12, 15, 4, 1, '#ffffff');
    } else {
      // 1.0x–3.0x: Focado (ou tenso se pureza < 30%)
      r(9, 10, 4, 1, '#2b1912');
      r(15, 10, 4, 1, '#2b1912');
      r(10, 11, 2, 2, '#1c1518');
      r(16, 11, 2, 2, '#1c1518');
      r(10, 11, 1, 1, '#ffffff');
      r(16, 11, 1, 1, '#ffffff');
      r(12, 15, 4, 1, '#8c4f43');
    }

    this.portraitCtx.imageSmoothingEnabled = false;
    this.portraitCtx.clearRect(0, 0, this.portraitCanvas.width, this.portraitCanvas.height);
    this.portraitCtx.drawImage(
      this.portraitBuffer,
      0,
      0,
      this.portraitCanvas.width,
      this.portraitCanvas.height
    );
  }
}
