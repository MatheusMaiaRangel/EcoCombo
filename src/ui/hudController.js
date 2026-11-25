import {
  CONAMA_ELEMENTS,
  STAGE_2_UNLOCK_TIME_SEC,
  STAGE_3_UNLOCK_TIME_SEC,
  getBinItemNamesForStage,
  resolveHweiSpell
} from '../constants/recipes.js';

function formatMatchTime(totalSeconds = 0) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * E4-01 e E4-05 — Controlador do Painel Lateral (HUD), Medidor de Estilo Devil May Cry (D-SSS + Multiplicador embaixo)
 * e Leque de Opções estilo Hwei (Q = Dano, E = Controle Único da Lixeira, R = Escudo Protetivo)
 */
export class HUDController {
  constructor(sidebarCharacter) {
    this.sidebarCharacter = sidebarCharacter;

    this.conjuredBadge = document.getElementById('conjured-floating-badge');
    this.conjuredBadgeText = document.getElementById('conjured-badge-text');

    this.portraitBezel = document.getElementById('portrait-bezel');
    this.portraitMoodTag = document.getElementById('portrait-mood-tag');

    // Medidor Devil May Cry no Painel Lateral
    this.multiplierBox = document.getElementById('multiplier-box');
    this.dmcRankLetter = document.getElementById('dmc-rank-letter');
    this.dmcRankTitle = document.getElementById('dmc-rank-title');
    this.dmcStyleBarFill = document.getElementById('dmc-style-bar-fill');
    this.dmcSteps = Array.from(document.querySelectorAll('.dmc-step'));
    this.multiplierValue = document.getElementById('multiplier-value');
    this.repeatCounterTag = document.getElementById('repeat-counter-tag');

    // Medidor Devil May Cry em Destaque no Canto Superior Direito da Arena 3D
    this.dmcArenaHud = document.getElementById('dmc-arena-hud');
    this.dmcArenaLetter = document.getElementById('dmc-arena-letter');
    this.dmcArenaTitle = document.getElementById('dmc-arena-title');
    this.dmcArenaSubtitle = document.getElementById('dmc-arena-subtitle');
    this.dmcArenaBarFill = document.getElementById('dmc-arena-bar-fill');
    this.dmcArenaMultVal = document.getElementById('dmc-arena-mult-val');

    // Grimório / Leque Hwei no Painel Lateral e na Arena
    this.recipeCard = document.getElementById('recipe-display-card');
    this.recipeBinStatus = document.getElementById('recipe-bin-status');
    this.recipeName = document.getElementById('recipe-name');
    this.recipeDesc = document.getElementById('recipe-desc');
    this.sidebarCcName = document.getElementById('sidebar-cc-name');

    this.hweiArenaFan = document.getElementById('hwei-arena-fan');
    this.hweiFanHeader = document.getElementById('hwei-fan-header');
    this.hweiFanBinBadge = document.getElementById('hwei-fan-bin-badge');
    this.fanDamageDesc = document.getElementById('fan-damage-desc');
    this.fanCcIcon = document.getElementById('fan-cc-icon');
    this.fanCcTitle = document.getElementById('fan-cc-title');
    this.fanCcDesc = document.getElementById('fan-cc-desc');
    this.fanShieldDesc = document.getElementById('fan-shield-desc');
    this.sidebarShieldBtn = document.querySelector('.hwei-mini-btn[data-hwei-mode="SHIELD"]');
    this.sidebarShieldTitle = this.sidebarShieldBtn
      ? this.sidebarShieldBtn.querySelector('.hwei-mode-title')
      : null;
    this.fanShieldCard = document.querySelector('.hwei-fan-card[data-hwei-mode="SHIELD"]');
    this.fanShieldName = this.fanShieldCard
      ? this.fanShieldCard.querySelector('.fan-mode-name')
      : null;

    this.staleAlert = document.getElementById('stale-combo-alert');

    this.purityValue = document.getElementById('purity-value');
    this.purityFill = document.getElementById('purity-bar-fill');

    // Barra Inferior (STAGE / TIMER / SCORE)
    this.stageCounter = document.getElementById('stage-counter');
    this.matchTimerPill = document.getElementById('match-timer-pill');
    this.scoreCounter = document.getElementById('score-counter');
    this.enemiesAlivePill = document.getElementById('enemies-alive-pill');
    this.lastComboUsedLabel = document.getElementById('last-combo-used-label');

    // Banner de transição de Estágio (E2-06 Estágio 2 / E2-03 Estágio 3)
    this.arenaViewport = document.getElementById('arena-viewport');
    this.damageFlashTimeout = null;
    this.stageTransitionBanner = document.getElementById('stage-transition-banner');
    this.stageBannerBadge = this.stageTransitionBanner
      ? this.stageTransitionBanner.querySelector('.stage-banner-badge')
      : null;
    this.stageBannerTitle = this.stageTransitionBanner
      ? this.stageTransitionBanner.querySelector('.stage-banner-title')
      : null;
    this.stageBannerEnemies = this.stageTransitionBanner
      ? this.stageTransitionBanner.querySelector('.stage-banner-enemies')
      : null;
    this.stageBannerTimeout = null;
    this.currentStage = 1;

    // Camada de Textos Flutuantes 3D->2D e Modal de Pureza 0%
    this.floatingLayer = document.getElementById('floating-texts-layer');
    this.floatingTextEnabled = true;

    this.purityOverlay = document.getElementById('purity-depleted-overlay');
    this.finalScoreVal = document.getElementById('final-score-val');
    this.finalStageVal = document.getElementById('final-stage-val');
    this.finalKillsVal = document.getElementById('final-kills-val');

    // Menu Inicial e Menu de Pausa com Opções (ESC — E4-06)
    this.startMenuOverlay = document.getElementById('start-menu-overlay');
    this.pauseMenuOverlay = document.getElementById('pause-menu-overlay');
    this.pauseScoreVal = document.getElementById('pause-score-val');
    this.pauseStageVal = document.getElementById('pause-stage-val');
    this.pausePurityVal = document.getElementById('pause-purity-val');
    this.pauseRankVal = document.getElementById('pause-rank-val');
  }

  /**
   * Atualiza apenas a barra de progresso do Style Meter DMC durante o decaimento contínuo
   */
  updateStyleMeterBarOnly(styleState) {
    if (!styleState) return;
    const pct = `${Math.round(styleState.progressPercent)}%`;
    if (this.dmcStyleBarFill) {
      this.dmcStyleBarFill.style.width = pct;
    }
    if (this.dmcArenaBarFill) {
      this.dmcArenaBarFill.style.width = pct;
    }
  }

  /**
   * Atualiza visualmente o tempo restante, cargas (até 2 hits) e recarga do Escudo nos botões e badge
   */
  updateShieldStatus(
    activeShieldBin,
    shieldTimer = 0,
    shieldCooldown = 0,
    openBinId = null,
    shieldCharges = 0,
    shieldMaxCharges = 2
  ) {
    const isActive = Boolean(activeShieldBin) && shieldTimer > 0 && shieldCharges > 0;
    const isOnCooldown = !isActive && shieldCooldown > 0;

    if (this.sidebarShieldBtn && this.sidebarShieldTitle) {
      this.sidebarShieldBtn.classList.toggle('on-cooldown', isOnCooldown);
      this.sidebarShieldBtn.classList.toggle('shield-live', isActive);
      if (isActive) {
        this.sidebarShieldTitle.textContent = `${shieldCharges}/${shieldMaxCharges} · ${shieldTimer.toFixed(1)}s`;
      } else if (isOnCooldown) {
        this.sidebarShieldTitle.textContent = `CD ${shieldCooldown.toFixed(1)}s`;
      } else {
        this.sidebarShieldTitle.textContent = 'ESCUDO';
      }
    }

    if (this.fanShieldCard && this.fanShieldName) {
      this.fanShieldCard.classList.toggle('on-cooldown', isOnCooldown);
      this.fanShieldCard.classList.toggle('shield-live', isActive);
      if (isActive) {
        this.fanShieldName.textContent = `ESCUDO [${shieldCharges}/${shieldMaxCharges}] (${shieldTimer.toFixed(1)}s)`;
      } else if (isOnCooldown) {
        this.fanShieldName.textContent = `RECARGA (${shieldCooldown.toFixed(1)}s)`;
      } else {
        this.fanShieldName.textContent = 'ESCUDO SELETIVO';
      }
    }

    // Quando nenhuma lixeira está aberta, reflete o status do escudo no badge do personagem
    if (!openBinId && this.conjuredBadge && this.conjuredBadgeText) {
      if (isActive && CONAMA_ELEMENTS[activeShieldBin]) {
        const shElem = CONAMA_ELEMENTS[activeShieldBin];
        this.conjuredBadge.classList.remove('empty');
        this.conjuredBadge.style.borderColor = shElem.hex;
        this.conjuredBadge.style.color = shElem.hex;
        this.conjuredBadgeText.textContent = `🛡 ESCUDO ${shElem.shortName.toUpperCase()} [${shieldCharges}/${shieldMaxCharges}] (${shieldTimer.toFixed(1)}s)`;
      } else if (isOnCooldown) {
        this.conjuredBadge.classList.add('empty');
        this.conjuredBadge.style.borderColor = 'rgba(255, 209, 102, 0.55)';
        this.conjuredBadge.style.color = '#ffd166';
        this.conjuredBadgeText.textContent = `🛡 ESCUDO EM RECARGA (${shieldCooldown.toFixed(1)}s)`;
      } else {
        this.conjuredBadge.classList.add('empty');
        this.conjuredBadge.style.borderColor = 'rgba(255,255,255,0.35)';
        this.conjuredBadge.style.color = '#dcd6f7';
        this.conjuredBadgeText.textContent = 'ABRA UMA LIXEIRA (Q, E, R, F)';
      }
    }
  }

  /**
   * Atualiza o Grimório Hwei (Lixeira aberta + Leque de 3 modos) e o Style Meter Devil May Cry (D-SSS + Multiplicador embaixo)
   */
  updateComboHUD({
    openBinId,
    styleState,
    displayMultiplier,
    displayRepeatCount,
    lastRecipe,
    activeShieldBin
  }) {
    const binElem = openBinId ? CONAMA_ELEMENTS[openBinId] : null;
    const isStale = displayRepeatCount >= 3;

    // 1. Atualiza o Leque Hwei (no Painel Lateral e na Arena)
    if (binElem) {
      const dmgSpell = resolveHweiSpell(openBinId, 'DAMAGE');
      const ccSpell = resolveHweiSpell(openBinId, 'CONTROL');
      const shieldSpell = resolveHweiSpell(openBinId, 'SHIELD');
      const binItemsLabel = getBinItemNamesForStage(openBinId, this.currentStage).join(' + ');

      this.recipeBinStatus.textContent = `LIXEIRA ABERTA: [${binElem.keyAlt}] ${binElem.shortName.toUpperCase()}`;
      this.recipeName.textContent = `${binElem.name} (${binItemsLabel})`;
      this.recipeName.style.color = binElem.hex;
      this.recipeDesc.textContent = `Escolha no Leque: [Q] Mais Dano • [E] ${binElem.ccShort} • [R] Escudo Protetivo`;
      this.recipeCard.style.borderColor = binElem.hex;
      this.sidebarCcName.textContent = binElem.ccShort;

      this.conjuredBadge.classList.remove('empty');
      this.conjuredBadge.style.borderColor = binElem.hex;
      this.conjuredBadge.style.color = binElem.hex;
      this.conjuredBadgeText.textContent = `🗑 [${binElem.keyAlt}] ${binElem.shortName.toUpperCase()} → Q / E / R`;

      // Mostra o Leque Visual na Arena
      this.hweiArenaFan.classList.remove('hidden');
      this.hweiArenaFan.style.borderColor = binElem.hex;
      this.hweiFanHeader.style.background = binElem.hex;
      this.hweiFanHeader.style.color = openBinId === 'METAL' ? '#191708' : '#ffffff';
      this.hweiFanBinBadge.textContent = `LIXEIRA [${binElem.keyAlt}] ${binElem.shortName.toUpperCase()} — ALVOS: ${binItemsLabel.toUpperCase()}`;

      this.fanDamageDesc.textContent = `Dano máximo em ${binItemsLabel}`;
      this.fanCcIcon.textContent =
        openBinId === 'PLASTIC'
          ? '↔'
          : openBinId === 'PAPER'
            ? '🌀'
            : openBinId === 'GLASS'
              ? '❄'
              : '⚡';
      this.fanCcTitle.textContent = binElem.ccLabel;
      this.fanCcDesc.textContent = ccSpell ? ccSpell.effectDesc : '';
      this.fanShieldDesc.textContent = shieldSpell ? shieldSpell.effectDesc : '';
    } else {
      this.recipeBinStatus.textContent = 'PASSO 1: ABRA A LIXEIRA DO ITEM';
      this.recipeName.textContent = 'Grimório Seletivo (Q, E, R, F)';
      this.recipeName.style.color = '#ffffff';
      this.recipeDesc.textContent =
        'Olhe o item vindo: [Q] Garrafa PET • [E] Papelão • [R] Vidro • [F] Porca de Metal';
      this.recipeCard.style.borderColor = '#3c352d';
      this.sidebarCcName.textContent = 'CONTROLE';

      if (activeShieldBin && CONAMA_ELEMENTS[activeShieldBin]) {
        const shElem = CONAMA_ELEMENTS[activeShieldBin];
        this.conjuredBadge.classList.remove('empty');
        this.conjuredBadge.style.borderColor = shElem.hex;
        this.conjuredBadge.style.color = shElem.hex;
        this.conjuredBadgeText.textContent = `🛡 ESCUDO ${shElem.shortName.toUpperCase()} ATIVO`;
      } else {
        this.conjuredBadge.classList.add('empty');
        this.conjuredBadge.style.borderColor = 'rgba(255,255,255,0.35)';
        this.conjuredBadge.style.color = '#dcd6f7';
        this.conjuredBadgeText.textContent = 'ABRA UMA LIXEIRA (Q, E, R, F)';
      }

      // Esconde o Leque da Arena enquanto nenhuma lixeira está aberta
      this.hweiArenaFan.classList.add('hidden');
    }

    // 2. Atualiza o Medidor de Estilo Devil May Cry (Ranks D, C, B, A, S, SS, SSS + Multiplicador Destacado Embaixo)
    if (styleState) {
      const rankClasses = [
        'rank-d',
        'rank-c',
        'rank-b',
        'rank-a',
        'rank-s',
        'rank-ss',
        'rank-sss',
        'state-stale'
      ];
      this.multiplierBox.classList.remove(...rankClasses);
      this.dmcArenaHud.classList.remove(...rankClasses);
      this.multiplierBox.classList.add(styleState.stateClass);
      this.dmcArenaHud.classList.add(styleState.stateClass);

      this.dmcRankLetter.textContent = styleState.rank;
      this.dmcRankLetter.style.color = styleState.color;
      this.dmcRankTitle.textContent = styleState.title;
      this.dmcRankTitle.style.color = styleState.color;
      this.dmcStyleBarFill.style.width = `${Math.round(styleState.progressPercent)}%`;
      this.dmcStyleBarFill.style.background = styleState.color;

      this.dmcArenaLetter.textContent = styleState.rank;
      this.dmcArenaLetter.style.color = styleState.color;
      this.dmcArenaTitle.textContent = styleState.title;
      this.dmcArenaTitle.style.color = styleState.color;
      this.dmcArenaSubtitle.textContent = styleState.subtitle;
      this.dmcArenaBarFill.style.width = `${Math.round(styleState.progressPercent)}%`;
      this.dmcArenaBarFill.style.background = styleState.color;

      // Escada de letras D -> C -> B -> A -> S -> SS -> SSS
      this.dmcSteps.forEach((stepEl) => {
        stepEl.classList.toggle('active', stepEl.getAttribute('data-rank') === styleState.rank);
      });
    }

    // MULTIPLICADOR GIGANTE EMBAIXO DO RANK
    this.multiplierValue.textContent = `${displayMultiplier.toFixed(1)}x`;
    this.dmcArenaMultVal.textContent = `⚡ ${displayMultiplier.toFixed(1)}x`;

    if (isStale) {
      this.repeatCounterTag.textContent = `REPETIDO (R=${displayRepeatCount})`;
      this.multiplierBox.classList.add('state-stale');
      this.portraitBezel.classList.add('state-stale');
      this.staleAlert.classList.remove('hidden');
      this.portraitMoodTag.textContent = 'VARIE O MODO!';
      this.portraitMoodTag.style.color = '#ff4d6d';
    } else {
      this.portraitBezel.classList.remove('state-stale');
      this.staleAlert.classList.add('hidden');
      this.repeatCounterTag.textContent =
        displayRepeatCount === 0 ? 'ESTILO LIVRE!' : `R=${displayRepeatCount}`;

      if (displayMultiplier >= 4.0) {
        this.portraitMoodTag.textContent = `RANK ${styleState?.rank || 'S'}!`;
        this.portraitMoodTag.style.color = '#00f5d4';
      } else if (displayMultiplier >= 2.0) {
        this.portraitMoodTag.textContent = `RANK ${styleState?.rank || 'B'}`;
        this.portraitMoodTag.style.color = '#ffd166';
      } else {
        this.portraitMoodTag.textContent = `RANK ${styleState?.rank || 'C'}`;
        this.portraitMoodTag.style.color = '#4cc9f0';
      }
    }

    if (lastRecipe) {
      this.lastComboUsedLabel.textContent = `ÚLTIMO: [${lastRecipe.comboKeys}] ${lastRecipe.name.toUpperCase()} (${displayMultiplier.toFixed(1)}x)`;
    } else {
      this.lastComboUsedLabel.textContent = 'ABRA UMA LIXEIRA [Q, E, R, F] E ESCOLHA [Q=DANO | E=CONTROLE | R=ESCUDO]';
    }

    this.sidebarCharacter.updateState({
      slots: openBinId ? [openBinId] : [],
      recipe: openBinId ? resolveHweiSpell(openBinId, 'DAMAGE') : lastRecipe,
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

  setCurrentStage(stage = 1) {
    this.currentStage = stage;
  }

  /**
   * E2-02 — Pulso visual breve na borda da arena ao sofrer dano de inimigo
   */
  triggerDamageFlash() {
    if (!this.arenaViewport) return;
    if (this.damageFlashTimeout) {
      clearTimeout(this.damageFlashTimeout);
    }
    this.arenaViewport.classList.remove('damage-hit-flash');
    void this.arenaViewport.offsetWidth;
    this.arenaViewport.classList.add('damage-hit-flash');
    this.damageFlashTimeout = setTimeout(() => {
      if (this.arenaViewport) {
        this.arenaViewport.classList.remove('damage-hit-flash');
      }
      this.damageFlashTimeout = null;
    }, 360);
  }

  showStageTransitionBanner(stage = 2, durationMs = 5200) {
    if (!this.stageTransitionBanner) return;
    if (this.stageBannerTimeout) {
      clearTimeout(this.stageBannerTimeout);
    }

    const isStage3 = stage >= 3;
    this.stageTransitionBanner.classList.toggle('stage-3', isStage3);

    if (this.stageBannerBadge) {
      this.stageBannerBadge.textContent = isStage3
        ? '🔥 ESTÁGIO 3 ATIVADO · 03:00 (ONDA FINAL)'
        : '⚡ ESTÁGIO 2 ATIVADO · 01:30';
    }
    if (this.stageBannerTitle) {
      this.stageBannerTitle.textContent = isStage3
        ? 'DESAFIO MÁXIMO: +30% HP · +16% VELOCIDADE!'
        : 'ARENA EXPANDIDA & +4 NOVOS INIMIGOS (+15% HP · +8% VEL)!';
    }
    if (this.stageBannerEnemies) {
      this.stageBannerEnemies.innerHTML = isStage3
        ? `
          <span class="stage-enemy-chip armored">🛡 +INIMIGOS BLINDADOS (QUEBRE C/ [COR+E])</span>
          <span class="stage-enemy-chip metal">⚡ RITMO ACELERADO</span>
          <span class="stage-enemy-chip plastic">👑 CHEFÃO NO FIM DO ESTÁGIO (EM BREVE)</span>
        `
        : `
          <span class="stage-enemy-chip plastic">[Q] Sacola Plástica</span>
          <span class="stage-enemy-chip paper">[E] Jornal Velho</span>
          <span class="stage-enemy-chip glass">[R] Pote de Vidro</span>
          <span class="stage-enemy-chip metal">[F] Lata de Alumínio</span>
        `;
    }

    this.stageTransitionBanner.classList.remove('hidden');
    this.stageBannerTimeout = setTimeout(() => {
      this.hideStageTransitionBanner();
    }, durationMs);
  }

  hideStageTransitionBanner() {
    if (this.stageBannerTimeout) {
      clearTimeout(this.stageBannerTimeout);
      this.stageBannerTimeout = null;
    }
    if (this.stageTransitionBanner) {
      this.stageTransitionBanner.classList.add('hidden');
    }
  }

  /**
   * Atualiza STAGE, cronômetro de partida, SCORE e contagem de itens recicláveis na barra inferior
   */
  updateStageAndScore(stage, score, enemiesAlive, matchElapsedSec = 0) {
    this.stageCounter.textContent = String(stage);
    this.scoreCounter.textContent = String(score);
    this.enemiesAlivePill.textContent = `ITENS NA ARENA: ${enemiesAlive}`;

    if (this.matchTimerPill) {
      const timeStr = formatMatchTime(matchElapsedSec);
      const stage2Str = formatMatchTime(STAGE_2_UNLOCK_TIME_SEC);
      const stage3Str = formatMatchTime(STAGE_3_UNLOCK_TIME_SEC);

      if (stage >= 3) {
        this.matchTimerPill.textContent = `⏱ ${timeStr} • EST. 3 FINAL`;
        this.matchTimerPill.classList.remove('stage-soon', 'stage-expanded');
        this.matchTimerPill.classList.add('stage-final');
      } else if (stage === 2) {
        this.matchTimerPill.textContent = `⏱ ${timeStr} / ${stage3Str} • EST. 2`;
        this.matchTimerPill.classList.remove('stage-final');
        this.matchTimerPill.classList.add('stage-expanded');
        this.matchTimerPill.classList.toggle(
          'stage-soon',
          matchElapsedSec >= STAGE_3_UNLOCK_TIME_SEC - 10
        );
      } else {
        this.matchTimerPill.textContent = `⏱ ${timeStr} / ${stage2Str}`;
        this.matchTimerPill.classList.remove('stage-expanded', 'stage-final');
        this.matchTimerPill.classList.toggle(
          'stage-soon',
          matchElapsedSec >= STAGE_2_UNLOCK_TIME_SEC - 10
        );
      }
    }
  }

  setFloatingTextEnabled(enabled) {
    this.floatingTextEnabled = Boolean(enabled);
    if (!this.floatingTextEnabled && this.floatingLayer) {
      this.floatingLayer.innerHTML = '';
    }
    return this.floatingTextEnabled;
  }

  /**
   * Exibe texto flutuante projetado da coordenada 3D para a tela 2D
   */
  spawnFloatingText(worldPos, camera, viewportEl, text, color = '#ffd166') {
    if (!this.floatingTextEnabled || !camera || !viewportEl) return;
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
    }, 1050);
  }

  showStartMenu() {
    if (this.startMenuOverlay) {
      this.startMenuOverlay.classList.remove('hidden', 'options-open');
    }
  }

  hideStartMenu() {
    if (this.startMenuOverlay) {
      this.startMenuOverlay.classList.remove('options-open');
      this.startMenuOverlay.classList.add('hidden');
    }
  }

  showPauseMenu({ score, stage, purity, rank }) {
    if (this.pauseScoreVal) this.pauseScoreVal.textContent = String(score);
    if (this.pauseStageVal) this.pauseStageVal.textContent = String(stage);
    if (this.pausePurityVal) this.pausePurityVal.textContent = `${Math.round(purity)}%`;
    if (this.pauseRankVal) this.pauseRankVal.textContent = rank || 'D';
    if (this.pauseMenuOverlay) {
      this.pauseMenuOverlay.classList.remove('hidden');
    }
  }

  hidePauseMenu() {
    if (this.pauseMenuOverlay) {
      this.pauseMenuOverlay.classList.add('hidden');
    }
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
