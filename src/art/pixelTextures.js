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
 * E1-01 — Textura 2D Pixel Art do Chão da Praça (Cores Vivas, Alto Contraste e Detalhes Pixelados)
 * Evita tons brancos estourados para que o protagonista, inimigos e orbes se destaquem com cores super vivas!
 */
export function createArenaGridTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base do rejunte em pedra quente escura para dar contraste nítido de pixel art
  ctx.fillStyle = '#6b4c35';
  ctx.fillRect(0, 0, size, size);

  const half = size / 2;
  const conamaDots = ['#ff2a2a', '#0077ff', '#00c853', '#ffb700'];

  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * half;
      const oy = gy * half;
      const idx = gy * 2 + gx;

      // Ladrilho de pedra ocre/terracota claro estilo praça 16-bit (quente, alegre e sem estourar luz!)
      const tileBase = (gx + gy) % 2 === 0 ? '#e6be8a' : '#dbadf7' === '' ? '#d9b07c' : '#d9b07c';
      ctx.fillStyle = tileBase;
      ctx.fillRect(ox + 2, oy + 2, half - 4, half - 4);

      // Miolo interno do ladrilho
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#edd0a3' : '#e2be8f';
      ctx.fillRect(ox + 4, oy + 4, half - 8, half - 8);

      // Borda iluminada superior/esquerda (chanfro pixel art crocante)
      ctx.fillStyle = '#fae5c3';
      ctx.fillRect(ox + 2, oy + 2, half - 4, 2);
      ctx.fillRect(ox + 2, oy + 2, 2, half - 4);

      // Sombra inferior/direita bem marcada em pixel art
      ctx.fillStyle = '#9c7350';
      ctx.fillRect(ox + 2, oy + half - 4, half - 4, 2);
      ctx.fillRect(ox + half - 4, oy + 2, 2, half - 4);

      // Mosaico colorido pixelado no centro de cada ladrilho (cores vivas CONAMA)
      ctx.fillStyle = '#7c583c';
      ctx.fillRect(ox + 13, oy + 13, 6, 6);
      ctx.fillStyle = conamaDots[idx];
      ctx.fillRect(ox + 14, oy + 14, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 14, oy + 14, 1, 1);

      // Detalhes de textura pixel art na pedra
      ctx.fillStyle = '#c49866';
      ctx.fillRect(ox + 7, oy + 8, 2, 2);
      ctx.fillRect(ox + 22, oy + 20, 2, 2);
      ctx.fillStyle = '#f5deb8';
      ctx.fillRect(ox + 20, oy + 7, 2, 2);
      ctx.fillRect(ox + 8, oy + 21, 2, 2);
    }
  }

  // Tufos de grama verde-viva e florzinhas pixel art nos cruzamentos dos ladrilhos
  const drawGrassTuft = (tx, ty, flowerColor) => {
    ctx.fillStyle = '#0f5223';
    ctx.fillRect(tx - 2, ty - 2, 6, 6);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(tx - 1, ty - 1, 4, 4);
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(tx - 1, ty - 1, 2, 2);
    ctx.fillStyle = flowerColor;
    ctx.fillRect(tx, ty, 2, 2);
  };

  drawGrassTuft(1, 1, '#ffdd00');
  drawGrassTuft(half, half, '#ff3b77');

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  return texture;
}

/**
 * Fundo/Background 2D Pixelado do Parque ao redor da Arena (Grama 16-bit com flores, arbustos e ladrilhos pixel art)
 */
export function createParkGrassTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base de grama verde rica e saturada (estilo RPG/Arcade 16-bit)
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 0, size, size);

  // Padrão de blocos/xadrez sutil em pixel art
  const half = size / 2;
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, half, half);
  ctx.fillRect(half, half, half, half);

  // Textura de tufos de grama pixelados (V-shapes e hastes)
  const tufts = [
    [6, 8], [18, 14], [10, 24], [24, 6],
    [38, 10], [50, 20], [42, 26], [56, 8],
    [8, 40], [22, 48], [14, 56], [26, 38],
    [36, 42], [48, 52], [54, 38], [40, 58]
  ];
  tufts.forEach(([gx, gy], i) => {
    ctx.fillStyle = '#0f5223';
    ctx.fillRect(gx, gy + 2, 4, 2);
    ctx.fillStyle = i % 2 === 0 ? '#4ade80' : '#86efac';
    ctx.fillRect(gx, gy, 1, 3);
    ctx.fillRect(gx + 2, gy - 1, 1, 3);
    ctx.fillRect(gx + 4, gy, 1, 3);
  });

  // Flores 2D pixel art super coloridas com contorno escuro
  const flowers = [
    { x: 12, y: 12, petal: '#ff2a55', core: '#ffe600' },
    { x: 44, y: 14, petal: '#ffcc00', core: '#d90429' },
    { x: 18, y: 44, petal: '#ffffff', core: '#ffb700' },
    { x: 48, y: 46, petal: '#38bdf8', core: '#ffffff' }
  ];
  flowers.forEach(({ x, y, petal, core }) => {
    // Contorno pixelado
    ctx.fillStyle = '#0f3818';
    ctx.fillRect(x - 1, y - 1, 7, 7);
    // Pétalas em cruz pixel art
    ctx.fillStyle = petal;
    ctx.fillRect(x + 1, y, 3, 5);
    ctx.fillRect(x, y + 1, 5, 3);
    // Miolo
    ctx.fillStyle = core;
    ctx.fillRect(x + 2, y + 2, 1, 1);
  });

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(22, 22);
  return texture;
}

/**
 * E1-01 — Textura 2D Pixel Art para as Muretas da Arena (Blocos CONAMA com contorno pixelado forte)
 */
export function createArenaBorderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Contorno escuro superior e inferior
  ctx.fillStyle = '#181425';
  ctx.fillRect(0, 0, 64, 16);

  // Blocos vibrantes nas 4 cores CONAMA
  const conamaColors = [
    { main: '#ff2a2a', light: '#ff8080', dark: '#b30000' }, // Plástico
    { main: '#0066ff', light: '#66a3ff', dark: '#003d99' }, // Papel
    { main: '#00c853', light: '#69f0ae', dark: '#007a33' }, // Vidro
    { main: '#ffb700', light: '#ffe066', dark: '#b38000' }  // Metal
  ];

  for (let i = 0; i < 4; i++) {
    const ox = i * 16;
    const c = conamaColors[i];
    ctx.fillStyle = c.main;
    ctx.fillRect(ox + 1, 2, 14, 10);
    ctx.fillStyle = c.light;
    ctx.fillRect(ox + 2, 2, 12, 2);
    ctx.fillRect(ox + 2, 2, 2, 8);
    ctx.fillStyle = c.dark;
    ctx.fillRect(ox + 2, 10, 12, 2);
    ctx.fillRect(ox + 13, 2, 2, 10);
  }

  // Base de grama pixelada
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 13, 64, 3);

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(12, 1);
  return texture;
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
 * E1-02 — Sprite Pixel Art 2.5D do Protagonista com CONTORNO PIXELADO FORTE e CORES VIVAS!
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

    // ==================== CONTORNO EXTERNO PRETO PIXEL ART (#120d1a) ====================
    // Faz o personagem saltar do chão claro com nitidez máxima!
    px(9, 1, 14, 3, '#120d1a');
    px(6, 3, 20, 9, '#120d1a');
    px(8, 11, 16, 7, '#120d1a');
    px(5, 17, 21, 15, '#120d1a');
    ctx.fillStyle = '#120d1a';
    ctx.fillRect(8, 30, 16, 17 + Math.max(leftLegOffset, rightLegOffset));

    // Mochila azul-royal super viva nas costas
    px(6, 18, 4, 12, '#0044cc');
    px(7, 19, 3, 10, '#0077ff');
    px(7, 16, 3, 2, '#ffcc00'); // Chaveiro amarelo vivo

    // Cabelo castanho-avermelhado rico e contrastado
    px(10, 2, 12, 3, '#3b170e');
    px(8, 4, 16, 5, '#592516');
    px(7, 6, 18, 4, '#7a3420');
    px(11, 3, 8, 2, '#9e472c'); // Brilho solar no cabelo

    // Rosto / Cabeça com cor de pele viva
    px(10, 9, 12, 8, '#ffbf94');
    px(10, 15, 12, 2, '#eb9f70');
    // Franja
    px(10, 8, 12, 2, '#3b170e');
    px(11, 10, 3, 1, '#592516');
    px(17, 10, 4, 1, '#592516');
    // Olhos nítidos com brilho branco
    px(12, 12, 2, 3, '#120d1a');
    px(19, 12, 2, 3, '#120d1a');
    px(12, 12, 1, 1, '#ffffff');
    px(19, 12, 1, 1, '#ffffff');
    // Pescoço
    px(14, 17, 4, 2, '#e09365');

    // Camisa branca brilhante com gravata verde-esmeralda viva e alças azuis
    px(9, 18, 14, 13, '#ffffff');
    px(11, 24, 2, 6, '#cbd5e1');
    px(19, 22, 2, 8, '#cbd5e1');
    // Gravata verde-esmeralda viva
    px(15, 19, 2, 7, '#00c853');
    // Alças azuis vivas da mochila
    px(10, 18, 2, 11, '#0066ff');
    px(20, 18, 2, 11, '#0066ff');

    // Braços e braceletes elementais vibrantes
    px(7, 19, 2, 5, '#ffffff');
    px(22, 19, 3, 5, '#ffffff');
    px(7, 24, 2, 5, '#ffbf94');
    px(22, 24, 3, 5, '#ffbf94');
    px(7, 27, 2, 2, '#ff2a2a');
    px(22, 27, 3, 2, '#00e5ff');

    // Calça verde-floresta viva
    ctx.fillStyle = '#15803d';
    ctx.fillRect(10, 31, 6, 12 + leftLegOffset);
    ctx.fillRect(16, 31, 6, 12 + rightLegOffset);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(11, 32, 3, 10 + leftLegOffset);
    ctx.fillRect(17, 32, 3, 10 + rightLegOffset);

    // Tênis vermelhos/brancos vibrantes
    ctx.fillStyle = '#d90429';
    ctx.fillRect(9, 43 + leftLegOffset, 7, 3);
    ctx.fillRect(16, 43 + rightLegOffset, 7, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 45 + leftLegOffset, 6, 1);
    ctx.fillRect(17, 45 + rightLegOffset, 6, 1);

    const tex = new THREE.CanvasTexture(canvas);
    return applyNearestPixelFilter(tex);
  });

  return frames;
}

/**
 * E2-01 / E2-05 — Sprites Pixel Art 2.5D dos Inimigos Recicláveis com CONTORNO PRETO FORTE e CORES ULTRA VIVAS!
 * - PLASTIC (Vermelho / Q): Garrafa PET Vermelha Rubi
 * - PAPER   (Azul / E):     Caixa de Papelão Dourada com Faixa Azul Elétrico
 * - GLASS   (Verde / R):    Garrafa de Vidro Verde Esmeralda
 * - METAL   (Amarelo / F):  Porca de Metal Ouro Vivo
 */
export function createEnemyTextures() {
  const categories = ['PLASTIC', 'PAPER', 'GLASS', 'METAL'];
  const map = {};

  categories.forEach((cat) => {
    map[cat] = [0, 1].map((animFrame) => {
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

      if (cat === 'PLASTIC') {
        // ==================== GARRAFA PET (VERMELHO VIVO — Q) ====================
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
      } else if (cat === 'PAPER') {
        // ==================== CAIXA DE PAPELÃO (AZUL ELÉTRICO + ÂMBAR — E) ====================
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
      } else if (cat === 'GLASS') {
        // ==================== GARRAFA DE VIDRO (VERDE ESMERALDA VIVO — R) ====================
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
      } else {
        // ==================== PORCA DE METAL (OURO / AMARELO VIVO — F) ====================
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
      }

      const tex = new THREE.CanvasTexture(canvas);
      return applyNearestPixelFilter(tex);
    });
  });

  return map;
}

/**
 * E2-05 — Cria etiqueta pixelada flutuante com alto contraste e cores vivas (ex: "[Q] GARRAFA PET")
 */
export function createEnemyBinBadgeTexture(binElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 34;
  const ctx = canvas.getContext('2d');

  // Fundo azul-noite sólido 100% opaco com borda grossa na cor CONAMA
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, 1, 158, 32);
  ctx.lineWidth = 4;
  ctx.strokeStyle = binElement.hex;
  ctx.strokeRect(2, 2, 156, 30);

  // Quadrado da Tecla da Lixeira à esquerda
  ctx.fillStyle = binElement.hex;
  ctx.fillRect(4, 4, 30, 26);

  ctx.fillStyle = binElement.id === 'METAL' ? '#0f172a' : '#ffffff';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(binElement.keyAlt, 19, 17);

  // Nome do Item Reciclável bem branco e legível
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(binElement.enemyItemName.toUpperCase(), 40, 17);

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
