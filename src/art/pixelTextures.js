import * as THREE from 'three';

/**
 * Configura uma textura Canvas para Pixel Art Crocante (RN07 / E1-01: THREE.NearestFilter)
 */
export function applyNearestPixelFilter(texture) {
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Background 2D Pixel Art (Céu de Dia, Sol Pixelado, Nuvens e Horizonte de Parque em Pixel Art)
 */
export function createPixelSkyBackdropTexture() {
  const W = 160;
  const H = 96;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Faixas de céu azul vibrante em dithering/bandas pixel art (16-bit style)
  const skyBands = [
    { y: 0, h: 18, c: '#0284c7' },
    { y: 18, h: 18, c: '#0ea5e9' },
    { y: 36, h: 20, c: '#38bdf8' },
    { y: 56, h: 20, c: '#7dd3fc' },
    { y: 76, h: 20, c: '#bae6fd' }
  ];
  skyBands.forEach((b) => {
    ctx.fillStyle = b.c;
    ctx.fillRect(0, b.y, W, b.h);
  });

  // Fileira de dithering pixelado entre as faixas de céu
  for (let i = 0; i < skyBands.length - 1; i++) {
    const y = skyBands[i + 1].y;
    ctx.fillStyle = skyBands[i].c;
    for (let x = 0; x < W; x += 2) {
      ctx.fillRect(x, y, 1, 1);
      ctx.fillRect(x + 1, y - 1, 1, 1);
    }
  }

  // Nuvens 2D pixel art no horizonte
  const drawPixelCloud = (cx, cy, scale = 1) => {
    const px = (dx, dy, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(cx + dx * scale, cy + dy * scale, w * scale, h * scale);
    };
    px(2, 0, 10, 2, '#1e293b');
    px(0, 2, 14, 5, '#1e293b');
    px(3, 1, 8, 2, '#ffffff');
    px(1, 2, 12, 4, '#ffffff');
    px(2, 5, 10, 1, '#cbd5e1');
  };

  drawPixelCloud(14, 10, 2);
  drawPixelCloud(68, 6, 2);
  drawPixelCloud(118, 12, 2);

  // Colinas verdes pixeladas ao fundo
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 74, W, 22);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 78, W, 18);

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}

/**
 * E1-01 — Mapa 2D Pixel Art Completo do Chão de Parque / Praça (512x512, repeat 1x1)
 * Desenha uma Praça Pública real em Pixel Art com:
 * - Grande Pátio Circular Central em pedra de calçada portuguesa / paralelepípedo
 * - 4 Alamedas de Pedra (Norte, Sul, Leste, Oeste) + Passeio de Pedra Perimetral
 * - 4 Grandes Canteiros de Gramado de Parque com meio-fio de pedra, tufos de grama e flores nos cantos
 */
export function createArenaGridTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const cx = size / 2;
  const cy = size / 2;

  // 1. Preenche a base inteira com Gramado de Parque em Pixel Art (#338a44)
  const tileSize = 16;
  for (let ty = 0; ty < size; ty += tileSize) {
    for (let tx = 0; tx < size; tx += tileSize) {
      const checker = ((tx / tileSize) + (ty / tileSize)) % 2 === 0;
      ctx.fillStyle = checker ? '#358f47' : '#2e803e';
      ctx.fillRect(tx, ty, tileSize, tileSize);

      // Textura de graminha pixel art dentro do bloco
      ctx.fillStyle = '#43a656';
      ctx.fillRect(tx + 3, ty + 4, 2, 2);
      ctx.fillRect(tx + 11, ty + 10, 2, 2);
      ctx.fillStyle = '#236630';
      ctx.fillRect(tx + 4, ty + 6, 2, 1);
      ctx.fillRect(tx + 10, ty + 12, 2, 1);
    }
  }

  // Função auxiliar que determina se uma coordenada (x, y) pertence à calçada de pedra da praça
  const isStoneWalkway = (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const distCenter = Math.hypot(dx, dy);

    // Passeio de pedra na borda externa da praça
    const borderMargin = 36;
    if (
      x < borderMargin ||
      x >= size - borderMargin ||
      y < borderMargin ||
      y >= size - borderMargin
    ) {
      return true;
    }

    // Pátio circular central da praça
    if (distCenter <= 104) {
      return true;
    }

    // 4 Alamedas largas em cruz ligando o centro às 4 entradas da praça
    const pathHalfWidth = 44;
    if (Math.abs(dx) <= pathHalfWidth || Math.abs(dy) <= pathHalfWidth) {
      return true;
    }

    return false;
  };

  // 2. Desenha os Ladrilhos de Pedra / Calçada da Praça (blocos 16x16 de pedra natural)
  for (let ty = 0; ty < size; ty += 8) {
    for (let tx = 0; tx < size; tx += 8) {
      const sampleX = tx + 4;
      const sampleY = ty + 4;

      if (isStoneWalkway(sampleX, sampleY)) {
        const dx = sampleX - cx;
        const dy = sampleY - cy;
        const distCenter = Math.hypot(dx, dy);

        // Verifica se é borda/meio-fio (vizinho imediato é grama)
        const isEdge =
          !isStoneWalkway(sampleX - 8, sampleY) ||
          !isStoneWalkway(sampleX + 8, sampleY) ||
          !isStoneWalkway(sampleX, sampleY - 8) ||
          !isStoneWalkway(sampleX, sampleY + 8);

        if (isEdge) {
          // Meio-fio de pedra clara entre a calçada e o canteiro de grama
          ctx.fillStyle = '#706558';
          ctx.fillRect(tx, ty, 8, 8);
          ctx.fillStyle = '#dfd6c7';
          ctx.fillRect(tx + 1, ty + 1, 6, 6);
          ctx.fillStyle = '#f2ece1';
          ctx.fillRect(tx + 1, ty + 1, 6, 2);
        } else if (distCenter <= 94 && distCenter >= 82) {
          // Anel decorativo de pedra terracota ao redor do pátio central da praça
          ctx.fillStyle = '#7a523b';
          ctx.fillRect(tx, ty, 8, 8);
          ctx.fillStyle = '#c4835f';
          ctx.fillRect(tx + 1, ty + 1, 6, 6);
          ctx.fillStyle = '#dba07d';
          ctx.fillRect(tx + 1, ty + 1, 6, 1);
        } else if (distCenter <= 34) {
          // Rosácea / Coreto central de pedra da praça
          const innerRing = distCenter >= 24;
          ctx.fillStyle = '#6e6357';
          ctx.fillRect(tx, ty, 8, 8);
          ctx.fillStyle = innerRing ? '#c99e67' : '#d8cfc0';
          ctx.fillRect(tx + 1, ty + 1, 6, 6);
        } else {
          // Calçamento de pedra de praça (paralelepípedo / lajota serrada)
          const brickAlt = ((tx / 8) + (ty / 8)) % 2 === 0;
          ctx.fillStyle = '#8a7e70'; // rejunte de pedra
          ctx.fillRect(tx, ty, 8, 8);

          ctx.fillStyle = brickAlt ? '#cfc4b4' : '#c4b8a6';
          ctx.fillRect(tx + 1, ty + 1, 6, 6);

          // Luz e sombra sutil da pedra em pixel art
          ctx.fillStyle = '#ded5c8';
          ctx.fillRect(tx + 1, ty + 1, 6, 1);
          ctx.fillRect(tx + 1, ty + 1, 1, 6);
          ctx.fillStyle = '#aba090';
          ctx.fillRect(tx + 1, ty + 6, 6, 1);
          ctx.fillRect(tx + 6, ty + 1, 1, 6);
        }
      } else {
        // Dentro dos 4 Canteiros de Grama da Praça: adiciona detalhes de jardim (tufos e florzinhas)
        const hash = ((tx * 37) ^ (ty * 73)) & 31;
        if (hash === 0) {
          // Tufo de grama alta pixel art
          ctx.fillStyle = '#1d5728';
          ctx.fillRect(tx + 2, ty + 4, 4, 2);
          ctx.fillStyle = '#52bf66';
          ctx.fillRect(tx + 2, ty + 2, 1, 3);
          ctx.fillRect(tx + 4, ty + 1, 1, 3);
        } else if (hash === 1) {
          // Florzinha de jardim discreta no canteiro
          ctx.fillStyle = '#1d5728';
          ctx.fillRect(tx + 2, ty + 2, 4, 4);
          ctx.fillStyle = (tx + ty) % 3 === 0 ? '#ffd166' : '#f4effa';
          ctx.fillRect(tx + 3, ty + 3, 2, 2);
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  return texture;
}

/**
 * Fundo/Background 2D Pixelado do Parque ao redor da Praça (Gramado natural de parque em Pixel Art)
 */
export function createParkGrassTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base de grama natural de parque
  ctx.fillStyle = '#2e803e';
  ctx.fillRect(0, 0, size, size);

  const half = size / 2;
  ctx.fillStyle = '#358f47';
  ctx.fillRect(0, 0, half, half);
  ctx.fillRect(half, half, half, half);

  // Tufos de grama pixelados
  const tufts = [
    [8, 10], [22, 16], [12, 26],
    [40, 12], [52, 22], [44, 28],
    [10, 42], [24, 50], [16, 56],
    [38, 44], [50, 54], [54, 40]
  ];
  tufts.forEach(([gx, gy], i) => {
    ctx.fillStyle = '#1f5c2b';
    ctx.fillRect(gx, gy + 2, 4, 1);
    ctx.fillStyle = i % 2 === 0 ? '#47ad5b' : '#58bf6c';
    ctx.fillRect(gx, gy, 1, 2);
    ctx.fillRect(gx + 2, gy - 1, 1, 2);
  });

  // Pequenas margaridas/flores naturais discretas de parque
  const flowers = [
    { x: 16, y: 14, petal: '#fffbeb', core: '#f59e0b' },
    { x: 46, y: 46, petal: '#fde047', core: '#b45309' }
  ];
  flowers.forEach(({ x, y, petal, core }) => {
    ctx.fillStyle = '#1f5c2b';
    ctx.fillRect(x, y + 1, 3, 3);
    ctx.fillStyle = petal;
    ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = core;
    ctx.fillRect(x + 1, y + 1, 1, 1);
  });

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(22, 22);
  return texture;
}

/**
 * E1-01 — Textura 2D Pixel Art para as Muretas da Praça (Mureta de Pedra e Sebe Viva de Parque)
 */
export function createArenaBorderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Topo em sebe viva (arbusto podado de praça) + base de tijolo de pedra
  ctx.fillStyle = '#1b4d24';
  ctx.fillRect(0, 0, 64, 8);
  ctx.fillStyle = '#2b7a39';
  ctx.fillRect(0, 1, 64, 5);
  ctx.fillStyle = '#3da14f';
  for (let x = 2; x < 64; x += 8) {
    ctx.fillRect(x, 1, 5, 2);
  }

  // Base de blocos de pedra de praça
  ctx.fillStyle = '#5c5248';
  ctx.fillRect(0, 8, 64, 8);
  for (let i = 0; i < 4; i++) {
    const ox = i * 16;
    ctx.fillStyle = '#c4b8a6';
    ctx.fillRect(ox + 1, 9, 14, 6);
    ctx.fillStyle = '#ded5c8';
    ctx.fillRect(ox + 1, 9, 14, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(14, 1);
  return texture;
}

/**
 * Banco de Praça de Madeira e Ferro em 2D Pixel Art
 */
export function createPixelParkBenchTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 36;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const px = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };

  // Sombra no chão
  px(4, 21, 28, 2, 'rgba(15, 23, 42, 0.35)');

  // Estrutura de ferro fundido preto (#1e293b)
  px(6, 7, 3, 15, '#1e293b');
  px(27, 7, 3, 15, '#1e293b');
  px(4, 13, 3, 4, '#1e293b');
  px(29, 13, 3, 4, '#1e293b');

  // Ripas de madeira envernizada do encosto
  px(5, 8, 26, 3, '#451a03');
  px(6, 8, 24, 2, '#b45309');
  px(6, 8, 24, 1, '#d97706');

  px(5, 11, 26, 3, '#451a03');
  px(6, 11, 24, 2, '#92400e');

  // Assento de madeira
  px(4, 15, 28, 3, '#451a03');
  px(5, 15, 26, 2, '#d97706');

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}

/**
 * Poste de Luz Clássico de Praça em 2D Pixel Art
 */
export function createPixelParkLampTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const px = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };

  // Base e coluna de ferro verde-escuro/preto clássico de praça
  px(8, 42, 8, 5, '#1e293b');
  px(9, 38, 6, 4, '#334155');
  px(11, 13, 2, 26, '#1e293b');
  px(9, 13, 6, 2, '#334155');

  // Luminária superior estilo praça
  px(8, 6, 8, 7, '#1e293b');
  px(9, 7, 6, 5, '#fef08a');
  px(10, 8, 4, 3, '#ffffff');
  // Chapéu do poste
  px(7, 5, 10, 2, '#1e293b');
  px(10, 3, 4, 2, '#1e293b');

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}

/**
 * Árvores 2D Pixel Art (Substitui as esferas 3D por sprites 2D pixelados autênticos com contorno escuro!)
 * Retorna 4 variações: Carvalho Verde, Ipê Amarelo, Sakura Rosa e Laranjeira
 */
export function createPixelTreeTextures() {
  const palettes = [
    { dark: '#0d4722', mid: '#16a34a', light: '#4ade80', fruit: '#ff2a2a' }, // Carvalho Verde com maçãs
    { dark: '#995c00', mid: '#f59e0b', light: '#fde047', fruit: '#ffffff' }, // Ipê Amarelo
    { dark: '#831843', mid: '#ec4899', light: '#fbcfe8', fruit: '#fff1f2' }, // Cerejeira Sakura Rosa
    { dark: '#115e59', mid: '#10b981', light: '#6ee7b7', fruit: '#fb923c' }  // Laranjeira
  ];

  return palettes.map((pal) => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
    };

    // Sombra na base do tronco
    px(12, 44, 16, 3, 'rgba(15, 23, 42, 0.45)');

    // Tronco de madeira pixel art com contorno escuro #18100c
    px(15, 26, 10, 19, '#18100c');
    px(13, 42, 14, 3, '#18100c');
    px(16, 27, 8, 17, '#6b3e1b');
    px(17, 27, 3, 17, '#8f5629');
    px(19, 31, 2, 10, '#4d2b11');

    // Contorno externo escuro da copa pixelada (#141020)
    px(10, 3, 20, 4, '#141020');
    px(6, 6, 28, 6, '#141020');
    px(3, 11, 34, 12, '#141020');
    px(6, 22, 28, 6, '#141020');
    px(10, 27, 20, 3, '#141020');

    // Camada escura/sombra da folhagem
    px(11, 4, 18, 4, pal.dark);
    px(7, 7, 26, 6, pal.dark);
    px(4, 12, 32, 11, pal.dark);
    px(7, 22, 26, 5, pal.dark);
    px(11, 26, 18, 3, pal.dark);

    // Camada média vibrante da copa
    px(11, 4, 18, 3, pal.mid);
    px(8, 7, 24, 14, pal.mid);
    px(5, 12, 29, 9, pal.mid);
    px(9, 21, 22, 4, pal.mid);

    // Tufos iluminados pelo sol no topo/esquerda
    px(12, 5, 14, 3, pal.light);
    px(9, 8, 16, 5, pal.light);
    px(6, 13, 12, 5, pal.light);
    px(23, 10, 7, 4, pal.light);

    // Flores / Frutinhas pixeladas na copa
    px(11, 10, 2, 2, pal.fruit);
    px(25, 14, 2, 2, pal.fruit);
    px(16, 18, 2, 2, pal.fruit);
    px(9, 19, 2, 2, pal.fruit);
    px(28, 19, 2, 2, pal.fruit);

    const tex = new THREE.CanvasTexture(canvas);
    return applyNearestPixelFilter(tex);
  });
}

/**
 * Arbustos Floridos e Girassóis 2D Pixel Art para o Parque
 */
export function createPixelFlowerBushTextures() {
  const flowerColors = ['#ff2a55', '#ffcc00', '#00a8ff', '#f472b6'];

  return flowerColors.map((fCol) => {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    // Contorno preto pixelado do arbusto
    px(5, 8, 14, 3, '#141020');
    px(3, 11, 18, 9, '#141020');
    px(2, 19, 20, 3, '#141020');

    // Folhagem verde viva do arbusto
    px(6, 9, 12, 3, '#15803d');
    px(4, 12, 16, 9, '#15803d');
    px(6, 9, 12, 2, '#22c55e');
    px(5, 11, 14, 6, '#22c55e');
    px(7, 10, 8, 4, '#4ade80');

    // 3 Flores grandes pixeladas no arbusto
    const pts = [
      [6, 11],
      [14, 10],
      [10, 15]
    ];
    pts.forEach(([fx, fy]) => {
      px(fx, fy, 4, 4, fCol);
      px(fx + 1, fy + 1, 2, 2, '#fffbeb');
    });

    const tex = new THREE.CanvasTexture(canvas);
    return applyNearestPixelFilter(tex);
  });
}

/**
 * Lixeiras Ecológicas CONAMA 2D Pixel Art para os 4 Cantos da Arena
 */
export function createPixelConamaBinTextures() {
  const bins = [
    { id: 'PLASTIC', main: '#ff2222', light: '#ff7a7a', dark: '#990000', label: 'Q' },
    { id: 'PAPER', main: '#0066ff', light: '#66a3ff', dark: '#003380', label: 'E' },
    { id: 'GLASS', main: '#00c853', light: '#69f0ae', dark: '#006622', label: 'R' },
    { id: 'METAL', main: '#ffb700', light: '#ffe066', dark: '#996600', label: 'F' }
  ];

  const map = {};
  bins.forEach((b) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const px = (x, y, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, w, h);
    };

    // Contorno escuro pixel art (#141020)
    px(8, 3, 16, 3, '#141020');
    px(5, 6, 22, 5, '#141020');
    px(7, 11, 18, 26, '#141020');

    // Tampa da lixeira
    px(9, 4, 14, 2, b.light);
    px(6, 7, 20, 3, b.main);
    px(6, 7, 20, 1, b.light);

    // Corpo da lixeira CONAMA
    px(8, 11, 16, 24, b.main);
    px(9, 11, 3, 24, b.light);
    px(21, 11, 3, 24, b.dark);

    // Faixa branca central com a letra da tecla
    px(8, 17, 16, 10, '#ffffff');
    px(8, 17, 16, 1, '#cbd5e1');
    px(8, 26, 16, 1, '#94a3b8');

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, 16, 22);

    const tex = new THREE.CanvasTexture(canvas);
    map[b.id] = applyNearestPixelFilter(tex);
  });

  return map;
}

/**
 * Nuvem Fofinha 2D Pixel Art
 */
export function createPixelCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 48;
  canvas.height = 24;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const px = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };

  // Contorno pixelado escuro azul-marinho
  px(14, 2, 20, 3, '#0f172a');
  px(8, 5, 32, 4, '#0f172a');
  px(4, 9, 40, 10, '#0f172a');
  px(8, 19, 32, 2, '#0f172a');

  // Corpo branco brilhante da nuvem
  px(15, 3, 18, 4, '#ffffff');
  px(9, 6, 30, 5, '#ffffff');
  px(5, 10, 38, 8, '#ffffff');

  // Sombra celeste na base da nuvem
  px(6, 16, 36, 2, '#bae6fd');
  px(9, 18, 30, 1, '#7dd3fc');

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}

/**
 * E1-02 — Sprite Pixel Art 2.5D do Protagonista (Modelo original Until Then com cores vivas!)
 */
export function createProtagonistTextures() {
  const frames = [0, 1, 2].map((stepFrame) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const bobY = stepFrame === 0 ? 0 : -1;
    const leftLegOffset = stepFrame === 1 ? -2 : stepFrame === 2 ? 1 : 0;
    const rightLegOffset = stepFrame === 2 ? -2 : stepFrame === 1 ? 1 : 0;

    const px = (x, y, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y + bobY, w, h);
    };

    // Mochila azul nas costas (lado esquerdo do sprite, igual @Docs/until-then-2.webp)
    px(6, 18, 5, 13, '#0b4fd9');
    px(7, 19, 3, 11, '#2678ff');
    px(8, 16, 3, 2, '#ffcc00'); // Chaveiro amarelo na mochila

    // Cabelo castanho bagunçado (Modelo original Until Then protagonist)
    px(10, 3, 12, 3, '#3b2016');
    px(8, 5, 16, 5, '#5c3222');
    px(7, 7, 18, 4, '#75412c');
    // Mechas soltas no topo e laterais
    px(9, 2, 3, 2, '#5c3222');
    px(15, 1, 4, 2, '#75412c');
    px(22, 4, 3, 2, '#5c3222');
    px(6, 9, 2, 3, '#3b2016');
    px(24, 8, 2, 3, '#3b2016');

    // Rosto / Cabeça
    px(10, 9, 12, 8, '#f5ba94');
    px(10, 15, 12, 2, '#de9c73');
    // Franja sobre a testa
    px(10, 8, 12, 2, '#4a281b');
    px(11, 10, 3, 1, '#5c3222');
    px(17, 10, 4, 1, '#5c3222');
    // Sobrancelhas e olhos expressivos pixelados
    px(12, 11, 3, 1, '#2b160e');
    px(18, 11, 3, 1, '#2b160e');
    px(13, 12, 2, 2, '#140f14');
    px(19, 12, 2, 2, '#140f14');
    // Pescoço
    px(14, 17, 4, 2, '#d4916a');

    // Camisa escolar branca com gola e gravata (Until Then)
    px(9, 18, 14, 13, '#e2e8f0');
    px(10, 19, 12, 11, '#ffffff');
    // Sombras de dobra da camisa
    px(11, 24, 2, 6, '#cbd5e1');
    px(19, 22, 2, 8, '#cbd5e1');
    // Gola e gravata verde-acinzentada
    px(13, 18, 6, 2, '#BAC6D8');
    px(15, 19, 2, 6, '#3b6e63');

    // Alças azuis da mochila sobre os ombros
    px(10, 18, 2, 10, '#0f5ee6');
    px(20, 18, 2, 10, '#0f5ee6');

    // Braços (mangas curtas brancas + antebraços)
    px(7, 19, 3, 5, '#dbe4f0');
    px(22, 19, 3, 5, '#dbe4f0');
    px(7, 24, 3, 5, '#eda982');
    px(22, 24, 3, 5, '#eda982');
    // Luva/pulso canalizador energético
    px(7, 27, 3, 2, '#ffcc00');
    px(22, 27, 3, 2, '#00f5d4');

    // Calça verde-oliva viva (exatamente o modelo original de @Docs/until-then-2.webp)
    ctx.fillStyle = '#2f5e35';
    ctx.fillRect(10, 31, 6, 12 + leftLegOffset);
    ctx.fillRect(16, 31, 6, 12 + rightLegOffset);

    // Luz e dobra da calça verde
    ctx.fillStyle = '#43804a';
    ctx.fillRect(11, 32, 3, 10 + leftLegOffset);
    ctx.fillRect(17, 32, 3, 10 + rightLegOffset);
    ctx.fillStyle = '#1f4224';
    ctx.fillRect(15, 33, 1, 9);

    // Sapatos marrom-escuros originais
    ctx.fillStyle = '#2e1b13';
    ctx.fillRect(9, 43 + leftLegOffset, 7, 3);
    ctx.fillRect(16, 43 + rightLegOffset, 7, 3);
    ctx.fillStyle = '#523224';
    ctx.fillRect(10, 43 + leftLegOffset, 4, 2);
    ctx.fillRect(17, 43 + rightLegOffset, 4, 2);

    const tex = new THREE.CanvasTexture(canvas);
    return applyNearestPixelFilter(tex);
  });

  return frames;
}

/**
 * E2-01 / E2-05 / E2-06 — Sprites Pixel Art 2.5D dos Inimigos Recicláveis com CONTORNO PRETO FORTE e CORES ULTRA VIVAS!
 * Estágio 1:
 * - PLASTIC_PET     (Vermelho / Q): Garrafa PET Vermelha Rubi
 * - PAPER_BOX       (Azul / E):     Caixa de Papelão Dourada com Faixa Azul Elétrico
 * - GLASS_BOTTLE    (Verde / R):    Garrafa de Vidro Verde Esmeralda
 * - METAL_NUT       (Amarelo / F):  Porca de Metal Ouro Vivo
 * Estágio 2 (acumula com Estágio 1 aos 01:30):
 * - PLASTIC_BAG     (Vermelho / Q): Sacola Plástica com Alças
 * - PAPER_NEWSPAPER (Azul / E):     Jornal Velho Dobrado com Cabeçalho Azul
 * - GLASS_JAR       (Verde / R):    Pote de Vidro com Tampa Metálica
 * - METAL_CAN       (Amarelo / F):  Lata de Alumínio Dourada com Lacre
 */
export function createEnemyTextures() {
  const variantIds = [
    'PLASTIC_PET',
    'PLASTIC_BAG',
    'PAPER_BOX',
    'PAPER_NEWSPAPER',
    'GLASS_BOTTLE',
    'GLASS_JAR',
    'METAL_NUT',
    'METAL_CAN'
  ];
  const map = {};

  variantIds.forEach((variantId) => {
    map[variantId] = [0, 1].map((animFrame) => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 36;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const bob = animFrame === 0 ? 0 : -1;
      const legL = animFrame === 0 ? 0 : -2;
      const legR = animFrame === 1 ? 0 : -2;

      const px = (x, y, w, h, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y + bob, w, h);
      };

      // Perninhas pretas nítidas
      ctx.fillStyle = '#120d1a';
      ctx.fillRect(9, 29 + legL, 5, 6);
      ctx.fillRect(18, 29 + legR, 5, 6);

      if (variantId === 'PLASTIC_PET') {
        // ==================== GARRAFA PET (VERMELHO VIVO — Q · ESTÁGIO 1) ====================
        // Contorno preto pixel art (#120d1a)
        px(11, 1, 10, 6, '#120d1a');
        px(10, 6, 12, 4, '#120d1a');
        px(7, 9, 18, 22, '#120d1a');

        // Tampa e gargalo vermelho vivo
        px(12, 2, 8, 3, '#ff1a1a');
        px(13, 2, 6, 1, '#ff9999');
        px(11, 6, 10, 3, '#ff4d4d');

        // Corpo vermelho-rubi super saturado
        px(8, 10, 16, 20, '#cc0000');
        px(9, 11, 14, 18, '#ff1a1a');
        // Brilho especular branco forte na lateral
        px(10, 11, 2, 17, '#ffffff');
        // Rótulo central vermelho-escuro com borda amarela viva
        px(8, 15, 16, 8, '#800000');
        px(8, 15, 16, 1, '#ffcc00');
        px(8, 22, 16, 1, '#ffcc00');

        // Olhos grandes e expressivos
        px(10, 17, 4, 4, '#ffffff');
        px(18, 17, 4, 4, '#ffffff');
        px(12, 18, 2, 3, '#120d1a');
        px(20, 18, 2, 3, '#120d1a');
      } else if (variantId === 'PLASTIC_BAG') {
        // ==================== SACOLA PLÁSTICA (VERMELHO VIVO — Q · ESTÁGIO 2) ====================
        // Contorno preto pixel art das 2 alças no topo e do corpo inflado da sacola
        px(6, 2, 6, 9, '#120d1a');
        px(20, 2, 6, 9, '#120d1a');
        px(4, 9, 24, 21, '#120d1a');
        px(6, 29, 20, 2, '#120d1a');

        // Alças vermelhas com recorte interno vazado (alças icônicas de sacola!)
        px(7, 3, 4, 7, '#ff2a2a');
        px(8, 5, 2, 4, '#120d1a');
        px(21, 3, 4, 7, '#ff2a2a');
        px(22, 5, 2, 4, '#120d1a');
        px(7, 3, 4, 1, '#ff9999');
        px(21, 3, 4, 1, '#ff9999');

        // Corpo vermelho-rubi com dobras plásticas e brilho especular
        px(5, 10, 22, 19, '#b30000');
        px(6, 11, 20, 17, '#ff1a1a');
        px(7, 11, 6, 16, '#ff4d4d');
        // Vincos/dobras de plástico amassado
        px(8, 12, 2, 14, '#ffffff');
        px(22, 13, 2, 12, '#cc0000');
        px(14, 11, 4, 2, '#990000');
        // Faixa branca/amarela estilizada de sacola de mercado
        px(6, 23, 20, 3, '#ffffff');
        px(6, 25, 20, 1, '#ff9999');
        px(11, 24, 10, 1, '#ff1a1a');

        // Olhos travessos inclinados
        px(9, 15, 5, 5, '#ffffff');
        px(18, 15, 5, 5, '#ffffff');
        px(11, 17, 2, 3, '#120d1a');
        px(20, 17, 2, 3, '#120d1a');
        px(9, 14, 5, 1, '#120d1a');
        px(18, 14, 5, 1, '#120d1a');
      } else if (variantId === 'PAPER_BOX') {
        // ==================== CAIXA DE PAPELÃO (AZUL ELÉTRICO + ÂMBAR — E · ESTÁGIO 1) ====================
        // Contorno preto pixel art (#120d1a)
        px(3, 5, 26, 6, '#120d1a');
        px(5, 9, 22, 22, '#120d1a');

        // Abas superiores de papelão dourado
        px(4, 6, 10, 4, '#f59e0b');
        px(18, 6, 10, 4, '#fbbf24');

        // Corpo da caixa com sombras ricas e fita Azul CONAMA ultra viva
        px(6, 10, 20, 20, '#b45309');
        px(7, 11, 18, 18, '#f59e0b');
        px(8, 11, 8, 18, '#fbbf24');

        // Faixa Azul CONAMA super saturada (#0055ff)
        px(6, 14, 20, 8, '#003399');
        px(7, 15, 18, 6, '#0066ff');
        px(15, 10, 2, 20, '#0066ff');
        px(7, 15, 18, 1, '#66b2ff');

        // Olhos expressivos
        px(9, 16, 4, 4, '#ffffff');
        px(19, 16, 4, 4, '#ffffff');
        px(11, 17, 2, 3, '#120d1a');
        px(21, 17, 2, 3, '#120d1a');
      } else if (variantId === 'PAPER_NEWSPAPER') {
        // ==================== JORNAL VELHO DOBRADO (AZUL CONAMA + FOLHA CREME — E · ESTÁGIO 2) ====================
        // Contorno preto pixel art da pilha dobrada de jornal com aba superior
        px(4, 3, 24, 28, '#120d1a');
        px(2, 7, 4, 22, '#120d1a');

        // Folha traseira dobrada (dá volume de jornal aberto/dobrado)
        px(3, 8, 3, 20, '#94a3b8');
        px(4, 8, 2, 19, '#cbd5e1');

        // Página frontal creme/branca de jornal
        px(5, 4, 22, 26, '#e2e8f0');
        px(6, 5, 20, 24, '#f8fafc');
        // Sombra na borda inferior e direita
        px(6, 27, 20, 2, '#cbd5e1');
        px(24, 5, 2, 24, '#cbd5e1');

        // Cabeçalho Azul CONAMA vibrante ("ECO NEWS")
        px(6, 5, 20, 6, '#003399');
        px(6, 6, 20, 4, '#0066ff');
        px(7, 6, 18, 1, '#66b2ff');
        // Manchete pixelada branca no cabeçalho
        px(8, 7, 6, 2, '#ffffff');
        px(16, 7, 8, 2, '#bae6fd');

        // Colunas de texto de jornal abaixo dos olhos
        px(7, 21, 8, 2, '#334155');
        px(7, 24, 8, 1, '#64748b');
        px(17, 21, 7, 5, '#0066ff');
        px(18, 22, 5, 3, '#93c5fd');

        // Olhos expressivos com sobrancelha azul
        px(8, 13, 5, 5, '#120d1a');
        px(19, 13, 5, 5, '#120d1a');
        px(9, 14, 3, 3, '#ffffff');
        px(20, 14, 3, 3, '#ffffff');
        px(10, 15, 2, 2, '#0055ff');
        px(21, 15, 2, 2, '#0055ff');
      } else if (variantId === 'GLASS_BOTTLE') {
        // ==================== GARRAFA DE VIDRO (VERDE ESMERALDA VIVO — R · ESTÁGIO 1) ====================
        // Contorno preto pixel art (#120d1a)
        px(12, 1, 8, 9, '#120d1a');
        px(8, 9, 16, 4, '#120d1a');
        px(7, 12, 18, 19, '#120d1a');

        // Gargalo verde-esmeralda
        px(13, 2, 6, 2, '#69f0ae');
        px(13, 4, 6, 6, '#00c853');

        // Corpo verde-esmeralda vivo
        px(9, 10, 14, 3, '#009624');
        px(8, 13, 16, 17, '#007a1c');
        px(9, 13, 14, 16, '#00e676');
        // Brilho cristalino branco
        px(10, 12, 2, 16, '#ffffff');

        // Rótulo central verde-escuro
        px(8, 16, 16, 7, '#004d1a');
        // Olhos amarelos/brancos brilhantes
        px(10, 17, 4, 4, '#ffff00');
        px(18, 17, 4, 4, '#ffff00');
        px(12, 18, 2, 3, '#120d1a');
        px(20, 18, 2, 3, '#120d1a');
      } else if (variantId === 'GLASS_JAR') {
        // ==================== POTE DE VIDRO DE CONSERVA (VERDE ESMERALDA — R · ESTÁGIO 2) ====================
        // Contorno preto pixel art: tampa larga metálica + corpo largo e robusto de pote
        px(7, 3, 18, 6, '#120d1a');
        px(4, 8, 24, 23, '#120d1a');

        // Tampa rosqueada metálica prateada no topo
        px(8, 4, 16, 4, '#94a3b8');
        px(9, 4, 14, 2, '#e2e8f0');
        px(10, 6, 2, 2, '#475569');
        px(15, 6, 2, 2, '#475569');
        px(20, 6, 2, 2, '#475569');

        // Corpo largo de vidro verde-esmeralda espesso
        px(5, 9, 22, 21, '#006b1b');
        px(6, 10, 20, 19, '#00c853');
        px(7, 11, 18, 17, '#00e676');

        // Reflexos cristalinos grossos nas laterais do pote
        px(7, 11, 3, 16, '#b9f6ca');
        px(8, 11, 1, 15, '#ffffff');
        px(23, 12, 2, 13, '#69f0ae');

        // Faixa de rótulo escuro no centro com olhos amarelos ferozes
        px(6, 15, 20, 8, '#004d1a');
        px(6, 15, 20, 1, '#a7f3d0');
        px(6, 22, 20, 1, '#a7f3d0');

        px(9, 17, 5, 4, '#ffff00');
        px(18, 17, 5, 4, '#ffff00');
        px(11, 18, 2, 3, '#120d1a');
        px(20, 18, 2, 3, '#120d1a');
      } else if (variantId === 'METAL_NUT') {
        // ==================== PORCA DE METAL (OURO / AMARELO VIVO — F · ESTÁGIO 1) ====================
        // Contorno preto octogonal forte (#120d1a)
        px(8, 4, 16, 26, '#120d1a');
        px(4, 8, 24, 18, '#120d1a');

        // Corpo metálico amarelo-ouro super vivo
        px(9, 5, 14, 24, '#d97706');
        px(5, 9, 22, 16, '#d97706');
        px(10, 6, 12, 22, '#ffcc00');
        px(6, 10, 20, 14, '#ffcc00');

        // Brilho metálico superior
        px(10, 6, 12, 3, '#ffff99');
        px(7, 10, 3, 12, '#ffff99');

        // Rosca central escura com olhos vermelhos/brancos vivos
        px(10, 12, 12, 10, '#120d1a');
        px(10, 14, 4, 4, '#ffffff');
        px(18, 14, 4, 4, '#ffffff');
        px(12, 15, 2, 3, '#ff0033');
        px(20, 15, 2, 3, '#ff0033');
      } else {
        // ==================== LATA DE ALUMÍNIO (AMARELO OURO + LACRE PRATA — F · ESTÁGIO 2) ====================
        // Contorno preto cilíndrico com lacre puxador no topo
        px(13, 1, 7, 4, '#120d1a');
        px(7, 4, 18, 27, '#120d1a');

        // Lacre metálico de abrir no topo
        px(14, 2, 5, 2, '#e2e8f0');
        px(16, 2, 2, 1, '#475569');

        // Tampa e base prateadas de alumínio
        px(8, 5, 16, 3, '#cbd5e1');
        px(9, 5, 14, 2, '#f8fafc');
        px(8, 28, 16, 2, '#94a3b8');

        // Cilindro metálico amarelo CONAMA super saturado
        px(8, 8, 16, 20, '#b45309');
        px(9, 8, 14, 20, '#ffcc00');
        // Brilho vertical especular de alumínio
        px(10, 8, 3, 20, '#fff799');
        px(11, 8, 1, 20, '#ffffff');

        // Faixa energética escura com raio/listra laranja
        px(8, 14, 16, 9, '#1e293b');
        px(8, 14, 16, 1, '#ff7b00');
        px(8, 22, 16, 1, '#ff7b00');

        // Olhos intensos na faixa central
        px(9, 16, 5, 4, '#ffffff');
        px(18, 16, 5, 4, '#ffffff');
        px(11, 17, 2, 3, '#ff0033');
        px(20, 17, 2, 3, '#ff0033');
      }

      const tex = new THREE.CanvasTexture(canvas);
      return applyNearestPixelFilter(tex);
    });
  });

  // Aliases de compatibilidade para a chave de categoria CONAMA
  map.PLASTIC = map.PLASTIC_PET;
  map.PAPER = map.PAPER_BOX;
  map.GLASS = map.GLASS_BOTTLE;
  map.METAL = map.METAL_NUT;

  return map;
}

/**
 * E2-05 / E2-06 — Cria etiqueta pixelada flutuante com alto contraste e cores vivas (ex: "[Q] SACOLA PLÁSTICA")
 */
export function createEnemyBinBadgeTexture(binElement, itemNameOverride = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 188;
  canvas.height = 36;
  const ctx = canvas.getContext('2d');

  // Fundo azul-noite sólido 100% opaco com borda grossa na cor CONAMA
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, 1, 186, 34);
  ctx.lineWidth = 4;
  ctx.strokeStyle = binElement.hex;
  ctx.strokeRect(2, 2, 184, 32);

  // Quadrado da Tecla da Lixeira à esquerda
  ctx.fillStyle = binElement.hex;
  ctx.fillRect(4, 4, 30, 28);

  ctx.fillStyle = binElement.id === 'METAL' ? '#0f172a' : '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(binElement.keyAlt, 19, 18);

  // Nome do Item Reciclável bem branco e legível (com ajuste automático de largura máxima)
  const displayName = (itemNameOverride || binElement.enemyItemName).toUpperCase();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(displayName, 40, 18, 140);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * E2-04 — Etiqueta especial para Inimigos Blindados (mostra escudo + dica "USE [E]")
 */
export function createArmoredEnemyBadgeTexture(binElement, itemNameOverride = null) {
  const canvas = document.createElement('canvas');
  canvas.width = 224;
  canvas.height = 42;
  const ctx = canvas.getContext('2d');

  // Fundo violeta metálico com borda dupla dourada/roxa
  ctx.fillStyle = '#1e1035';
  ctx.fillRect(1, 1, 222, 40);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#c084fc';
  ctx.strokeRect(2, 2, 220, 38);

  // Quadrado da Tecla da Lixeira à esquerda
  ctx.fillStyle = binElement.hex;
  ctx.fillRect(5, 5, 30, 32);

  ctx.fillStyle = binElement.id === 'METAL' ? '#0f172a' : '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(binElement.keyAlt, 20, 21);

  // Nome do item + subtítulo de quebra de blindagem
  const displayName = (itemNameOverride || binElement.enemyItemName).toUpperCase();
  ctx.fillStyle = '#f5d0fe';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`🛡 ${displayName}`, 41, 14, 176);

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px monospace';
  ctx.fillText(`BLINDADO · QUEBRE [${binElement.keyAlt}+E]`, 41, 30, 176);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * E1-02 — Retícula de Mira Isométrica no Chão (THREE.NearestFilter) com contorno forte
 */
export function createReticleTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Contorno externo preto para contraste total no chão
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, 1, 9, 4);
  ctx.fillRect(1, 1, 4, 9);
  ctx.fillRect(22, 1, 9, 4);
  ctx.fillRect(27, 1, 4, 9);
  ctx.fillRect(1, 27, 9, 4);
  ctx.fillRect(1, 22, 4, 9);
  ctx.fillRect(22, 27, 9, 4);
  ctx.fillRect(27, 22, 4, 9);

  // Cantoneiras vermelhas vivas
  ctx.fillStyle = '#ff1a1a';
  ctx.fillRect(2, 2, 7, 2);
  ctx.fillRect(2, 2, 2, 7);
  ctx.fillRect(23, 2, 7, 2);
  ctx.fillRect(28, 2, 2, 7);
  ctx.fillRect(2, 28, 7, 2);
  ctx.fillRect(2, 23, 2, 7);
  ctx.fillRect(23, 28, 7, 2);
  ctx.fillRect(28, 23, 2, 7);

  // Cruz interna azul/amarela viva
  ctx.fillStyle = '#0055ff';
  ctx.fillRect(14, 5, 4, 6);
  ctx.fillRect(14, 21, 4, 6);
  ctx.fillRect(5, 14, 6, 4);
  ctx.fillRect(21, 14, 6, 4);

  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(13, 13, 6, 6);
  ctx.fillStyle = '#120d1a';
  ctx.fillRect(15, 15, 2, 2);

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}

/**
 * E1-03 — Pacote de Texturas Pixel Art (THREE.NearestFilter) para Obstáculos Diversos da Praça
 * (Chafariz/Canteiro Florido, Ecoponto CONAMA, Banco com Vaso, Rocha Florida, Composteira e Totem Solar)
 */
export function createParkObstacleTextures() {
  const makeTex = (w, h, drawFn) => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    return applyNearestPixelFilter(new THREE.CanvasTexture(canvas));
  };

  // 1. Tijolinho quente de jardim / canteiro de praça
  const brickPlanter = makeTex(32, 24, (ctx, w, h) => {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, 0, w, h);
    const brickColors = ['#c25934', '#d46a42', '#b54d2b', '#de7a52'];
    for (let row = 0; row < 4; row++) {
      const y = row * 6;
      const offset = (row % 2) * 5;
      for (let bx = -offset; bx < w; bx += 10) {
        const col = brickColors[(row * 3 + Math.abs(bx)) % brickColors.length];
        ctx.fillStyle = col;
        ctx.fillRect(bx + 1, y + 1, 8, 4);
        ctx.fillStyle = '#f2a27c';
        ctx.fillRect(bx + 1, y + 1, 8, 1);
      }
    }
    ctx.fillStyle = '#e7e5e4';
    ctx.fillRect(0, 0, w, 2);
    ctx.fillStyle = '#57534e';
    ctx.fillRect(0, h - 2, w, 2);
  });

  // 2. Solo gramado com flores coloridas para canteiros
  const planterSoil = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#2d7a3e';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = ((x + y) / 4) % 2 === 0 ? '#37944b' : '#266b35';
        ctx.fillRect(x, y, 4, 4);
      }
    }
    // Folhinhas e flores pixeladas
    const flowers = [
      [5, 6, '#fb7185'], [11, 22, '#facc15'], [23, 8, '#38bdf8'],
      [25, 23, '#f472b6'], [16, 14, '#fde047'], [7, 25, '#ffffff'],
      [21, 17, '#fb923c']
    ];
    flowers.forEach(([fx, fy, color]) => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(fx - 1, fy + 1, 4, 2);
      ctx.fillStyle = color;
      ctx.fillRect(fx, fy, 3, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fx + 1, fy + 1, 1, 1);
    });
  });

  // 3. Madeira ripada quente estilo parque Until Then
  const woodSlats = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = y % 16 === 0 ? '#b46a37' : '#a15b2d';
      ctx.fillRect(1, y + 1, w - 2, 6);
      ctx.fillStyle = '#d48c55';
      ctx.fillRect(1, y + 1, w - 2, 1);
      ctx.fillStyle = '#7c431f';
      ctx.fillRect(4 + (y % 12), y + 3, 6, 1);
      ctx.fillRect(18, y + 5, 7, 1);
    }
    ctx.fillStyle = '#3b1f0d';
    ctx.fillRect(0, 0, 1, h);
    ctx.fillRect(w - 1, 0, 1, h);
  });

  // 4. Telhado pixelado azul-petróleo / verde-parque para o Ecoponto
  const roofTiles = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#0f3d4c';
    ctx.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) {
      const y = row * 8;
      const shift = (row % 2) * 4;
      for (let x = -shift; x < w; x += 8) {
        ctx.fillStyle = row % 2 === 0 ? '#0d9488' : '#14b8a6';
        ctx.fillRect(x + 1, y + 1, 6, 6);
        ctx.fillStyle = '#5eead4';
        ctx.fillRect(x + 1, y + 1, 6, 1);
      }
    }
  });

  // 5. Rocha de parque com musgo natural
  const mossyRock = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 0, w, h);
    // Facetas de pedra
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2, 2, 18, 12);
    ctx.fillRect(12, 14, 16, 10);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(3, 3, 12, 5);
    ctx.fillRect(15, 15, 10, 4);
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 24, w, 8);
    ctx.fillRect(22, 4, 10, 10);
    // Musgo vibrante no topo e rachaduras
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 14, 5);
    ctx.fillRect(16, 0, 16, 4);
    ctx.fillRect(4, 21, 9, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(2, 1, 9, 2);
    ctx.fillRect(18, 1, 10, 2);
    ctx.fillRect(6, 21, 5, 2);
  });

  // 6. Painel Solar Fotovoltaico para o Totem Solar
  const solarPanel = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#2563eb';
    for (let y = 3; y < h - 3; y += 7) {
      for (let x = 3; x < w - 3; x += 7) {
        ctx.fillRect(x, y, 5, 5);
      }
    }
    // Reflexo diagonal luminoso
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(4, 4, 5, 2);
    ctx.fillRect(11, 11, 5, 2);
    ctx.fillRect(18, 18, 5, 2);
  });

  // 7. Tela ecológica do Totem Solar / Placa de Compostagem
  const ecoScreen = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(3, 3, 26, 26);
    // Moldura neon verde-água
    ctx.fillStyle = '#2dd4bf';
    ctx.fillRect(4, 4, 24, 2);
    ctx.fillRect(4, 26, 24, 2);
    // Folha central + barras CONAMA
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(13, 8, 6, 3);
    ctx.fillRect(11, 11, 10, 5);
    ctx.fillRect(14, 16, 4, 2);
    ctx.fillStyle = '#ff3b30';
    ctx.fillRect(6, 21, 4, 3);
    ctx.fillStyle = '#007aff';
    ctx.fillRect(11, 21, 4, 3);
    ctx.fillStyle = '#34c759';
    ctx.fillRect(16, 21, 4, 3);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(21, 21, 5, 3);
  });

  // 8. Folhagem densa pixel art para arbustos floridos
  const foliage = makeTex(32, 32, (ctx, w, h) => {
    ctx.fillStyle = '#14532d';
    ctx.fillRect(0, 0, w, h);
    const blobs = [
      [2, 2, 12, 10, '#166534'],
      [14, 4, 15, 11, '#15803d'],
      [3, 14, 14, 14, '#15803d'],
      [16, 15, 13, 14, '#166534'],
      [5, 4, 8, 6, '#22c55e'],
      [18, 6, 9, 5, '#4ade80'],
      [8, 17, 7, 5, '#22c55e']
    ];
    blobs.forEach(([x, y, bw, bh, c]) => {
      ctx.fillStyle = c;
      ctx.fillRect(x, y, bw, bh);
    });
    // Flores vibrantes no arbusto
    ctx.fillStyle = '#fb7185';
    ctx.fillRect(7, 8, 3, 3);
    ctx.fillStyle = '#fde047';
    ctx.fillRect(21, 11, 3, 3);
    ctx.fillStyle = '#f472b6';
    ctx.fillRect(13, 22, 3, 3);
  });

  return {
    brickPlanter,
    planterSoil,
    woodSlats,
    roofTiles,
    mossyRock,
    solarPanel,
    ecoScreen,
    foliage
  };
}
