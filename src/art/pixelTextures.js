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
 * E1-01 — Textura Pixel Art do Chão em Grid Urbano/Estação (Inspirada em Until Then @Docs/until-then-2.webp)
 */
export function createArenaGridTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Base de ladrilho cinza-azulado quente (estilo piso de estação de metrô de Until Then)
  ctx.fillStyle = '#383b4e';
  ctx.fillRect(0, 0, size, size);

  // Sub-blocos internos (2x2 ladrilhos dentro de 64x64)
  const half = size / 2;
  for (let gy = 0; gy < 2; gy++) {
    for (let gx = 0; gx < 2; gx++) {
      const ox = gx * half;
      const oy = gy * half;

      // Variação sutil de tom entre ladrilhos
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#3d4054' : '#35384a';
      ctx.fillRect(ox + 2, oy + 2, half - 4, half - 4);

      // Borda iluminada superior/esquerda (chanfro pixelado)
      ctx.fillStyle = '#4c5068';
      ctx.fillRect(ox + 2, oy + 2, half - 4, 1);
      ctx.fillRect(ox + 2, oy + 2, 1, half - 4);

      // Sombra inferior/direita do ladrilho
      ctx.fillStyle = '#262836';
      ctx.fillRect(ox + 2, oy + half - 3, half - 4, 1);
      ctx.fillRect(ox + half - 3, oy + 2, 1, half - 4);

      // Pontos de textura terrazzo (granilite pixel art)
      ctx.fillStyle = '#484c63';
      ctx.fillRect(ox + 8, oy + 10, 2, 2);
      ctx.fillRect(ox + 21, oy + 18, 2, 2);
      ctx.fillStyle = '#2d3040';
      ctx.fillRect(ox + 14, oy + 23, 2, 2);
      ctx.fillRect(ox + 24, oy + 7, 1, 1);
    }
  }

  // Rejunte escuro principal do grid
  ctx.fillStyle = '#1e202c';
  ctx.fillRect(0, 0, size, 2);
  ctx.fillRect(0, 0, 2, size);
  ctx.fillRect(0, half - 1, size, 2);
  ctx.fillRect(half - 1, 0, 2, size);

  // Marcadores táteis amarelos/âmbar discretos nas interseções (assinatura urbana de Until Then)
  ctx.fillStyle = '#d49a45';
  ctx.fillRect(1, 1, 2, 2);
  ctx.fillRect(half, half, 2, 2);

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  return texture;
}

/**
 * E1-01 — Textura Pixel Art para as Bordas / Muretas da Estação (Faixa de Segurança Amarela/Preta)
 */
export function createArenaBorderTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = '#252636';
  ctx.fillRect(0, 0, 64, 16);

  // Listras diagonais de plataforma urbana
  for (let x = -16; x < 64; x += 16) {
    ctx.fillStyle = '#e09f3e';
    for (let y = 0; y < 6; y++) {
      ctx.fillRect(x + y, y, 8, 1);
    }
    ctx.fillStyle = '#181924';
    for (let y = 0; y < 6; y++) {
      ctx.fillRect(x + 8 + y, y, 8, 1);
    }
  }

  ctx.fillStyle = '#40435c';
  ctx.fillRect(0, 7, 64, 2);

  const texture = new THREE.CanvasTexture(canvas);
  applyNearestPixelFilter(texture);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(16, 1);
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
 * E2-01 — Sprites Pixel Art 2.5D dos Inimigos ("Bichos" da Poluição)
 * Retorna pares de frames animados para 3 espécies de bichos de poluição
 */
export function createEnemyTextures() {
  const variants = [
    // 0: Ácaro de Microplástico (Carapaça escura + espinhos vermelhos neon)
    {
      shellDark: '#261423',
      shellMid: '#4a1936',
      accent: '#ff3b30',
      eye: '#ffbe0b'
    },
    // 1: Gorgulho de Chorume (Lodo tóxico esverdeado/roxo)
    {
      shellDark: '#192924',
      shellMid: '#284b3a',
      accent: '#34c759',
      eye: '#ff006e'
    },
    // 2: Besouro de Fuligem Metálica (Sucata oxidada + faíscas amarelas)
    {
      shellDark: '#292218',
      shellMid: '#4f3f24',
      accent: '#ffcc00',
      eye: '#00f5d4'
    }
  ];

  return variants.map((v) => {
    return [0, 1].map((animFrame) => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const legShift = animFrame === 0 ? 0 : 2;

      // Pernas articuladas de inseto/bicho da poluição
      ctx.fillStyle = '#140d18';
      for (let i = 0; i < 3; i++) {
        const ly = 18 + i * 4;
        ctx.fillRect(3, ly - (i % 2 === animFrame ? 2 : 0), 6, 2);
        ctx.fillRect(23, ly - ((i + 1) % 2 === animFrame ? 2 : 0), 6, 2);
      }

      // Corpo / Carapaça de resíduo tóxico
      ctx.fillStyle = v.shellDark;
      ctx.fillRect(7, 9 + (animFrame ? -1 : 0), 18, 17);
      ctx.fillStyle = v.shellMid;
      ctx.fillRect(9, 11 + (animFrame ? -1 : 0), 14, 13);

      // Cristais / Espinhos de poluição nas costas
      ctx.fillStyle = v.accent;
      ctx.fillRect(10, 6 + (animFrame ? -1 : 0), 3, 4);
      ctx.fillRect(15, 4 + (animFrame ? -1 : 0), 3, 6);
      ctx.fillRect(20, 6 + (animFrame ? -1 : 0), 3, 4);

      // Olhos brilhantes ameaçadores
      ctx.fillStyle = v.eye;
      ctx.fillRect(10, 16, 4, 3);
      ctx.fillRect(18, 16, 4, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(11, 16, 1, 1);
      ctx.fillRect(19, 16, 1, 1);

      // Mandíbulas de sucata
      ctx.fillStyle = v.accent;
      ctx.fillRect(11 - legShift * 0.5, 23, 3, 4);
      ctx.fillRect(18 + legShift * 0.5, 23, 3, 4);

      const tex = new THREE.CanvasTexture(canvas);
      return applyNearestPixelFilter(tex);
    });
  });
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

  // Cantoneiras externas pixel art
  ctx.fillStyle = '#ffd166';
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
  ctx.fillStyle = '#00f5d4';
  ctx.fillRect(15, 6, 2, 4);
  ctx.fillRect(15, 22, 2, 4);
  ctx.fillRect(6, 15, 4, 2);
  ctx.fillRect(22, 15, 4, 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(14, 14, 4, 4);

  const tex = new THREE.CanvasTexture(canvas);
  return applyNearestPixelFilter(tex);
}
