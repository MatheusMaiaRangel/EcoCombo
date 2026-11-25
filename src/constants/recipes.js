/**
 * RN01 / RN16 / RN17 — As 4 Lixeiras da Coleta Seletiva (CONAMA)
 * Cada tecla (Q/1, E/2, R/3, F/4) representa uma Lixeira e possui:
 * - O Item Reciclável correspondente (Inimigo na Arena)
 * - O Leque de 3 Modos Táticos inspirado no Hwei (League of Legends):
 *   • Q (1): Ataque de Mais Dano (Exige a Lixeira Certa do item!)
 *   • E (2): Controle de Grupo Único da Lixeira (Separar | Juntar | Slow+Frágil | Estunar)
 *   • R (3): Protetivo / Escudo Seletivo (Protege contra aproximação daquele item)
 *   • F (4): Fechar / Cancelar o Leque atual
 */
export const CONAMA_ELEMENTS = {
  PLASTIC: {
    id: 'PLASTIC',
    index: 0,
    keyDigit: '1',
    keyAlt: 'Q',
    name: 'Lixeira de Plástico',
    shortName: 'Plástico',
    colorName: 'Vermelho',
    hex: '#FF3B30',
    hexNumber: 0xff3b30,
    emissiveHex: 0xff2a1f,
    secondaryHex: '#FF857D',
    enemyItemName: 'Garrafa PET',
    enemyItemSubtitle: 'PLÁSTICO • LIXEIRA Q',
    ccLabel: 'SEPARAR (Empurrão Elástico)',
    ccShort: 'SEPARAR',
    role: 'Polímeros elásticos — Separa grupos no [E] e recicla Garrafas PET',
    freq: 330.0
  },
  PAPER: {
    id: 'PAPER',
    index: 1,
    keyDigit: '2',
    keyAlt: 'E',
    name: 'Lixeira de Papel',
    shortName: 'Papel',
    colorName: 'Azul',
    hex: '#007AFF',
    hexNumber: 0x007aff,
    emissiveHex: 0x1a8cff,
    secondaryHex: '#80C2FF',
    enemyItemName: 'Caixa de Papelão',
    enemyItemSubtitle: 'PAPEL • LIXEIRA E',
    ccLabel: 'JUNTAR (Vórtice Origami)',
    ccShort: 'JUNTAR',
    role: 'Redemoinho de celulose — Junta inimigos no [E] e recicla Papelão',
    freq: 440.0
  },
  GLASS: {
    id: 'GLASS',
    index: 2,
    keyDigit: '3',
    keyAlt: 'R',
    name: 'Lixeira de Vidro',
    shortName: 'Vidro',
    colorName: 'Verde',
    hex: '#34C759',
    hexNumber: 0x34c759,
    emissiveHex: 0x2ee65b,
    secondaryHex: '#98F5B1',
    enemyItemName: 'Garrafa de Vidro',
    enemyItemSubtitle: 'VIDRO • LIXEIRA R',
    ccLabel: 'LENTIDÃO + FRÁGIL (Prisma)',
    ccShort: 'LENTIDÃO',
    role: 'Refração cristalina — Desacelera e fragiliza no [E] e recicla Vidros',
    freq: 554.37
  },
  METAL: {
    id: 'METAL',
    index: 3,
    keyDigit: '4',
    keyAlt: 'F',
    name: 'Lixeira de Metal',
    shortName: 'Metal',
    colorName: 'Amarelo',
    hex: '#FFCC00',
    hexNumber: 0xffcc00,
    emissiveHex: 0xffd633,
    secondaryHex: '#FFF099',
    enemyItemName: 'Porca de Metal',
    enemyItemSubtitle: 'METAL • LIXEIRA F',
    ccLabel: 'ESTUNAR (Trava Magnética)',
    ccShort: 'ESTUNAR',
    role: 'Descarga magnética — Estuna/paralisa no [E] e recicla Porcas de Metal',
    freq: 659.25
  }
};

export const ELEMENT_ORDER = ['PLASTIC', 'PAPER', 'GLASS', 'METAL'];

/**
 * E2-06 / E2-03 — Marcos de tempo (em segundos de gameplay ativa) dos Estágios da partida:
 * - Estágio 1 (00:00): 4 itens recicláveis base
 * - Estágio 2 (01:30 / 90s): arena expande, +4 novos itens (8 total), +15% HP e +8% velocidade
 * - Estágio 3 (03:00 / 180s): onda final (+30% HP, +16% velocidade, alta incidência de blindados; prepara o terreno para o Boss do Épico E5)
 */
export const STAGE_2_UNLOCK_TIME_SEC = 90;
export const STAGE_3_UNLOCK_TIME_SEC = 180;
export const MAX_STANDARD_STAGE = 3;

export function getStageHpMultiplier(stage = 1) {
  return 1 + Math.max(0, stage - 1) * 0.15;
}

export function getStageSpeedMultiplier(stage = 1) {
  return 1 + Math.max(0, stage - 1) * 0.08;
}

/**
 * E2-05 / E2-06 — Catálogo dos Inimigos Recicláveis por Lixeira CONAMA:
 * - Estágio 1: 4 inimigos base (1 por lixeira)
 * - Estágio 2 (01:30+): +4 novos inimigos (1 extra por lixeira), acumulando todos os 8!
 */
export const ENEMY_VARIANTS = {
  // ==================== LIXEIRA Q: PLÁSTICO (VERMELHO) ====================
  PLASTIC_PET: {
    id: 'PLASTIC_PET',
    binId: 'PLASTIC',
    minStage: 1,
    name: 'Garrafa PET',
    hpModifier: 1.0,
    speedModifier: 1.14,
    knockbackResist: 1.0,
    movementStyle: 'direct',
    spriteScale: [1.75, 1.95]
  },
  PLASTIC_BAG: {
    id: 'PLASTIC_BAG',
    binId: 'PLASTIC',
    minStage: 2,
    name: 'Sacola Plástica',
    hpModifier: 0.88,
    speedModifier: 1.24,
    knockbackResist: 1.15,
    movementStyle: 'zigzag',
    spriteScale: [1.85, 1.98]
  },

  // ==================== LIXEIRA E: PAPEL (AZUL) ====================
  PAPER_BOX: {
    id: 'PAPER_BOX',
    binId: 'PAPER',
    minStage: 1,
    name: 'Caixa de Papelão',
    hpModifier: 0.9,
    speedModifier: 1.0,
    knockbackResist: 1.0,
    movementStyle: 'direct',
    spriteScale: [1.75, 1.95]
  },
  PAPER_NEWSPAPER: {
    id: 'PAPER_NEWSPAPER',
    binId: 'PAPER',
    minStage: 2,
    name: 'Jornal Velho',
    hpModifier: 0.96,
    speedModifier: 1.16,
    knockbackResist: 1.05,
    movementStyle: 'stride',
    spriteScale: [1.82, 1.95]
  },

  // ==================== LIXEIRA R: VIDRO (VERDE) ====================
  GLASS_BOTTLE: {
    id: 'GLASS_BOTTLE',
    binId: 'GLASS',
    minStage: 1,
    name: 'Garrafa de Vidro',
    hpModifier: 1.0,
    speedModifier: 1.0,
    knockbackResist: 1.0,
    movementStyle: 'direct',
    spriteScale: [1.75, 1.95]
  },
  GLASS_JAR: {
    id: 'GLASS_JAR',
    binId: 'GLASS',
    minStage: 2,
    name: 'Pote de Vidro',
    hpModifier: 1.28,
    speedModifier: 0.92,
    knockbackResist: 0.72,
    movementStyle: 'steady',
    spriteScale: [1.88, 1.98]
  },

  // ==================== LIXEIRA F: METAL (AMARELO) ====================
  METAL_NUT: {
    id: 'METAL_NUT',
    binId: 'METAL',
    minStage: 1,
    name: 'Porca de Metal',
    hpModifier: 1.2,
    speedModifier: 0.88,
    knockbackResist: 0.85,
    movementStyle: 'direct',
    spriteScale: [1.75, 1.95]
  },
  METAL_CAN: {
    id: 'METAL_CAN',
    binId: 'METAL',
    minStage: 2,
    name: 'Lata de Alumínio',
    hpModifier: 1.38,
    speedModifier: 1.0,
    knockbackResist: 0.65,
    movementStyle: 'steady',
    spriteScale: [1.82, 2.02]
  }
};

export const ENEMY_VARIANT_LIST = Object.values(ENEMY_VARIANTS);

export const STAGE_2_NEW_VARIANT_IDS = [
  'PLASTIC_BAG',
  'PAPER_NEWSPAPER',
  'GLASS_JAR',
  'METAL_CAN'
];

export function getUnlockedEnemyVariants(stage = 1, binId = null) {
  return ENEMY_VARIANT_LIST.filter(
    (variant) => variant.minStage <= stage && (!binId || variant.binId === binId)
  );
}

export function getBinItemNamesForStage(binId, stage = 1) {
  return getUnlockedEnemyVariants(stage, binId).map((variant) => variant.name);
}

export const KEY_TO_ELEMENT = {
  Digit1: 'PLASTIC',
  Numpad1: 'PLASTIC',
  KeyQ: 'PLASTIC',
  Digit2: 'PAPER',
  Numpad2: 'PAPER',
  KeyE: 'PAPER',
  Digit3: 'GLASS',
  Numpad3: 'GLASS',
  KeyR: 'GLASS',
  Digit4: 'METAL',
  Numpad4: 'METAL',
  KeyF: 'METAL'
};

/**
 * Mapeamento do 2º Toque (Leque de 3 Modos estilo Hwei + F para cancelar)
 */
export const KEY_TO_HWEI_MODE = {
  Digit1: 'DAMAGE',
  Numpad1: 'DAMAGE',
  KeyQ: 'DAMAGE',
  Digit2: 'CONTROL',
  Numpad2: 'CONTROL',
  KeyE: 'CONTROL',
  Digit3: 'SHIELD',
  Numpad3: 'SHIELD',
  KeyR: 'SHIELD',
  Digit4: 'CANCEL',
  Numpad4: 'CANCEL',
  KeyF: 'CANCEL'
};

/**
 * RN18 / E4-05 — Tabela de Ranks de Estilo inspirada em Devil May Cry (D, C, B, A, S, SS, SSS)
 * Com o Multiplicador Gigante Destacado logo abaixo da letra do Rank!
 * Escala equilibrada (0 a 1600 pts) com decaimento progressivo nos ranks altos (S, SS, SSS).
 */
export const MAX_STYLE_POINTS = 1600;

export const DMC_STYLE_RANKS = [
  {
    rank: 'D',
    title: 'DESCARTADO',
    subtitle: 'Acerte a lixeira certa!',
    multiplier: 1.0,
    minPoints: 0,
    decayRate: 7,
    color: '#8d99ae',
    glow: 'rgba(141, 153, 174, 0.45)',
    stateClass: 'rank-d'
  },
  {
    rank: 'C',
    title: 'COLETOR',
    subtitle: 'Coleta seletiva iniciada!',
    multiplier: 1.5,
    minPoints: 120,
    decayRate: 10,
    color: '#4cc9f0',
    glow: 'rgba(76, 201, 240, 0.65)',
    stateClass: 'rank-c'
  },
  {
    rank: 'B',
    title: 'BRIGADA VERDE',
    subtitle: 'Bom ritmo de reciclagem!',
    multiplier: 2.0,
    minPoints: 280,
    decayRate: 14,
    color: '#34c759',
    glow: 'rgba(52, 199, 89, 0.7)',
    stateClass: 'rank-b'
  },
  {
    rank: 'A',
    title: 'ALQUIMISTA',
    subtitle: 'Varie lixeiras e modos!',
    multiplier: 3.0,
    minPoints: 500,
    decayRate: 19,
    color: '#ffd166',
    glow: 'rgba(255, 209, 102, 0.8)',
    stateClass: 'rank-a'
  },
  {
    rank: 'S',
    title: 'SUSTENTÁVEL!',
    subtitle: 'Mantenha o ritmo sem erros!',
    multiplier: 4.0,
    minPoints: 780,
    decayRate: 26,
    color: '#ff7b00',
    glow: 'rgba(255, 123, 0, 0.85)',
    stateClass: 'rank-s'
  },
  {
    rank: 'SS',
    title: 'SUPER SELETIVO!!',
    subtitle: 'Combos variados e implacáveis!',
    multiplier: 5.0,
    minPoints: 1100,
    decayRate: 34,
    color: '#ff006e',
    glow: 'rgba(255, 0, 110, 0.9)',
    stateClass: 'rank-ss'
  },
  {
    rank: 'SSS',
    title: 'SUPREMO ECO!!!',
    subtitle: 'Mestre Absoluto da Reciclagem!',
    multiplier: 6.0,
    minPoints: 1450,
    decayRate: 44,
    color: '#00f5d4',
    glow: 'rgba(0, 245, 212, 0.95)',
    stateClass: 'rank-sss'
  }
];

export function getStyleRankFromPoints(points) {
  const clamped = Math.max(0, Math.min(MAX_STYLE_POINTS, points));
  let currentIdx = 0;
  for (let i = DMC_STYLE_RANKS.length - 1; i >= 0; i--) {
    if (clamped >= DMC_STYLE_RANKS[i].minPoints) {
      currentIdx = i;
      break;
    }
  }
  const current = DMC_STYLE_RANKS[currentIdx];
  const next = DMC_STYLE_RANKS[currentIdx + 1] || null;
  const span = next ? next.minPoints - current.minPoints : MAX_STYLE_POINTS - current.minPoints;
  const progressPercent =
    span > 0 ? Math.max(0, Math.min(100, ((clamped - current.minPoints) / span) * 100)) : 100;
  return {
    ...current,
    index: currentIdx,
    stylePoints: clamped,
    progressPercent
  };
}

/**
 * RN17 / E3-05 — Catálogo das 12 Habilidades do Grimório estilo Hwei (4 Lixeiras × 3 Modos: Q=Dano, E=Controle, R=Escudo)
 */
export const HWEI_SPELLS = {
  // ==================== LIXEIRA Q: PLÁSTICO (VERMELHA) ====================
  PLASTIC_DAMAGE: {
    id: 'PLASTIC_DAMAGE',
    binId: 'PLASTIC',
    modeId: 'DAMAGE',
    comboKeys: 'Q + Q',
    recipeLabel: 'Plástico [Q] → Modo Dano [Q]',
    colorsLabel: 'Lixeira Vermelha • Ofensivo',
    name: 'Prensa Polimérica Perfurocortante',
    effectDesc: 'Alto dano direto em Garrafa PET (Plástico). Rebate para outro plástico próximo!',
    primaryHex: '#FF3B30',
    secondaryHex: '#FF857D',
    colorA: 0xff3b30,
    colorB: 0xff857d,
    shape: 'sphere_polymer',
    speed: 25,
    baseDamage: 55,
    radius: 0.72,
    behavior: 'damage_plastic'
  },
  PLASTIC_CONTROL: {
    id: 'PLASTIC_CONTROL',
    binId: 'PLASTIC',
    modeId: 'CONTROL',
    comboKeys: 'Q + E',
    recipeLabel: 'Plástico [Q] → Controle [E]: SEPARAR',
    colorsLabel: 'Lixeira Vermelha • Separar Grupo',
    name: 'Onda Elástica Repulsora (Separar)',
    effectDesc: 'Expande um anel elástico que SEPARA e empurra os itens para longe de você!',
    primaryHex: '#FF3B30',
    secondaryHex: '#FFD166',
    colorA: 0xff3b30,
    colorB: 0xffd166,
    shape: 'kinetic_capsule',
    speed: 21,
    baseDamage: 24,
    radius: 1.05,
    aoeRadius: 4.2,
    ccType: 'separate',
    behavior: 'cc_separate'
  },
  PLASTIC_SHIELD: {
    id: 'PLASTIC_SHIELD',
    binId: 'PLASTIC',
    modeId: 'SHIELD',
    comboKeys: 'Q + R',
    recipeLabel: 'Plástico [Q] → Protetivo [R]: ESCUDO',
    colorsLabel: 'Lixeira Vermelha • Escudo Seletivo',
    name: 'Escudo Polimérico Flexível',
    effectDesc: 'Bloqueia até 2 impactos de Garrafa PET (3.0s • recarga 3s). Ative na hora exata para Parry!',
    primaryHex: '#FF3B30',
    secondaryHex: '#FFFFFF',
    colorA: 0xff3b30,
    colorB: 0xff857d,
    shape: 'sphere_polymer',
    duration: 3.0,
    cooldown: 3.0,
    maxCharges: 2,
    parryWindow: 0.55,
    behavior: 'shield'
  },

  // ==================== LIXEIRA E: PAPEL (AZUL) ====================
  PAPER_DAMAGE: {
    id: 'PAPER_DAMAGE',
    binId: 'PAPER',
    modeId: 'DAMAGE',
    comboKeys: 'E + Q',
    recipeLabel: 'Papel [E] → Modo Dano [Q]',
    colorsLabel: 'Lixeira Azul • Ofensivo',
    name: 'Rajada Guilhotina de Origami',
    effectDesc: 'Dispara lâminas concentradas de alto dano contra Caixa de Papelão (Papel)!',
    primaryHex: '#007AFF',
    secondaryHex: '#80C2FF',
    colorA: 0x007aff,
    colorB: 0x80c2ff,
    shape: 'origami_fan',
    speed: 26,
    baseDamage: 52,
    radius: 0.72,
    behavior: 'damage_paper'
  },
  PAPER_CONTROL: {
    id: 'PAPER_CONTROL',
    binId: 'PAPER',
    modeId: 'CONTROL',
    comboKeys: 'E + E',
    recipeLabel: 'Papel [E] → Controle [E]: JUNTAR',
    colorsLabel: 'Lixeira Azul • Juntar Grupo',
    name: 'Vórtice de Origami (Juntar)',
    effectDesc: 'Cria um redemoinho que PUXA e JUNTA vários itens recicláveis num único ponto!',
    primaryHex: '#007AFF',
    secondaryHex: '#00F5D4',
    colorA: 0x007aff,
    colorB: 0x00f5d4,
    shape: 'glass_vortex',
    speed: 20,
    baseDamage: 22,
    radius: 1.05,
    aoeRadius: 4.8,
    ccType: 'gather',
    behavior: 'cc_gather'
  },
  PAPER_SHIELD: {
    id: 'PAPER_SHIELD',
    binId: 'PAPER',
    modeId: 'SHIELD',
    comboKeys: 'E + R',
    recipeLabel: 'Papel [E] → Protetivo [R]: ESCUDO',
    colorsLabel: 'Lixeira Azul • Escudo Seletivo',
    name: 'Barreira de Celulose Multicamadas',
    effectDesc: 'Bloqueia até 2 impactos de Papelão (3.0s • recarga 3s). Ative na hora exata para Parry!',
    primaryHex: '#007AFF',
    secondaryHex: '#FFFFFF',
    colorA: 0x007aff,
    colorB: 0x80c2ff,
    shape: 'origami_fan',
    duration: 3.0,
    cooldown: 3.0,
    maxCharges: 2,
    parryWindow: 0.55,
    behavior: 'shield'
  },

  // ==================== LIXEIRA R: VIDRO (VERDE) ====================
  GLASS_DAMAGE: {
    id: 'GLASS_DAMAGE',
    binId: 'GLASS',
    modeId: 'DAMAGE',
    comboKeys: 'R + Q',
    recipeLabel: 'Vidro [R] → Modo Dano [Q]',
    colorsLabel: 'Lixeira Verde • Ofensivo',
    name: 'Lança Laser de Cristal Refrator',
    effectDesc: 'Feixe perfurante veloz de alto dano contra Garrafa de Vidro (Vidro)!',
    primaryHex: '#34C759',
    secondaryHex: '#98F5B1',
    colorA: 0x34c759,
    colorB: 0x98f5b1,
    shape: 'crystal_lance',
    speed: 31,
    baseDamage: 56,
    radius: 0.7,
    behavior: 'damage_glass'
  },
  GLASS_CONTROL: {
    id: 'GLASS_CONTROL',
    binId: 'GLASS',
    modeId: 'CONTROL',
    comboKeys: 'R + E',
    recipeLabel: 'Vidro [R] → Controle [E]: LENTIDÃO + FRÁGIL',
    colorsLabel: 'Lixeira Verde • Prisma Desacelerador',
    name: 'Zona de Prisma Refrator (Slow + Frágil)',
    effectDesc: 'Cristaliza a área deixando os itens 70% mais lentos e recebendo +35% de dano!',
    primaryHex: '#34C759',
    secondaryHex: '#00F5D4',
    colorA: 0x34c759,
    colorB: 0x00f5d4,
    shape: 'prism_beam',
    speed: 23,
    baseDamage: 24,
    radius: 1.0,
    aoeRadius: 4.4,
    ccType: 'slow_fragile',
    behavior: 'cc_slow_fragile'
  },
  GLASS_SHIELD: {
    id: 'GLASS_SHIELD',
    binId: 'GLASS',
    modeId: 'SHIELD',
    comboKeys: 'R + R',
    recipeLabel: 'Vidro [R] → Protetivo [R]: ESCUDO',
    colorsLabel: 'Lixeira Verde • Escudo Seletivo',
    name: 'Redoma de Vidro Temperado',
    effectDesc: 'Bloqueia até 2 impactos de Vidro (3.0s • recarga 3s). Ative na hora exata para Parry!',
    primaryHex: '#34C759',
    secondaryHex: '#FFFFFF',
    colorA: 0x34c759,
    colorB: 0x98f5b1,
    shape: 'crystal_lance',
    duration: 3.0,
    cooldown: 3.0,
    maxCharges: 2,
    parryWindow: 0.55,
    behavior: 'shield'
  },

  // ==================== LIXEIRA F: METAL (AMARELA) ====================
  METAL_DAMAGE: {
    id: 'METAL_DAMAGE',
    binId: 'METAL',
    modeId: 'DAMAGE',
    comboKeys: 'F + Q',
    recipeLabel: 'Metal [F] → Modo Dano [Q]',
    colorsLabel: 'Lixeira Amarela • Ofensivo',
    name: 'Impacto Forja de Liga Pesada',
    effectDesc: 'Disparo demolidor de alto dano contra Porca de Metal (Metal) com empurrão!',
    primaryHex: '#FFCC00',
    secondaryHex: '#FFF099',
    colorA: 0xffcc00,
    colorB: 0xfff099,
    shape: 'heavy_alloy',
    speed: 22,
    baseDamage: 62,
    radius: 0.85,
    behavior: 'damage_metal'
  },
  METAL_CONTROL: {
    id: 'METAL_CONTROL',
    binId: 'METAL',
    modeId: 'CONTROL',
    comboKeys: 'F + E',
    recipeLabel: 'Metal [F] → Controle [E]: ESTUNAR',
    colorsLabel: 'Lixeira Amarela • Paralisar Grupo',
    name: 'Pulso Eletromagnético (Estunar)',
    effectDesc: 'Descarga magnética em área que ESTUNA (paralisa totalmente) os itens por 2.8s!',
    primaryHex: '#FFCC00',
    secondaryHex: '#FF7B00',
    colorA: 0xffcc00,
    colorB: 0xff7b00,
    shape: 'em_coil',
    speed: 22,
    baseDamage: 25,
    radius: 1.0,
    aoeRadius: 4.3,
    ccType: 'stun',
    behavior: 'cc_stun'
  },
  METAL_SHIELD: {
    id: 'METAL_SHIELD',
    binId: 'METAL',
    modeId: 'SHIELD',
    comboKeys: 'F + R',
    recipeLabel: 'Metal [F] → Protetivo [R]: ESCUDO',
    colorsLabel: 'Lixeira Amarela • Escudo Seletivo',
    name: 'Blindagem Eletromagnética',
    effectDesc: 'Bloqueia até 2 impactos de Metal (3.0s • recarga 3s). Ative na hora exata para Parry!',
    primaryHex: '#FFCC00',
    secondaryHex: '#FFFFFF',
    colorA: 0xffcc00,
    colorB: 0xfff099,
    shape: 'heavy_alloy',
    duration: 3.0,
    cooldown: 3.0,
    maxCharges: 2,
    parryWindow: 0.55,
    behavior: 'shield'
  }
};

export function resolveHweiSpell(binId, modeId) {
  if (!binId || !modeId) return null;
  return HWEI_SPELLS[`${binId}_${modeId}`] || null;
}

/**
 * Cálculo de Pontuação (P_acerto = round(100 * M))
 */
export function computeHitPoints(multiplier, isMatchingBin = true) {
  const base = isMatchingBin ? 110 : 25;
  return Math.round(base * multiplier);
}

/**
 * Cálculo de Dano no Item Reciclável (D_ataque = D_base * M * fatorAfinidade)
 */
export function computeHitDamage(baseDamage, multiplier, isMatchingBin = true, isFragile = false) {
  const affinityFactor = isMatchingBin ? 1.0 : 0.25;
  const fragileBonus = isFragile ? 1.35 : 1.0;
  return Math.max(5, Math.round(baseDamage * multiplier * affinityFactor * fragileBonus));
}
