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
      multiplier: 4.0,
      repeatCount: 0,
      isStale: false,
      hurtTimer: 0,
      shootFlashTimer: 0
    };
  }

  updateState(partial) {
    Object.assign(this.state, partial);
  }

  triggerHurt() {
    this.state.hurtTimer = 0.65;
  }

  triggerShootFlash() {
    this.state.shootFlashTimer = 0.25;
  }

  render(elapsedTime, dt) {
    if (this.state.hurtTimer > 0) {
      this.state.hurtTimer = Math.max(0, this.state.hurtTimer - dt);
    }
    if (this.state.shootFlashTimer > 0) {
      this.state.shootFlashTimer = Math.max(0, this.state.shootFlashTimer - dt);
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
    const { slots, recipe, isStale, hurtTimer, shootFlashTimer } = this.state;

    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y + breathe), Math.round(w), Math.round(h));
    };

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

    // Expressão nos olhos do palco superior
    if (hurtTimer > 0) {
      px(28, 12, 3, 2, '#ff3b30');
      px(36, 12, 3, 2, '#ff3b30');
      px(31, 17, 4, 2, '#7a2020');
    } else if (isStale) {
      // Olhar cansado de combo repetido (1x)
      px(27, 11, 4, 1, '#2b1912');
      px(35, 11, 4, 1, '#2b1912');
      px(28, 13, 3, 1, '#1c1518');
      px(36, 13, 3, 1, '#1c1518');
      px(31, 17, 4, 1, '#8c584c');
    } else {
      // Olhar determinado/feliz e sorriso alegre
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
   * Desenha o Retrato 2D Reativo no quadro inferior esquerdo (E4-01)
   */
  drawPortrait(t) {
    const ctx = this.pbCtx;
    const W = this.portraitBuffer.width;
    const H = this.portraitBuffer.height;
    ctx.imageSmoothingEnabled = false;

    const { multiplier, isStale, hurtTimer } = this.state;

    // Fundo ensolarado e alegre reativo ao estado do multiplicador
    if (hurtTimer > 0) {
      ctx.fillStyle = '#ef4444';
    } else if (isStale) {
      ctx.fillStyle = '#fb923c';
    } else if (multiplier >= 4.0) {
      ctx.fillStyle = '#06b6d4';
    } else {
      ctx.fillStyle = '#38bdf8';
    }
    ctx.fillRect(0, 0, W, H);

    // Solzinho dourado, nuvem branca e colina verde no fundo do retrato
    if (hurtTimer <= 0 && !isStale) {
      // Sol dourado no canto superior esquerdo
      ctx.fillStyle = '#fde047';
      ctx.fillRect(2, 2, 4, 4);
      // Nuvem branca fofinha no topo direito
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(19, 3, 7, 3);
      ctx.fillRect(21, 2, 4, 2);
      // Gramado verde alegre na base do retrato
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(0, 19, W, 9);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, 22, W, 6);
    } else {
      ctx.fillStyle = isStale ? '#ea580c' : '#b91c1c';
      ctx.fillRect(0, 4, W, 2);
      ctx.fillRect(0, 22, W, 2);
    }

    // Ombros da camisa branca + alças azuis da mochila
    ctx.fillStyle = '#e8ecf2';
    ctx.fillRect(4, 21, 20, 7);
    ctx.fillStyle = '#1d5bb8';
    ctx.fillRect(6, 21, 3, 7);
    ctx.fillRect(19, 21, 3, 7);
    ctx.fillStyle = '#526661';
    ctx.fillRect(13, 22, 2, 6);

    // Pescoço e Rosto
    ctx.fillStyle = '#cf9474';
    ctx.fillRect(11, 18, 6, 4);
    ctx.fillStyle = '#ebba9a';
    ctx.fillRect(7, 7, 14, 12);
    ctx.fillStyle = '#d9a182';
    ctx.fillRect(7, 16, 14, 3);
    // Rim light quente lateral
    ctx.fillStyle = '#ffe3b8';
    ctx.fillRect(19, 8, 2, 9);

    // Cabelo castanho bagunçado (Until Then)
    ctx.fillStyle = '#42261b';
    ctx.fillRect(6, 2, 16, 5);
    ctx.fillStyle = '#5c3626';
    ctx.fillRect(5, 4, 18, 4);
    ctx.fillRect(5, 7, 3, 6);
    ctx.fillRect(20, 7, 3, 6);
    // Franja
    ctx.fillRect(8, 7, 4, 2);
    ctx.fillRect(15, 7, 4, 2);

    // Expressão Facial Reativa
    if (hurtTimer > 0) {
      // Dano sofrido (> <)
      ctx.fillStyle = '#2b1912';
      ctx.fillRect(9, 11, 3, 2);
      ctx.fillRect(16, 11, 3, 2);
      ctx.fillStyle = '#9e2a2b';
      ctx.fillRect(12, 15, 4, 3);
    } else if (isStale) {
      // Desgastado em 1.0x (olhos semicerrados + gota de suor)
      ctx.fillStyle = '#2b1912';
      ctx.fillRect(9, 11, 4, 1);
      ctx.fillRect(15, 11, 4, 1);
      ctx.fillStyle = '#1c1518';
      ctx.fillRect(10, 12, 2, 1);
      ctx.fillRect(16, 12, 2, 1);
      // Boca tensa
      ctx.fillStyle = '#8c4f43';
      ctx.fillRect(11, 16, 6, 1);
      // Gota de suor azul
      ctx.fillStyle = '#00bbf9';
      ctx.fillRect(19, 10 + (Math.floor(t * 4) % 2), 2, 3);
    } else if (multiplier >= 4.0) {
      // 4.0x: Confiante e energizado!
      ctx.fillStyle = '#2b1912';
      ctx.fillRect(9, 10, 4, 1);
      ctx.fillRect(15, 10, 4, 1);
      ctx.fillStyle = '#1c1518';
      ctx.fillRect(10, 11, 2, 3);
      ctx.fillRect(16, 11, 2, 3);
      // Brilho cyan/dourado nos olhos
      ctx.fillStyle = '#00f5d4';
      ctx.fillRect(10, 11, 1, 1);
      ctx.fillRect(16, 11, 1, 1);
      // Sorriso confiante
      ctx.fillStyle = '#9e5847';
      ctx.fillRect(11, 15, 5, 1);
      ctx.fillRect(16, 14, 1, 1);
    } else {
      // 2.5x / 1.5x: Focado
      ctx.fillStyle = '#2b1912';
      ctx.fillRect(9, 10, 4, 1);
      ctx.fillRect(15, 10, 4, 1);
      ctx.fillStyle = '#1c1518';
      ctx.fillRect(10, 11, 2, 2);
      ctx.fillRect(16, 11, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(10, 11, 1, 1);
      ctx.fillRect(16, 11, 1, 1);
      ctx.fillStyle = '#8c4f43';
      ctx.fillRect(12, 15, 4, 1);
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
