import * as THREE from 'three';
import { CONAMA_ELEMENTS } from '../constants/recipes.js';

/**
 * E4-01 — Controlador do Painel Lateral (HUD) e Barra Inferior (STAGE / SCORE)
 */
export class HUDController {
  constructor(sidebarCharacter) {
    this.sidebarCharacter = sidebarCharacter;

    // Elementos DOM do Painel Lateral
    this.slotEls = [
      document.getElementById('slot-0'),
      document.getElementById('slot-1')
    ];
    this.conjuredBadge = document.getElementById('conjured-floating-badge');
    this.conjuredBadgeText = document.getElementById('conjured-badge-text');

    this.portraitBezel = document.getElementById('portrait-bezel');
    this.portraitMoodTag = document.getElementById('portrait-mood-tag');

    this.multiplierBox = document.getElementById('multiplier-box');
    this.multiplierValue = document.getElementById('multiplier-value');
    this.repeatCounterTag = document.getElementById('repeat-counter-tag');
    this.decaySteps = Array.from(document.querySelectorAll('.decay-step'));

    this.recipeCard = document.getElementById('recipe-display-card');
    this.recipeName = document.getElementById('recipe-name');
    this.recipeDesc = document.getElementById('recipe-desc');
    this.staleAlert = document.getElementById('stale-combo-alert');

    this.purityValue = document.getElementById('purity-value');
    this.purityFill = document.getElementById('purity-bar-fill');

    // Barra Inferior (STAGE / SCORE)
    this.stageCounter = document.getElementById('stage-counter');
    this.scoreCounter = document.getElementById('score-counter');
    this.enemiesAlivePill = document.getElementById('enemies-alive-pill');
    this.lastComboUsedLabel = document.getElementById('last-combo-used-label');

    // Camada de Textos Flutuantes 3D->2D e Modal de Pureza 0%
    this.floatingLayer = document.getElementById('floating-texts-layer');
    this.purityOverlay = document.getElementById('purity-depleted-overlay');
    this.finalScoreVal = document.getElementById('final-score-val');
    this.finalStageVal = document.getElementById('final-stage-val');
    this.finalKillsVal = document.getElementById('final-kills-val');
  }

  /**
   * Atualiza os 2 slots de elementos e a receita formada no painel lateral
   */
  updateComboHUD({ slots, recipe, displayMultiplier, displayRepeatCount, lastRecipe }) {
    // 1. Atualiza os 2 slots
    this.slotEls.forEach((slotEl, idx) => {
      const elemId = slots[idx];
      const iconSpan = slotEl.querySelector('.slot-icon');
      const nameSpan = slotEl.querySelector('.slot-name');

      if (elemId && CONAMA_ELEMENTS[elemId]) {
        const el = CONAMA_ELEMENTS[elemId];
        slotEl.classList.remove('empty');
        slotEl.style.borderColor = el.hex;
        iconSpan.style.background = el.hex;
        iconSpan.style.color = elemId === 'METAL' ? '#191708' : '#ffffff';
        iconSpan.textContent = el.keyDigit;
        nameSpan.textContent = el.shortName || el.name;
      } else {
        slotEl.classList.add('empty');
        slotEl.style.borderColor = 'rgba(255, 255, 255, 0.22)';
        iconSpan.style.background = '#323048';
        iconSpan.style.color = '#ffffff';
        iconSpan.textContent = '?';
        nameSpan.textContent = `SLOT ${idx + 1}`;
      }
    });

    // 2. Atualiza a Receita / Objeto formado
    if (recipe) {
      this.recipeName.textContent = recipe.name;
      this.recipeName.style.color = recipe.primaryHex;
      this.recipeDesc.textContent = `${recipe.recipeLabel} (${recipe.colorsLabel}) — ${recipe.effectDesc}`;
      this.recipeCard.style.borderColor = recipe.primaryHex;

      this.conjuredBadge.classList.remove('empty');
      this.conjuredBadge.style.borderColor = recipe.primaryHex;
      this.conjuredBadge.style.color = recipe.secondaryHex;
      this.conjuredBadgeText.textContent = `⚡ ${recipe.name.toUpperCase()}`;
    } else if (slots.length === 1) {
      const firstEl = CONAMA_ELEMENTS[slots[0]];
      this.recipeName.textContent = `${firstEl.name} carregado (Escolha a 2ª cor...)`;
      this.recipeName.style.color = firstEl.hex;
      this.recipeDesc.textContent = `Pressione 1/Q, 2/E, 3/R ou 4/F para fundir com ${firstEl.name}.`;
      this.recipeCard.style.borderColor = firstEl.hex;

      this.conjuredBadge.classList.remove('empty');
      this.conjuredBadge.style.borderColor = firstEl.hex;
      this.conjuredBadge.style.color = firstEl.hex;
      this.conjuredBadgeText.textContent = `${firstEl.name.toUpperCase()} + [ ? ]`;
    } else {
      this.recipeName.textContent = 'Pronto para Sintetizar Combo';
      this.recipeName.style.color = '#ffffff';
      this.recipeDesc.textContent =
        'Combine 2 cores (1/Q Plástico, 2/E Papel, 3/R Vidro, 4/F Metal) e clique no bicho!';
      this.recipeCard.style.borderColor = '#3c352d';

      this.conjuredBadge.classList.add('empty');
      this.conjuredBadge.style.borderColor = 'rgba(255,255,255,0.35)';
      this.conjuredBadge.style.color = '#dcd6f7';
      this.conjuredBadgeText.textContent = 'CANALIZE 2 CORES (1-4 / QERF)';
    }

    // 3. Atualiza o Multiplicador Decrescente (RN04 / E3-02 / E4-01)
    const isStale = displayMultiplier <= 1.0 && displayRepeatCount >= 3;
    this.multiplierValue.textContent = `${displayMultiplier.toFixed(1)}x`;

    if (displayRepeatCount <= 0) {
      this.repeatCounterTag.textContent = 'VARIADO (R=0)';
    } else if (displayRepeatCount >= 3) {
      this.repeatCounterTag.textContent = `SATURADO (R=${displayRepeatCount})`;
    } else {
      this.repeatCounterTag.textContent = `REPETIÇÃO (R=${displayRepeatCount})`;
    }

    // Classes de cor do Multiplicador
    this.multiplierBox.classList.remove('state-max', 'state-mid', 'state-low', 'state-stale');
    this.portraitBezel.classList.remove('state-stale');

    if (isStale) {
      this.multiplierBox.classList.add('state-stale');
      this.portraitBezel.classList.add('state-stale');
      this.staleAlert.classList.remove('hidden');
      this.portraitMoodTag.textContent = '1x REPETIDO!';
      this.portraitMoodTag.style.color = '#ff4d6d';
    } else {
      this.staleAlert.classList.add('hidden');
      if (displayMultiplier >= 4.0) {
        this.multiplierBox.classList.add('state-max');
        this.portraitMoodTag.textContent = '4x MÁXIMO!';
        this.portraitMoodTag.style.color = '#00f5d4';
      } else if (displayMultiplier >= 2.5) {
        this.multiplierBox.classList.add('state-mid');
        this.portraitMoodTag.textContent = '2.5x FOCO';
        this.portraitMoodTag.style.color = '#ffd166';
      } else {
        this.multiplierBox.classList.add('state-low');
        this.portraitMoodTag.textContent = '1.5x QUEDA';
        this.portraitMoodTag.style.color = '#f8961e';
      }
    }

    // Atualiza a trilha visual de degraus (4x -> 2.5x -> 1.5x -> 1x)
    const stepIdx = Math.min(3, Math.max(0, displayRepeatCount));
    this.decaySteps.forEach((stepEl, i) => {
      stepEl.classList.toggle('active', i === stepIdx);
    });

    // Atualiza o indicador central da barra inferior
    if (lastRecipe) {
      this.lastComboUsedLabel.textContent = `ÚLTIMO: ${lastRecipe.name.toUpperCase()} (${displayMultiplier.toFixed(1)}x)`;
    } else {
      this.lastComboUsedLabel.textContent = 'ÚLTIMO DISPARO: NENHUM (4.0x PRONTO)';
    }

    // Sincroniza estado com o retratista pixel art
    this.sidebarCharacter.updateState({
      slots: [...slots],
      recipe,
      multiplier: displayMultiplier,
      repeatCount: displayRepeatCount,
      isStale
    });
  }

  /**
   * Atualiza a Barra de Pureza Ambiental (100% até 0%)
   */
  updatePurity(purity) {
    const clamped = Math.max(0, Math.min(100, Math.round(purity)));
    this.purityValue.textContent = `${clamped}%`;
    this.purityFill.style.width = `${clamped}%`;

    if (clamped > 60) {
      this.purityFill.style.background = 'linear-gradient(90deg, #34c759 0%, #00f5d4 100%)';
    } else if (clamped > 30) {
      this.purityFill.style.background = 'linear-gradient(90deg, #f8961e 0%, #ffd166 100%)';
    } else {
      this.purityFill.style.background = 'linear-gradient(90deg, #d90429 0%, #ff3b30 100%)';
    }
  }

  /**
   * Atualiza STAGE, SCORE e contagem de bichos na barra inferior
   */
  updateStageAndScore(stage, score, enemiesAlive) {
    this.stageCounter.textContent = String(stage);
    this.scoreCounter.textContent = String(score);
    this.enemiesAlivePill.textContent = `BICHOS NA ARENA: ${enemiesAlive}`;
  }

  /**
   * Exibe texto flutuante projetado da coordenada 3D para a tela 2D (E3-02)
   */
  spawnFloatingText(worldPos, camera, viewportEl, text, color = '#ffd166') {
    const projected = worldPos.clone().project(camera);
    const rect = viewportEl.getBoundingClientRect();
    const x = (projected.x * 0.5 + 0.5) * rect.width;
    const y = (-projected.y * 0.5 + 0.5) * rect.height;

    const el = document.createElement('div');
    el.className = 'floating-combat-text';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.color = color;
    el.textContent = text;

    this.floatingLayer.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 950);
  }

  showPurityDepletedModal({ score, stage, kills }) {
    this.finalScoreVal.textContent = String(score);
    this.finalStageVal.textContent = String(stage);
    this.finalKillsVal.textContent = String(kills);
    this.purityOverlay.classList.remove('hidden');
  }

  hidePurityDepletedModal() {
    this.purityOverlay.classList.add('hidden');
  }
}
