/**
 * E4-06 — Animador por Frames em Pixel Art do Menu Inicial (Estilo Dead Cells)
 * - Alterna entre os 8 frames discretos (/menu-frames/frame-0.jpg .. frame-7.jpg) a ~7.5 FPS:
 *   • Pássaros no céu batendo asa com fases desencontradas
 *   • Pontas externas das mechas de cabelo do protagonista batendo ao vento (cabeça/rosto/braços 100% firmes)
 *   • Chaveiro amarelo balançando como pêndulo rígido no zíper da mochila azul (mochila 100% firme)
 *   • Aba lateral solta e dobras internas da barra da camisa branca batendo ao vento
 *   • Esfera de energia reciclável pulsando
 *   • Clusters de folhas nas copas das árvores (y <= 410) e pontas da grama em primeiro plano balançando
 *   • Reflexo na superfície da água (y >= 516, abaixo do pier de pedra) com brilho sutil
 *   • Lixeiras CONAMA, bancos, postes, coreto, torre do relógio, estufa e calçada de pedra 100% estáticos (0px)
 * - As 4 Estrelas CONAMA (Vermelho/Plástico, Azul/Papel, Verde/Vidro e Amarelo/Metal) são renderizadas como
 *   propriedades/entidades independentes em Pixel Art diretamente no Canvas com fundo 100% transparente.
 */
export class StartMenuAnimator {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;

    this.frameCount = 8;
    this.frameFps = 7.5;
    this.frames = [];
    this.loadedCount = 0;

    this.nativeWidth = 1376;
    this.nativeHeight = 768;

    // As 4 Estrelas CONAMA como propriedades independentes com fundo 100% transparente
    this.conamaStars = [
      {
        id: 'PLASTIC',
        baseX: 126,
        baseY: 480,
        phase: 0.0,
        floatSpeed: 2.1,
        outline: '#881313',
        main: '#ef4444',
        light: '#fca5a5',
        core: '#fff5f5'
      },
      {
        id: 'PAPER',
        baseX: 156,
        baseY: 526,
        phase: 1.6,
        floatSpeed: 2.3,
        outline: '#1e3a8a',
        main: '#3b82f6',
        light: '#93c5fd',
        core: '#f0f9ff'
      },
      {
        id: 'GLASS',
        baseX: 246,
        baseY: 536,
        phase: 3.1,
        floatSpeed: 1.95,
        outline: '#14532d',
        main: '#22c55e',
        light: '#86efac',
        core: '#f0fdf4'
      },
      {
        id: 'METAL',
        baseX: 262,
        baseY: 420,
        phase: 4.7,
        floatSpeed: 2.2,
        outline: '#854d0e',
        main: '#eab308',
        light: '#fef08a',
        core: '#fefce8'
      }
    ];

    // Fontes reais das árvores no parque onde as pétalas/folhas nascem
    this.treeEmitters = [
      { x0: 566, x1: 642, y0: 342, y1: 396, main: '#f9a8d4', shadow: '#db2777' },
      { x0: 628, x1: 774, y0: 274, y1: 378, main: '#fde047', shadow: '#ca8a04' },
      { x0: 790, x1: 982, y0: 168, y1: 318, main: '#4ade80', shadow: '#15803d' },
      { x0: 1265, x1: 1355, y0: 308, y1: 388, main: '#fbcfe8', shadow: '#ec4899' }
    ];

    this.windLeaves = this.createInitialLeaves(10);
    this.orbSparks = this.createInitialSparks(6);

    this.preloadFrames();
  }

  preloadFrames() {
    for (let i = 0; i < this.frameCount; i++) {
      const img = new Image();
      img.decoding = 'async';
      img.src = `/menu-frames/frame-${i}.jpg?v=3`;
      img.addEventListener('load', () => {
        this.loadedCount += 1;
      });
      this.frames.push(img);
    }
  }

  spawnLeafFromTree(emitter, prewarmProgress = 0) {
    const startX = emitter.x0 + Math.random() * (emitter.x1 - emitter.x0);
    const startY = emitter.y0 + Math.random() * (emitter.y1 - emitter.y0);
    const vx = 16 + Math.random() * 14;
    const vy = 8 + Math.random() * 7;
    const travelSec = prewarmProgress * 5.0;

    return {
      emitter,
      x: startX + vx * travelSec,
      y: startY + vy * travelSec,
      maxY: 472 + Math.random() * 115,
      vx,
      vy,
      phase: Math.random() * Math.PI * 2,
      freq: 2.0 + Math.random() * 1.4,
      main: emitter.main,
      shadow: emitter.shadow
    };
  }

  createInitialLeaves(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const emitter = this.treeEmitters[i % this.treeEmitters.length];
      list.push(this.spawnLeafFromTree(emitter, Math.random()));
    }
    return list;
  }

  createInitialSparks(count) {
    const colors = ['#00f5d4', '#38bdf8', '#7dd3fc'];
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push({
        angle: (i / count) * Math.PI * 2,
        radius: 38 + (i % 3) * 8,
        speed: 0.75 + (i % 3) * 0.25,
        color: colors[i % colors.length]
      });
    }
    return list;
  }

  /**
   * Desenha uma Estrela CONAMA de 4 pontas (✦) em Pixel Art puro com fundo 100% transparente
   * (Grade de 2x2 pixels por bloco, sem carregar nenhum pixel de fundo)
   */
  drawIndependentConamaStar(ctx, star, steppedTime) {
    const P = 2; // Tamanho do bloco de pixel art (2x2 px nativos)
    const wave = Math.sin(steppedTime * star.floatSpeed + star.phase);
    const cosWave = Math.cos(steppedTime * (star.floatSpeed * 0.8) + star.phase);

    // Posição flutuante quantizada na grade de pixel art (P = 2px)
    const cx = Math.round((star.baseX + cosWave * 2.0) / P) * P;
    const cy = Math.round((star.baseY + wave * 3.2) / P) * P;

    // Estado de cintilação da estrela (expande/contrai as pontas em 1 bloco de pixel)
    const twinkle = wave > 0.25 ? 1 : 0;
    const armLen = 4 + twinkle; // 4 ou 5 blocos de raio nas 4 pontas

    const block = (gx, gy, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(cx + gx * P, cy + gy * P, P, P);
    };

    // 1. Pontas externas das 4 direções (Contorno saturado + corpo principal)
    for (let d = 2; d <= armLen; d++) {
      const col = d === armLen ? star.outline : star.main;
      block(0, -d, col);
      block(0, d, col);
      block(-d, 0, col);
      block(d, 0, col);
    }

    // 2. Diagonais do losango central (Contorno e corpo da estrela ✦)
    const diagOuter = [
      [-2, -1], [2, -1], [-2, 1], [2, 1],
      [-1, -2], [1, -2], [-1, 2], [1, 2]
    ];
    for (let i = 0; i < diagOuter.length; i++) {
      block(diagOuter[i][0], diagOuter[i][1], star.outline);
    }

    block(-1, -1, star.main);
    block(1, -1, star.main);
    block(-1, 1, star.main);
    block(1, 1, star.main);

    // 3. Cruz interna iluminada
    block(0, -1, star.light);
    block(0, 1, star.light);
    block(-1, 0, star.light);
    block(1, 0, star.light);
    if (twinkle === 1) {
      block(0, -2, star.light);
      block(0, 2, star.light);
      block(-2, 0, star.light);
      block(2, 0, star.light);
    }

    // 4. Núcleo brilhante central
    block(0, 0, star.core);
  }

  updateAndRender(elapsedTime, dt) {
    if (!this.canvas || !this.ctx) return;

    if (this.canvas.width !== this.nativeWidth || this.canvas.height !== this.nativeHeight) {
      this.canvas.width = this.nativeWidth;
      this.canvas.height = this.nativeHeight;
    }

    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    const frameIndex = Math.floor(elapsedTime * this.frameFps) % this.frameCount;
    const activeImg = this.frames[frameIndex];

    if (activeImg && activeImg.complete && activeImg.naturalWidth > 0) {
      ctx.drawImage(activeImg, 0, 0, this.nativeWidth, this.nativeHeight);
    } else if (this.frames[0] && this.frames[0].complete && this.frames[0].naturalWidth > 0) {
      ctx.drawImage(this.frames[0], 0, 0, this.nativeWidth, this.nativeHeight);
    } else {
      return;
    }

    // Cadência discreta estilo pixel art (~10 FPS)
    const steppedTime = Math.floor(elapsedTime * 10) / 10;

    // 1. Renderiza as 4 Estrelas CONAMA como propriedades independentes (100% sem fundo!)
    for (let i = 0; i < this.conamaStars.length; i++) {
      this.drawIndependentConamaStar(ctx, this.conamaStars[i], steppedTime);
    }

    // 2. Pétalas e folhas que se soltam das árvores do parque e caem suavemente com a brisa
    for (let i = 0; i < this.windLeaves.length; i++) {
      const leaf = this.windLeaves[i];
      leaf.x += leaf.vx * dt;
      leaf.y += (leaf.vy + Math.sin(steppedTime * leaf.freq + leaf.phase) * 6) * dt;

      if (leaf.x > this.nativeWidth + 10 || leaf.y > leaf.maxY) {
        this.windLeaves[i] = this.spawnLeafFromTree(leaf.emitter, 0);
        continue;
      }

      const px = Math.round(leaf.x / 2) * 2;
      const py = Math.round(leaf.y / 2) * 2;

      ctx.fillStyle = leaf.shadow;
      ctx.fillRect(px + 2, py + 2, 2, 2);
      ctx.fillStyle = leaf.main;
      ctx.fillRect(px, py, 2, 2);
    }

    // 3. Micro-partículas energéticas orbitando discretamente a esfera de reciclagem (x=205, y=475)
    const orbCx = 205;
    const orbCy = 475;
    for (let i = 0; i < this.orbSparks.length; i++) {
      const sp = this.orbSparks[i];
      const ang = sp.angle + steppedTime * sp.speed;
      const r = sp.radius + Math.sin(steppedTime * 2.2 + i) * 4;
      const sx = Math.round((orbCx + Math.cos(ang) * r) / 2) * 2;
      const sy = Math.round((orbCy + Math.sin(ang) * r * 0.85) / 2) * 2;

      ctx.fillStyle = sp.color;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}
