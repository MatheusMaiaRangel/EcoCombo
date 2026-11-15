/**
 * RN01 — Padrão de 4 Cores da Coleta Seletiva (CONAMA)
 * Mapeamento para teclas 1, 2, 3, 4 e Q, E, R, F (sem conflito com WASD)
 */
export const CONAMA_ELEMENTS = {
  PLASTIC: {
    id: 'PLASTIC',
    index: 0,
    keyDigit: '1',
    keyAlt: 'Q',
    name: 'Plástico',
    colorName: 'Vermelho',
    hex: '#FF3B30',
    hexNumber: 0xff3b30,
    emissiveHex: 0xff2a1f,
    role: 'Elasticidade, ricochete e polímeros cinéticos',
    freq: 330.0
  },
  PAPER: {
    id: 'PAPER',
    index: 1,
    keyDigit: '2',
    keyAlt: 'E',
    name: 'Papel / Papelão',
    shortName: 'Papel',
    colorName: 'Azul',
    hex: '#007AFF',
    hexNumber: 0x007aff,
    emissiveHex: 0x1a8cff,
    role: 'Lâminas de origami, área leve e propulsão',
    freq: 440.0
  },
  GLASS: {
    id: 'GLASS',
    index: 2,
    keyDigit: '3',
    keyAlt: 'R',
    name: 'Vidro',
    colorName: 'Verde',
    hex: '#34C759',
    hexNumber: 0x34c759,
    emissiveHex: 0x2ee65b,
    role: 'Cristais perfurantes, refração laser e prismas',
    freq: 554.37
  },
  METAL: {
    id: 'METAL',
    index: 3,
    keyDigit: '4',
    keyAlt: 'F',
    name: 'Metal',
    colorName: 'Amarelo',
    hex: '#FFCC00',
    hexNumber: 0xffcc00,
    emissiveHex: 0xffd633,
    role: 'Impacto pesado, condução elétrica e magnetismo',
    freq: 659.25
  }
};

export const ELEMENT_ORDER = ['PLASTIC', 'PAPER', 'GLASS', 'METAL'];

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
 * Gera uma chave canônica independente da ordem dos 2 elementos (ex: PLASTIC + GLASS === GLASS + PLASTIC)
 */
export function getCanonicalRecipeKey(elemA, elemB) {
  const pair = [elemA, elemB].sort(
    (a, b) => CONAMA_ELEMENTS[a].index - CONAMA_ELEMENTS[b].index
  );
  return `${pair[0]}_${pair[1]}`;
}

/**
 * RN03 / E3-01 — Tabela Completa das 10 Receitas de Combinação das 4 Cores da Reciclagem
 */
export const COMBO_RECIPES = {
  PLASTIC_PLASTIC: {
    id: 'PLASTIC_PLASTIC',
    elements: ['PLASTIC', 'PLASTIC'],
    recipeLabel: 'Plástico + Plástico',
    colorsLabel: 'Vermelho + Vermelho',
    name: 'Esfera Polimérica Ricocheteante',
    effectDesc: 'Rebate do primeiro inimigo para outro próximo',
    primaryHex: '#FF3B30',
    secondaryHex: '#FF756B',
    colorA: 0xff3b30,
    colorB: 0xff756b,
    shape: 'sphere_polymer',
    speed: 21,
    baseDamage: 35,
    radius: 0.65,
    behavior: 'ricochet'
  },
  PAPER_PAPER: {
    id: 'PAPER_PAPER',
    elements: ['PAPER', 'PAPER'],
    recipeLabel: 'Papel + Papel',
    colorsLabel: 'Azul + Azul',
    name: 'Rajada de Origami Cortante',
    effectDesc: 'Dispara um leque triplo de lâminas de celulose',
    primaryHex: '#007AFF',
    secondaryHex: '#70B8FF',
    colorA: 0x007aff,
    colorB: 0x80c2ff,
    shape: 'origami_fan',
    speed: 23,
    baseDamage: 26,
    radius: 0.6,
    behavior: 'triple_fan'
  },
  GLASS_GLASS: {
    id: 'GLASS_GLASS',
    elements: ['GLASS', 'GLASS'],
    recipeLabel: 'Vidro + Vidro',
    colorsLabel: 'Verde + Verde',
    name: 'Lança de Cristal Refrator',
    effectDesc: 'Projétil veloz que atravessa inimigos em linha',
    primaryHex: '#34C759',
    secondaryHex: '#98F5B1',
    colorA: 0x34c759,
    colorB: 0xa3ffba,
    shape: 'crystal_lance',
    speed: 30,
    baseDamage: 38,
    radius: 0.6,
    behavior: 'pierce'
  },
  METAL_METAL: {
    id: 'METAL_METAL',
    elements: ['METAL', 'METAL'],
    recipeLabel: 'Metal + Metal',
    colorsLabel: 'Amarelo + Amarelo',
    name: 'Bola de Liga Pesada',
    effectDesc: 'Alto impacto físico com empurrão (knockback)',
    primaryHex: '#FFCC00',
    secondaryHex: '#FFF099',
    colorA: 0xffcc00,
    colorB: 0xffe680,
    shape: 'heavy_alloy',
    speed: 17,
    baseDamage: 48,
    radius: 0.85,
    behavior: 'knockback'
  },
  PLASTIC_PAPER: {
    id: 'PLASTIC_PAPER',
    elements: ['PLASTIC', 'PAPER'],
    recipeLabel: 'Plástico + Papel',
    colorsLabel: 'Vermelho + Azul',
    name: 'Cápsula Cinética Pressurizada',
    effectDesc: 'Explode em área curta ao colidir com o bicho',
    primaryHex: '#9D4EDD',
    secondaryHex: '#FF3B30',
    colorA: 0xff3b30,
    colorB: 0x007aff,
    shape: 'kinetic_capsule',
    speed: 20,
    baseDamage: 36,
    radius: 0.72,
    behavior: 'aoe_burst'
  },
  PLASTIC_GLASS: {
    id: 'PLASTIC_GLASS',
    elements: ['PLASTIC', 'GLASS'],
    recipeLabel: 'Plástico + Vidro',
    colorsLabel: 'Vermelho + Verde',
    name: 'Feixe Prisma de Fibra Óptica',
    effectDesc: 'Disparo energético de alta velocidade e precisão',
    primaryHex: '#00F5D4',
    secondaryHex: '#FF3B30',
    colorA: 0xff3b30,
    colorB: 0x34c759,
    shape: 'prism_beam',
    speed: 33,
    baseDamage: 40,
    radius: 0.62,
    behavior: 'precision_beam'
  },
  PLASTIC_METAL: {
    id: 'PLASTIC_METAL',
    elements: ['PLASTIC', 'METAL'],
    recipeLabel: 'Plástico + Metal',
    colorsLabel: 'Vermelho + Amarelo',
    name: 'Bobina Eletromagnética',
    effectDesc: 'Descarga que reduz a velocidade do inimigo',
    primaryHex: '#FF7B00',
    secondaryHex: '#FFCC00',
    colorA: 0xff3b30,
    colorB: 0xffcc00,
    shape: 'em_coil',
    speed: 21,
    baseDamage: 36,
    radius: 0.7,
    behavior: 'slow_shock'
  },
  PAPER_GLASS: {
    id: 'PAPER_GLASS',
    elements: ['PAPER', 'GLASS'],
    recipeLabel: 'Papel + Vidro',
    colorsLabel: 'Azul + Verde',
    name: 'Vórtice de Vento Vítreo',
    effectDesc: 'Cria redemoinho de estilhaços que puxa inimigos',
    primaryHex: '#00BBF9',
    secondaryHex: '#34C759',
    colorA: 0x007aff,
    colorB: 0x34c759,
    shape: 'glass_vortex',
    speed: 19,
    baseDamage: 38,
    radius: 0.85,
    behavior: 'vortex_pull'
  },
  PAPER_METAL: {
    id: 'PAPER_METAL',
    elements: ['PAPER', 'METAL'],
    recipeLabel: 'Papel + Metal',
    colorsLabel: 'Azul + Amarelo',
    name: 'Disco Laminado Condutor',
    effectDesc: 'Chakram giratório largo de médio alcance',
    primaryHex: '#4CC9F0',
    secondaryHex: '#FFCC00',
    colorA: 0x007aff,
    colorB: 0xffcc00,
    shape: 'chakram_disc',
    speed: 22,
    baseDamage: 42,
    radius: 0.9,
    behavior: 'wide_chakram'
  },
  GLASS_METAL: {
    id: 'GLASS_METAL',
    elements: ['GLASS', 'METAL'],
    recipeLabel: 'Vidro + Metal',
    colorsLabel: 'Verde + Amarelo',
    name: 'Espelho Solar Voltaico',
    effectDesc: 'Orbe concentrado de alto dano térmico/luminoso',
    primaryHex: '#B5E48C',
    secondaryHex: '#FFCC00',
    colorA: 0x34c759,
    colorB: 0xffcc00,
    shape: 'solar_mirror',
    speed: 20,
    baseDamage: 46,
    radius: 0.78,
    behavior: 'solar_flare'
  }
};

export function resolveRecipe(elemA, elemB) {
  if (!elemA || !elemB) return null;
  const key = getCanonicalRecipeKey(elemA, elemB);
  return COMBO_RECIPES[key] || null;
}

/**
 * RN04 / RN05 / E3-02 — Fórmula Matemática do Multiplicador Decrescente por Repetição (Stale Combo Decay)
 * M(0) = 4.0x (Combo variado / inédito)
 * M(1) = 2.5x (1ª repetição seguida do mesmo combo)
 * M(2) = 1.5x (2ª repetição seguida do mesmo combo)
 * M(R >= 3) = 1.0x (Combo saturado: não multiplica mais nada!)
 */
export function computeStaleMultiplier(repeatCount) {
  if (repeatCount <= 0) return 4.0;
  if (repeatCount === 1) return 2.5;
  if (repeatCount === 2) return 1.5;
  return 1.0;
}

/**
 * Cálculo de Pontuação (P_acerto = round(100 * M(R)))
 */
export function computeHitPoints(multiplier) {
  return Math.round(100 * multiplier);
}

/**
 * Cálculo de Dano no Inimigo (D_ataque = D_base * M(R))
 */
export function computeHitDamage(baseDamage, multiplier) {
  return Math.round(baseDamage * multiplier);
}
