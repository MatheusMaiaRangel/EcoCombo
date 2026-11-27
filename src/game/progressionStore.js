/**
 * RN13 / E6-01 — Camada de persistência local (localStorage) do EcoCombo 3D
 * Armazena apenas apelido curto (3 a 12 caracteres) e estatísticas locais da partida,
 * sem envio de dados a servidores externos.
 */

export const RECORDS_STORAGE_KEY = 'ecocombo_records_v1';
export const LAST_NICKNAME_STORAGE_KEY = 'ecocombo_last_nick_v1';
export const BADGES_STORAGE_KEY = 'ecocombo_badges_v1';
export const MAX_TOP_RECORDS = 5;

/**
 * E6-02 — Catálogo de Insígnias / Conquistas desbloqueáveis do EcoCombo 3D
 */
export const ACHIEVEMENT_BADGES = {
  ALCHEMIST: {
    id: 'ALCHEMIST',
    icon: '🏅',
    title: 'Alquimista da Reciclagem',
    description: 'Dispare 10 combinações distintas de recicláveis em uma mesma partida.',
    bonusPoints: 1000,
    accent: '#00f5d4'
  },
  HWEI_GRANDMASTER: {
    id: 'HWEI_GRANDMASTER',
    icon: '🌟',
    title: 'Grão-Mestre do Grimório',
    description: 'Use todas as 12 habilidades (4 lixeiras × 3 modos) em uma mesma partida.',
    bonusPoints: 1500,
    accent: '#ffd166'
  },
  ELEMENTAL_MASTERY: {
    id: 'ELEMENTAL_MASTERY',
    icon: '✦',
    title: 'Maestria Elemental',
    description: 'Complete uma sequência de 4 combos inéditos seguidos sem repetir.',
    bonusPoints: 400,
    accent: '#38bdf8'
  },
  COLOSSUS_SLAYER: {
    id: 'COLOSSUS_SLAYER',
    icon: '👑',
    title: 'Purificador do Colosso',
    description: 'Derrote o Chefão Colosso de Entulho ao final do Estágio 3.',
    bonusPoints: 500,
    accent: '#c084fc'
  },
  STYLE_S_RANK: {
    id: 'STYLE_S_RANK',
    icon: '⚡',
    title: 'Estilo Sustentável (S+)',
    description: 'Alcance o Rank S (4.0x) ou superior no Medidor Devil May Cry.',
    bonusPoints: 500,
    accent: '#ff7b00'
  }
};

export const ACHIEVEMENT_BADGE_LIST = Object.values(ACHIEVEMENT_BADGES);

export function sanitizeNickname(raw = '') {
  return String(raw)
    .replace(/[^a-zA-Z0-9À-ÿ _-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateNickname(raw = '') {
  const cleaned = sanitizeNickname(raw);
  if (cleaned.length < 3) {
    return {
      valid: false,
      cleaned,
      error: 'Informe um apelido entre 3 e 12 caracteres.'
    };
  }
  if (cleaned.length > 12) {
    return {
      valid: false,
      cleaned: cleaned.slice(0, 12),
      error: 'O apelido deve ter no máximo 12 caracteres.'
    };
  }
  return { valid: true, cleaned, error: '' };
}

export class ProgressionStore {
  loadTop5Records() {
    try {
      const raw = window.localStorage.getItem(RECORDS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((item) => item && typeof item.score === 'number' && typeof item.nickname === 'string')
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_TOP_RECORDS);
    } catch {
      return [];
    }
  }

  getLastNickname() {
    try {
      return sanitizeNickname(window.localStorage.getItem(LAST_NICKNAME_STORAGE_KEY) || '');
    } catch {
      return '';
    }
  }

  isTop5Eligible(score) {
    const safeScore = Math.max(0, Math.round(Number(score) || 0));
    if (safeScore <= 0) return false;
    const records = this.loadTop5Records();
    if (records.length < MAX_TOP_RECORDS) return true;
    return safeScore > records[records.length - 1].score;
  }

  saveTop5Record({
    nickname,
    score = 0,
    stage = 1,
    kills = 0,
    bestRank = 'D',
    elapsedSec = 0
  }) {
    const check = validateNickname(nickname);
    if (!check.valid) {
      return { saved: false, error: check.error, records: this.loadTop5Records(), rankPosition: -1 };
    }

    const safeScore = Math.max(0, Math.round(Number(score) || 0));
    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      nickname: check.cleaned,
      score: safeScore,
      stage: Math.max(1, Math.round(Number(stage) || 1)),
      kills: Math.max(0, Math.round(Number(kills) || 0)),
      bestRank: String(bestRank || 'D'),
      elapsedSec: Math.max(0, Math.round(Number(elapsedSec) || 0)),
      dateIso: new Date().toISOString()
    };

    const records = this.loadTop5Records();
    records.push(entry);
    records.sort((a, b) => b.score - a.score);
    const trimmed = records.slice(0, MAX_TOP_RECORDS);
    const rankPosition = trimmed.findIndex((r) => r.id === entry.id) + 1;

    try {
      window.localStorage.setItem(RECORDS_STORAGE_KEY, JSON.stringify(trimmed));
      window.localStorage.setItem(LAST_NICKNAME_STORAGE_KEY, check.cleaned);
    } catch {
      return {
        saved: false,
        error: 'Não foi possível salvar no navegador (localStorage indisponível).',
        records: trimmed,
        rankPosition
      };
    }

    return {
      saved: true,
      error: '',
      records: trimmed,
      rankPosition,
      entry
    };
  }

  /**
   * E6-02 — Carrega e persiste insígnias desbloqueadas e combinações descobertas no navegador
   */
  loadBadgesState() {
    const fallback = {
      unlockedIds: [],
      unlockedAt: {},
      discoveredSpellIds: []
    };
    try {
      const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return {
        unlockedIds: Array.isArray(parsed.unlockedIds) ? parsed.unlockedIds : [],
        unlockedAt: parsed.unlockedAt && typeof parsed.unlockedAt === 'object' ? parsed.unlockedAt : {},
        discoveredSpellIds: Array.isArray(parsed.discoveredSpellIds) ? parsed.discoveredSpellIds : []
      };
    } catch {
      return fallback;
    }
  }

  saveBadgesState(state) {
    try {
      window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  recordDiscoveredSpell(spellId) {
    if (!spellId) return this.loadBadgesState();
    const state = this.loadBadgesState();
    if (!state.discoveredSpellIds.includes(spellId)) {
      state.discoveredSpellIds.push(spellId);
      this.saveBadgesState(state);
    }
    return state;
  }

  unlockBadge(badgeId) {
    const badge = ACHIEVEMENT_BADGES[badgeId];
    const state = this.loadBadgesState();
    if (!badge) return { newlyUnlocked: false, badge: null, state };

    const newlyUnlocked = !state.unlockedIds.includes(badgeId);
    if (newlyUnlocked) {
      state.unlockedIds.push(badgeId);
      state.unlockedAt[badgeId] = new Date().toISOString();
      this.saveBadgesState(state);
    }
    return { newlyUnlocked, badge, state };
  }
}
