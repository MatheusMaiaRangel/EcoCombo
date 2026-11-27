/**
 * RN13 / E6-01 — Camada de persistência local (localStorage) do EcoCombo 3D
 * Armazena apenas apelido curto (3 a 12 caracteres) e estatísticas locais da partida,
 * sem envio de dados a servidores externos.
 */

export const RECORDS_STORAGE_KEY = 'ecocombo_records_v1';
export const LAST_NICKNAME_STORAGE_KEY = 'ecocombo_last_nick_v1';
export const MAX_TOP_RECORDS = 5;

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
}
