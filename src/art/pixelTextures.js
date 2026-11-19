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
 * E1-01 — Textura Pixel Art do Chão da Praça Ecológica Ensolarada (Mapa de Dia Alegre e Colorido!)
 */
export function createArenaGridTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base de ladrilho solar creme-areia super alegre e iluminado
  ctx.fillStyle = '#fdf3d0';
  ctx.fillRect(0, 0, size, size);

  const half = size / 2;
  const mosaicAccents = ['#ff6b6b', '#38bdf8', '#34c759', '#f59e0b'];

  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * half;
      const oy = gy * half;
      const idx = gy * 2 + gx;

      // Variação alegre entre ladrilhos de praça ensolarada
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#fff9e6' : '#faecc0';
      ctx.fillRect(ox + 2, oy + 2, half - 4, half - 4);

      // Borda iluminada pelo sol (branco-quente)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ox + 2, oy + 2, half - 4, 2);
      ctx.fillRect(ox + 2, oy + 2, 2, half - 4);

      // Sombra suave dourada inferior/direita do ladrilho
      ctx.fillStyle = '#e5cf94';
      ctx.fillRect(ox + 2, oy + half - 3, half - 4, 1);
      ctx.fillRect(ox + half - 3, oy + 2, 1, half - 4);

      // Pedrinhas coloridas de granilite alegre (nas 4 cores CONAMA)
      ctx.fillStyle = mosaicAccents[idx];
      ctx.fillRect(ox + 9, oy + 10, 2, 2);
      ctx.fillStyle = mosaicAccents[(idx + 1) % 4];
      ctx.fillRect(ox + 21, oy + 19, 2, 2);
      ctx.fillStyle = '#86efac';
      ctx.fillRect(ox + 15, oy + 23, 2, 2);
    }
  }

  // Rejunte com graminha viva crescendo entre as pedras da praça
  ctx.fillStyle = '#d9c282';
  ctx.fillRect(0, 0, size, 2);
  ctx.fillRect(0, 0, 2, size);
  ctx.fillRect(0, half - 1, size, 2);
  ctx.fillRect(half - 1, 0, 2, size);

  // Tufinhos de grama verde e florzinhas nos cruzamentos dos ladrilhos
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 0, 4, 4);
  ctx.fillRect(half - 1, half - 1, 4, 4);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(1, 1, 2, 2);
  ctx.fillStyle = '#f472b6';
  ctx.fillRect(half, half, 2, 2);

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(14, 14);
  return texture;
}

/**
 * Textura Pixel Art de Gramado Verde Florido para o Parque ao redor da Arena
 */
export function createParkGrassTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Grama verde vibrante de dia ensolarado
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(0, 0, size, size);

  // Manchas de luz solar na grama
  ctx.fillStyle = '#86efac';
  ctx.fillRect(4, 6, 18, 14);
  ctx.fillRect(36, 34, 20, 16);

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(26, 10, 14, 14);
  ctx.fillRect(8, 40, 16, 14);

  // Folhinhas de grama pixel art
  const blades = [
    [10, 12], [22, 28], [44, 16], [52, 48], [16, 52], [34, 42], [48, 26], [6, 30]
  ];
  ctx.fillStyle = '#16a34a';
  blades.forEach(([bx, by]) => {
    ctx.fillRect(bx, by, 2, 3);
    ctx.fillRect(bx + 2, by + 1, 1, 2);
  });

  // Florzinhas silvestres coloridas espalhadas pelo gramado
  const flowers = [
    { x: 14, y: 18, c: '#ffffff' },
    { x: 46, y: 12, c: '#facc15' },
    { x: 28, y: 48, c: '#f472b6' },
    { x: 54, y: 36, c: '#38bdf8' }
  ];
  flowers.forEach(({ x, y, c }) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 3, 3);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 1, y + 1, 1, 1);
  });

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(28, 28);
  return texture;
}

/**
 * E1-01 — Textura Pixel Art para as Muretas do Parque (Colorida com as 4 cores alegres da reciclagem CONAMA)
 */
export function createArenaBorderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base branca/creme limpa de mureta de parque
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(0, 0, 64, 16);

  // Blocos alegres nas 4 cores CONAMA (Vermelho, Azul, Verde, Amarelo)
  const conamaColors = ['#ff3b30', '#007aff', '#34c759', '#ffcc00'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = conamaColors[i];
    ctx.fillRect(i * 16 + 1, 2, 14, 7);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(i * 16 + 2, 2, 12, 2);
  }

  // Rodapé verde-grama
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, 11, 64, 5);

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(12, 1);
  return texture;
}

/**
 * E1-02 — Sprite Pixel Art 2.5D do Protagonista (Inspirado diretamente no protagonista de @Docs/until-then-2.webp:
 * cabelo castanho bagunçado, camisa branca escolar com gravata, alças azuis da mochila e calça verde-oliva)
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

    // Contorno / Sombra de base
    // Mochila azul nas costas (lado esquerdo do sprite, igual @Docs/until-then-2.webp)
    px(6, 18, 5, 13, '#174ea6');
    px(7, 19, 3, 11, '#266dd3');
    px(8, 16, 3, 2, '#d4a238'); // Chaveiro amarelo na mochila

    // Cabelo castanho bagunçado (Until Then protagonist)
    px(10, 3, 12, 3, '#3b2219');
    px(8, 5, 16, 5, '#593424');
    px(7, 7, 18, 4, '#6e422e');
    // Mechas soltas no topo e laterais
    px(9, 2, 3, 2, '#593424');
    px(15, 1, 4, 2, '#6e422e');
    px(22, 4, 3, 2, '#593424');
    px(6, 9, 2, 3, '#3b2219');
    px(24, 8, 2, 3, '#3b2219');

    // Rosto / Cabeça
    px(10, 9, 12, 8, '#ebba9a');
    px(10, 15, 12, 2, '#d69f7e');
    // Franja sobre a testa
    px(10, 8, 12, 2, '#4a2a1d');
    px(11, 10, 3, 1, '#593424');
    px(17, 10, 4, 1, '#593424');
    // Sobrancelhas e olhos expressivos pixelados
    px(12, 11, 3, 1, '#2e1a12');
    px(18, 11, 3, 1, '#2e1a12');
    px(13, 12, 2, 2, '#1c1518');
    px(19, 12, 2, 2, '#1c1518');
    // Pescoço
    px(14, 17, 4, 2, '#cf9676');

    // Camisa escolar branca com gola e gravata (Until Then)
    px(9, 18, 14, 13, '#e8ecf2');
    px(10, 19, 12, 11, '#f7f9fc');
    // Sombras de dobra da camisa
    px(11, 24, 2, 6, '#cfd7e6');
    px(19, 22, 2, 8, '#cfd7e6');
    // Gola e gravata verde-acinzentada
    px(13, 18, 6, 2, '#bec7d6');
    px(15, 19, 2, 6, '#5c706b');

    // Alças azuis da mochila sobre os ombros
    px(10, 18, 2, 10, '#1e60bd');
    px(20, 18, 2, 10, '#1e60bd');

    // Braços (mangas curtas brancas + antebraços)
    px(7, 19, 3, 5, '#dce3ed');
    px(22, 19, 3, 5, '#dce3ed');
    px(7, 24, 3, 5, '#e6b291');
    px(22, 24, 3, 5, '#e6b291');
    // Luva/pulso canalizador energético
    px(7, 27, 3, 2, '#ffd166');
    px(22, 27, 3, 2, '#00f5d4');

    // Calça verde-oliva (exatamente como @Docs/until-then-2.webp)
    ctx.fillStyle = '#3d5a40';
    ctx.fillRect(10, 31, 6, 12 + leftLegOffset);
    ctx.fillRect(16, 31, 6, 12 + rightLegOffset);

    // Luz e dobra da calça verde
    ctx.fillStyle = '#4f7353';
    ctx.fillRect(11, 32, 3, 10 + leftLegOffset);
    ctx.fillRect(17, 32, 3, 10 + rightLegOffset);
    ctx.fillStyle = '#2b402d';
    ctx.fillRect(15, 33, 1, 9);

    // Sapatos marrom-escuros
    ctx.fillStyle = '#2e1d16';
    ctx.fillRect(9, 43 + leftLegOffset, 7, 3);
    ctx.fillRect(16, 43 + rightLegOffset, 7, 3);
    ctx.fillStyle = '#4a3025';
    ctx.fillRect(10, 43 + leftLegOffset, 4, 2);
    ctx.fillRect(17, 43 + rightLegOffset, 4, 2);

    const tex = new THREE.CanvasTexture(canvas);
    return applyNearestPixelFilter(tex);
  });

  return frames;
}

/**
 * E2-01 / E2-05 — Sprites Pixel Art 2.5D dos Inimigos como ITENS RECICLÁVEIS REAIS:
 * - PLASTIC (Vermelho / Q): Garrafa PET
 * - PAPER   (Azul / E):     Caixa de Papelão
 * - GLASS   (Verde / R):    Garrafa de Vidro
 * - METAL   (Amarelo / F):  Porca de Metal
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

      // Perninhas animadas de resíduo vivo
      ctx.fillStyle = '#181422';
      ctx.fillRect(10, 30 + legL, 4, 5);
      ctx.fillRect(18, 30 + legR, 4, 5);

      if (cat === 'PLASTIC') {
        // ==================== GARRAFA PET (PLÁSTICO — VERMELHO Q) ====================
        // Tampa vermelha da Garrafa PET
        px(13, 2, 6, 3, '#ff3b30');
        px(12, 5, 8, 2, '#c91e14');
        // Gargalo translúcido avermelhado
        px(12, 7, 8, 3, '#ff9b94');
        // Corpo da Garrafa PET com frisos de plástico amassado
        px(9, 10, 14, 19, '#d62828');
        px(10, 11, 12, 17, '#ff5a52');
        // Reflexo vertical de plástico PET brilhante
        px(11, 11, 2, 16, '#ffd6d4');
        // Rótulo central Vermelho CONAMA
        px(9, 15, 14, 7, '#9e1111');
        px(10, 16, 12, 5, '#ff3b30');
        // Frisos horizontais da garrafa
        px(10, 13, 12, 1, '#c91e14');
        px(10, 24, 12, 1, '#c91e14');
        // Olhos expressivos no rótulo
        px(11, 17, 3, 3, '#ffffff');
        px(18, 17, 3, 3, '#ffffff');
        px(12, 18, 2, 2, '#14121d');
        px(19, 18, 2, 2, '#14121d');
      } else if (cat === 'PAPER') {
        // ==================== CAIXA DE PAPELÃO (PAPEL — AZUL E) ====================
        // Abas superiores abertas da caixa de papelão
        px(5, 6, 8, 4, '#c6935b');
        px(19, 6, 8, 4, '#d9a76c');
        // Corpo quadrado da Caixa de Papelão
        px(7, 10, 18, 19, '#8c5e32');
        px(8, 11, 16, 17, '#c6935b');
        px(9, 12, 7, 15, '#d9a76c');
        // Faixa Adesiva Azul CONAMA (Papel)
        px(7, 14, 18, 6, '#0055b3');
        px(8, 15, 16, 4, '#007aff');
        px(15, 10, 2, 18, '#007aff');
        // Olhos brilhantes na faixa azul
        px(10, 16, 3, 3, '#ffffff');
        px(19, 16, 3, 3, '#ffffff');
        px(11, 17, 2, 2, '#0a1931');
        px(20, 17, 2, 2, '#0a1931');
      } else if (cat === 'GLASS') {
        // ==================== GARRAFA DE VIDRO (VIDRO — VERDE R) ====================
        // Gargalo fino e longo de vidro verde
        px(14, 2, 4, 2, '#a3ffba');
        px(13, 4, 6, 6, '#1f993c');
        px(14, 4, 3, 6, '#34c759');
        // Ombro e corpo de Garrafa de Vidro Verde
        px(10, 10, 12, 3, '#1f993c');
        px(9, 13, 14, 16, '#146b29');
        px(10, 13, 12, 15, '#34c759');
        // Reflexo cristalino branco/verde-claro e trinca de vidro
        px(11, 12, 2, 14, '#c7ffd4');
        px(18, 14, 1, 4, '#ffffff');
        px(17, 17, 2, 1, '#ffffff');
        // Olhos luminosos
        px(11, 18, 3, 3, '#ffffcc');
        px(18, 18, 3, 3, '#ffffcc');
        px(12, 19, 2, 2, '#0d2b14');
        px(19, 19, 2, 2, '#0d2b14');
      } else {
        // ==================== PORCA DE METAL SEXTAVADA (METAL — AMARELO F) ====================
        // Formato octogonal/sextavado robusto de Porca de Metal Amarela/Dourada
        px(10, 6, 12, 23, '#997300');
        px(6, 10, 20, 15, '#997300');
        px(11, 7, 10, 21, '#ffcc00');
        px(7, 11, 18, 13, '#ffcc00');
        // Chanfro metálico iluminado superior
        px(11, 7, 10, 2, '#fff099');
        px(8, 11, 3, 10, '#fff099');
        // Furo central de rosca da Porca de Metal!
        px(12, 13, 8, 8, '#2b2412');
        px(13, 14, 6, 6, '#14121d');
        // Frisos da rosca interna
        px(13, 15, 6, 1, '#7a5c00');
        px(13, 18, 6, 1, '#7a5c00');
        // Olhos elétricos ciano/brancos saindo do núcleo da porca
        px(11, 16, 3, 3, '#ffffff');
        px(18, 16, 3, 3, '#ffffff');
        px(12, 17, 2, 2, '#d90429');
        px(19, 17, 2, 2, '#d90429');
      }

      const tex = new THREE.CanvasTexture(canvas);
      return applyNearestPixelFilter(tex);
    });
  });

  return map;
}

/**
 * E2-05 — Cria etiqueta pixelada flutuante com a tecla da Lixeira e nome do Item (ex: "[Q] GARRAFA PET")
 */
export function createEnemyBinBadgeTexture(binElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Fundo escuro com borda na cor CONAMA da lixeira
  ctx.fillStyle = 'rgba(18, 16, 28, 0.92)';
  ctx.fillRect(2, 2, 156, 28);
  ctx.lineWidth = 3;
  ctx.strokeStyle = binElement.hex;
  ctx.strokeRect(2, 2, 156, 28);

  // Quadrado da Tecla da Lixeira à esquerda
  ctx.fillStyle = binElement.hex;
  ctx.fillRect(4, 4, 28, 24);

  ctx.fillStyle = binElement.id === 'METAL' ? '#191708' : '#ffffff';
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(binElement.keyAlt, 18, 16);

  // Nome do Item Reciclável
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(binElement.enemyItemName.toUpperCase(), 38, 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * E1-02 — Retícula de Mira Isométrica no Chão (THREE.NearestFilter)
 */
export function createReticleTexture() {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Contorno externo escuro para contraste perfeito no chão claro de dia
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(1, 1, 9, 4);
  ctx.fillRect(1, 1, 4, 9);
  ctx.fillRect(22, 1, 9, 4);
  ctx.fillRect(27, 1, 4, 9);
  ctx.fillRect(1, 27, 9, 4);
  ctx.fillRect(1, 22, 4, 9);
  ctx.fillRect(22, 27, 9, 4);
  ctx.fillRect(27, 22, 4, 9);

  // Cantoneiras externas vibrantes
  ctx.fillStyle = '#ff3b30';
  // Topo-Esquerda
  ctx.fillRect(2, 2, 7, 2);
  ctx.fillRect(2, 2, 2, 7);
  // Topo-Direita
  ctx.fillRect(23, 2, 7, 2);
  ctx.fillRect(28, 2, 2, 7);
  // Baixo-Esquerda
  ctx.fillRect(2, 28, 7, 2);
  ctx.fillRect(2, 23, 2, 7);
  // Baixo-Direita
  ctx.fillRect(23, 28, 7, 2);
  ctx.fillRect(28, 23, 2, 7);

  // Anel interno e mira central
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(14, 5, 4, 6);
  ctx.fillRect(14, 21, 4, 6);
  ctx.fillRect(5, 14, 6, 4);
  ctx.fillRect(21, 14, 6, 4);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(13, 13, 6, 6);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(14, 14, 4, 4);

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}
