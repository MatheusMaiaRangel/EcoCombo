import * as THREE from 'three';

const MOVE_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight'
]);

const CODE_LABELS = {
  KeyW: 'W',
  KeyA: 'A',
  KeyS: 'S',
  KeyD: 'D',
  ArrowUp: '↑',
  ArrowLeft: '←',
  ArrowDown: '↓',
  ArrowRight: '→',
  KeyQ: 'Q',
  KeyE: 'E',
  KeyR: 'R',
  KeyF: 'F',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  MouseLeft: 'CLIQUE ESQ.',
  MouseRight: 'CLIQUE DIR.'
};

/**
 * E4-07 — Controlador do Tutorial Interativo Guiado na Arena (máx. ~2 min)
 * - Entra direto na arena 2.5D ao clicar em "COMO JOGAR" no Menu Inicial
 * - Exibe exatamente quais teclas apertar em cada etapa e bloqueia todas as demais teclas
 * - Ensina na prática: WASD + Mira, Abrir Lixeira CONAMA (Q/E/R/F), Mais Dano (Q),
 *   Controle de Grupo (E), Escudo Seletivo (R) e Combate Variado / Rank DMC
 */
export class TutorialManager {
  constructor({ player, comboSystem, enemyManager, hud, sound, camera, viewportEl, onFinished }) {
    this.player = player;
    this.comboSystem = comboSystem;
    this.enemyManager = enemyManager;
    this.hud = hud;
    this.sound = sound;
    this.camera = camera;
    this.viewportEl = viewportEl;
    this.onFinished = onFinished;

    this.active = false;
    this.completed = false;
    this.stepIndex = 0;
    this.totalSteps = 6;

    // Estado interno por etapa
    this.moveDistance = 0;
    this.moveRequiredDistance = 3.8;
    this.lastPlayerPos = new THREE.Vector3();
    this.stepTransitionTimer = 0;
    this.pendingNextStep = false;
    this.shieldActivatedInStep = false;
    this.shieldWaitTimer = 0;
    this.controlLanded = false;
    this.blockedNoticeTimer = 0;
    this.lastBlockedSoundAt = 0;

    // Elementos do DOM do HUD do Tutorial
    this.bannerEl = document.getElementById('tutorial-guide-banner');
    this.stepBadgeEl = document.getElementById('tutorial-step-badge');
    this.progressFillEl = document.getElementById('tutorial-progress-fill');
    this.titleEl = document.getElementById('tutorial-step-title');
    this.descEl = document.getElementById('tutorial-step-desc');
    this.keysRowEl = document.getElementById('tutorial-allowed-keys');
    this.lockHintEl = document.getElementById('tutorial-lock-hint');
    this.completeModalEl = document.getElementById('tutorial-complete-overlay');
  }

  start() {
    this.active = true;
    this.completed = false;
    this.stepIndex = 0;
    this.pendingNextStep = false;
    this.stepTransitionTimer = 0;
    this.blockedNoticeTimer = 0;

    this.enemyManager.setAutoSpawnEnabled(false);
    this.enemyManager.reset();
    this.player.reset();
    this.comboSystem.reset();

    // Registra travas de entrada no PlayerController e ComboSystem
    this.player.setInputGate({
      canUseMoveKey: (code) => this.isMoveKeyAllowed(code),
      onBlockedMoveKey: (code) => this.handleBlockedKey(code)
    });

    this.comboSystem.setInputGate({
      canOpenBin: (binId, code) => this.isOpenBinAllowed(binId, code),
      canExecuteMode: (modeId, binId, code) => this.isExecuteModeAllowed(modeId, binId, code),
      onBlockedInput: (code) => this.handleBlockedKey(code),
      onBinOpened: (binId) => this.handleBinOpened(binId),
      onSpellExecuted: (info) => this.handleSpellExecuted(info)
    });

    this.enemyManager.onControlHit = (info) => this.handleControlHit(info);
    this.enemyManager.onShieldBlock = (info) => this.handleShieldBlock(info);

    if (this.completeModalEl) {
      this.completeModalEl.classList.add('hidden');
    }
    if (this.bannerEl) {
      this.bannerEl.classList.remove('hidden');
    }

    this.enterStep(0);
  }

  stop() {
    this.active = false;
    this.completed = false;
    this.pendingNextStep = false;

    // Libera 100% dos controles ao sair do tutorial
    this.player.setInputGate();
    this.comboSystem.setInputGate();
    this.enemyManager.setAutoSpawnEnabled(true);
    this.enemyManager.onControlHit = null;
    this.enemyManager.onShieldBlock = null;

    if (this.bannerEl) {
      this.bannerEl.classList.add('hidden');
    }
    if (this.completeModalEl) {
      this.completeModalEl.classList.add('hidden');
    }
  }

  /**
   * Calcula uma posição visível e segura na arena relativa ao protagonista
   */
  getSpotAhead(offsetX, offsetZ) {
    const limit = 10.2;
    let x = this.player.position.x + offsetX;
    let z = this.player.position.z + offsetZ;
    // Se ficou muito perto da borda, espelha para o centro da arena
    if (Math.abs(x) > limit) x = -offsetX * 0.85;
    if (Math.abs(z) > limit) z = -offsetZ * 0.85;
    return {
      x: THREE.MathUtils.clamp(x, -limit, limit),
      z: THREE.MathUtils.clamp(z, -limit, limit)
    };
  }

  enterStep(index) {
    this.stepIndex = index;
    this.pendingNextStep = false;
    this.stepTransitionTimer = 0;
    this.shieldActivatedInStep = false;
    this.shieldWaitTimer = 0;
    this.controlLanded = false;
    this.blockedNoticeTimer = 0;
    if (this.lockHintEl) {
      this.lockHintEl.classList.remove('shake-alert');
    }
    this.player.clearKeys();

    if (index === 0) {
      // PASSO 1: Movimentação WASD
      this.moveDistance = 0;
      this.lastPlayerPos.copy(this.player.position);
      this.enemyManager.reset();
      if (this.comboSystem.openBinId) this.comboSystem.closeBin(false);
    } else if (index === 1) {
      // PASSO 2: Abrir a Lixeira Vermelha (Q = Plástico) para a Garrafa PET
      this.enemyManager.reset();
      if (this.comboSystem.openBinId) this.comboSystem.closeBin(false);
      const spot = this.getSpotAhead(4.6, -4.6);
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'PLASTIC_PET',
        x: spot.x,
        z: spot.z,
        speed: 0,
        hp: 75
      });
    } else if (index === 2) {
      // PASSO 3: Disparar Mais Dano (Q no Leque) mirando na Garrafa PET
      // Mantém a Garrafa PET viva e a Lixeira de Plástico aberta
      if (this.enemyManager.enemies.length === 0) {
        const spot = this.getSpotAhead(4.6, -4.6);
        this.enemyManager.spawnTutorialEnemy({
          variantId: 'PLASTIC_PET',
          x: spot.x,
          z: spot.z,
          speed: 0,
          hp: 75
        });
      }
      if (this.comboSystem.openBinId !== 'PLASTIC') {
        this.comboSystem.openBin('PLASTIC');
      }
    } else if (index === 3) {
      // PASSO 4: Controle de Grupo (E Papel -> E Juntar) em 2 Caixas de Papelão
      this.enemyManager.reset();
      if (this.comboSystem.openBinId) this.comboSystem.closeBin(false);
      const spotA = this.getSpotAhead(5.2, -3.2);
      const spotB = this.getSpotAhead(3.0, -5.8);
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'PAPER_BOX',
        x: spotA.x,
        z: spotA.z,
        speed: 0,
        hp: 150
      });
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'PAPER_BOX',
        x: spotB.x,
        z: spotB.z,
        speed: 0,
        hp: 150
      });
    } else if (index === 4) {
      // PASSO 5: Escudo Protetivo Seletivo (F Metal -> R Escudo) contra Porca de Metal se aproximando
      this.enemyManager.reset();
      if (this.comboSystem.openBinId) this.comboSystem.closeBin(false);
      this.player.clearShield(false);
      this.player.shieldCooldown = 0;
      const spot = this.getSpotAhead(5.8, -5.8);
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'METAL_NUT',
        x: spot.x,
        z: spot.z,
        speed: 2.35,
        hp: 140
      });
    } else if (index === 5) {
      // PASSO 6: Combate livre — Todas as teclas liberadas! Recicle 2 itens variados e veja o Rank subir
      this.enemyManager.reset();
      if (this.comboSystem.openBinId) this.comboSystem.closeBin(false);
      this.player.clearShield(false);
      this.player.shieldCooldown = 0;

      const spotGlass = this.getSpotAhead(6.0, -2.6);
      const spotPlastic = this.getSpotAhead(-2.6, -6.0);
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'GLASS_BOTTLE',
        x: spotGlass.x,
        z: spotGlass.z,
        speed: 1.35,
        hp: 95
      });
      this.enemyManager.spawnTutorialEnemy({
        variantId: 'PLASTIC_PET',
        x: spotPlastic.x,
        z: spotPlastic.z,
        speed: 1.35,
        hp: 95
      });
    }

    this.renderStepUI();
  }

  // ==================== REGRAS DE TRAVAMENTO DE TECLAS ====================

  isMoveKeyAllowed(code) {
    if (!this.active || this.completed) return true;
    if (!MOVE_KEYS.has(code)) return false;
    // Libera WASD apenas no Passo 1 (Movimentação) e no Passo 6 (Combate Livre)
    return this.stepIndex === 0 || this.stepIndex === 5;
  }

  isOpenBinAllowed(binId, code) {
    if (!this.active || this.completed) return true;
    if (this.pendingNextStep) return false;

    if (this.stepIndex === 1) {
      return binId === 'PLASTIC';
    }
    if (this.stepIndex === 2) {
      // Se errou o tiro e a lixeira fechou, permite reabrir Plástico (Q)
      return binId === 'PLASTIC';
    }
    if (this.stepIndex === 3) {
      return binId === 'PAPER';
    }
    if (this.stepIndex === 4) {
      return !this.shieldActivatedInStep && binId === 'METAL';
    }
    if (this.stepIndex === 5) {
      return true;
    }
    return false;
  }

  isExecuteModeAllowed(modeId, binId, code) {
    if (!this.active || this.completed) return true;
    if (this.pendingNextStep) return false;

    if (this.stepIndex === 2) {
      return binId === 'PLASTIC' && modeId === 'DAMAGE';
    }
    if (this.stepIndex === 3) {
      return binId === 'PAPER' && modeId === 'CONTROL';
    }
    if (this.stepIndex === 4) {
      return binId === 'METAL' && modeId === 'SHIELD';
    }
    if (this.stepIndex === 5) {
      return true;
    }
    return false;
  }

  handleBlockedKey(code) {
    if (!this.active || this.completed || this.pendingNextStep) return;
    const now = performance.now();
    if (now - this.lastBlockedSoundAt > 240) {
      this.sound.playBlockedKey();
      this.lastBlockedSoundAt = now;
    }

    const pressedLabel = CODE_LABELS[code] || code;
    const expected = this.getExpectedKeysSummary();
    if (this.lockHintEl) {
      this.lockHintEl.textContent = `🔒 Tecla [${pressedLabel}] bloqueada agora! Use: ${expected}`;
      this.lockHintEl.classList.add('shake-alert');
    }
    if (this.keysRowEl) {
      this.keysRowEl.classList.remove('pulse-highlight');
      void this.keysRowEl.offsetWidth;
      this.keysRowEl.classList.add('pulse-highlight');
    }
    this.blockedNoticeTimer = 2.0;
  }

  getExpectedKeysSummary() {
    switch (this.stepIndex) {
      case 0:
        return 'W, A, S ou D';
      case 1:
        return 'Q (Lixeira Plástico)';
      case 2:
        return this.comboSystem.openBinId === 'PLASTIC'
          ? 'Q (Mais Dano) mirando na PET'
          : 'Q para abrir Plástico';
      case 3:
        return this.comboSystem.openBinId === 'PAPER'
          ? 'E (Juntar Grupo) mirando nas Caixas'
          : 'E (Lixeira Papel)';
      case 4:
        return this.comboSystem.openBinId === 'METAL'
          ? 'R (Escudo Seletivo)'
          : 'F (Lixeira Metal)';
      default:
        return 'WASD + Q / E / R / F';
    }
  }

  // ==================== EVENTOS DE PROGRESSÃO DAS ETAPAS ====================

  handleBinOpened(binId) {
    if (!this.active || this.completed || this.pendingNextStep) return;

    if (this.stepIndex === 1 && binId === 'PLASTIC') {
      this.sound.playTutorialStepComplete();
      this.enterStep(2);
      return;
    }

    // Atualiza destaque dinâmico das teclas (ex.: E Papel aberto -> agora destaque E Juntar; F Metal aberto -> agora destaque R Escudo)
    if (this.stepIndex === 2 || this.stepIndex === 3 || this.stepIndex === 4) {
      this.renderStepUI();
    }
  }

  handleSpellExecuted({ binId, modeId }) {
    if (!this.active || this.completed || this.pendingNextStep) return;

    if (this.stepIndex === 4 && binId === 'METAL' && modeId === 'SHIELD') {
      this.shieldActivatedInStep = true;
      this.shieldWaitTimer = 0;
      this.sound.playTutorialStepComplete();
      this.renderStepUI();
    } else if (this.stepIndex === 2 || this.stepIndex === 3) {
      this.renderStepUI();
    }
  }

  handleControlHit({ spell, hitCount }) {
    if (!this.active || this.completed || this.pendingNextStep) return;
    if (this.stepIndex === 3 && spell.binId === 'PAPER' && spell.modeId === 'CONTROL') {
      if (hitCount > 0) {
        this.controlLanded = true;
        this.scheduleNextStep(4, 1.15);
      } else {
        // Errou o alvo: lembra de apontar o mouse nas Caixas de Papelão
        if (this.lockHintEl) {
          this.lockHintEl.textContent =
            '🎯 Aponte o cursor do Mouse sobre as Caixas de Papelão e aperte [E] → [E]!';
        }
        this.renderStepUI();
      }
    }
  }

  handleShieldBlock({ enemy }) {
    if (!this.active || this.completed || this.pendingNextStep) return;
    if (this.stepIndex === 4 && enemy.binCategory === 'METAL') {
      this.scheduleNextStep(5, 1.0);
    }
  }

  handleEnemyKilled() {
    if (!this.active || this.completed || this.pendingNextStep) return;

    if (this.stepIndex === 2 && this.enemyManager.enemies.length === 0) {
      this.scheduleNextStep(3, 0.85);
    } else if (this.stepIndex === 5 && this.enemyManager.enemies.length === 0) {
      this.finishTutorial();
    } else if (this.stepIndex === 5) {
      this.renderStepUI();
    }
  }

  scheduleNextStep(nextIdx, delaySec = 0.85) {
    if (this.pendingNextStep) return;
    this.pendingNextStep = true;
    this.stepTransitionTimer = delaySec;
    this.nextStepIndex = nextIdx;
    this.sound.playTutorialStepComplete();

    if (this.hud && this.camera && this.viewportEl) {
      this.hud.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
        this.camera,
        this.viewportEl,
        '✓ ETAPA CONCLUÍDA!',
        '#4ade80'
      );
    }
  }

  finishTutorial() {
    if (this.completed) return;
    this.completed = true;
    this.pendingNextStep = false;
    this.player.clearKeys();
    if (this.comboSystem.openBinId) {
      this.comboSystem.closeBin(false);
    }
    this.sound.playTutorialComplete();

    if (this.bannerEl) {
      this.bannerEl.classList.add('hidden');
    }
    if (this.completeModalEl) {
      this.completeModalEl.classList.remove('hidden');
    }
    if (this.onFinished) {
      this.onFinished();
    }
  }

  update(dt) {
    if (!this.active || this.completed) return;

    if (this.blockedNoticeTimer > 0) {
      this.blockedNoticeTimer = Math.max(0, this.blockedNoticeTimer - dt);
      if (this.blockedNoticeTimer === 0 && this.lockHintEl) {
        this.lockHintEl.classList.remove('shake-alert');
        this.renderStepUI();
      }
    }

    if (this.pendingNextStep) {
      this.stepTransitionTimer -= dt;
      if (this.stepTransitionTimer <= 0) {
        this.enterStep(this.nextStepIndex);
      }
      return;
    }

    // Passo 1: rastreia distância percorrida com WASD
    if (this.stepIndex === 0) {
      const moved = this.player.position.distanceTo(this.lastPlayerPos);
      if (moved > 0.001) {
        this.moveDistance += moved;
        this.lastPlayerPos.copy(this.player.position);
        if (this.moveDistance >= this.moveRequiredDistance) {
          this.scheduleNextStep(1, 0.55);
        }
      }
    }

    // Passo 5: se o escudo foi ativado, garante que a Porca de Metal chegue ou avance após 2.6s
    if (this.stepIndex === 4) {
      if (this.shieldActivatedInStep) {
        this.shieldWaitTimer += dt;
        // Acelera levemente a porca para o impacto satisfatório no escudo
        const nut = this.enemyManager.enemies[0];
        if (nut && nut.speed < 4.5) {
          nut.speed = 4.6;
        }
        if (this.shieldWaitTimer >= 2.6) {
          this.scheduleNextStep(5, 0.5);
        }
      } else {
        // Se a Porca encostar antes do escudo (e recuar), mantém ela viva esperando
        if (this.enemyManager.enemies.length === 0) {
          const spot = this.getSpotAhead(5.8, -5.8);
          this.enemyManager.spawnTutorialEnemy({
            variantId: 'METAL_NUT',
            x: spot.x,
            z: spot.z,
            speed: 2.35,
            hp: 140
          });
        }
      }
    }
  }

  // ==================== RENDERIZAÇÃO DO PAINEL GUIADO ====================

  renderStepUI() {
    if (!this.bannerEl) return;

    const stepNum = Math.min(this.stepIndex + 1, this.totalSteps);
    if (this.stepBadgeEl) {
      this.stepBadgeEl.textContent = `📖 TUTORIAL RÁPIDO · ETAPA ${stepNum} / ${this.totalSteps}`;
    }
    if (this.progressFillEl) {
      const pct = Math.round(((stepNum - 1) / this.totalSteps) * 100 + 8);
      this.progressFillEl.style.width = `${Math.min(100, pct)}%`;
    }

    let title = '';
    let desc = '';
    let keysHtml = '';
    let lockText = '🔒 Apenas as teclas destacadas estão liberadas nesta etapa.';

    if (this.stepIndex === 0) {
      title = '1. MOVA-SE PELO PARQUE';
      desc = 'Use as teclas W, A, S, D para caminhar pela arena 2.5D. O cursor do Mouse controla sua mira.';
      keysHtml = `
        <span class="tut-key-pill active-key"><kbd>W</kbd></span>
        <span class="tut-key-pill active-key"><kbd>A</kbd></span>
        <span class="tut-key-pill active-key"><kbd>S</kbd></span>
        <span class="tut-key-pill active-key"><kbd>D</kbd></span>
        <span class="tut-key-arrow">→</span>
        <span class="tut-key-note">Ande um pouco pela praça</span>
      `;
    } else if (this.stepIndex === 1) {
      title = '2. ABRA A LIXEIRA CERTA (PLÁSTICO)';
      desc = 'Uma Garrafa PET surgiu! Todo item de Plástico usa a Lixeira Vermelha. Pressione Q para abrir o Leque.';
      keysHtml = `
        <span class="tut-key-pill plastic active-key"><kbd>Q</kbd> LIXEIRA PLÁSTICO</span>
      `;
    } else if (this.stepIndex === 2) {
      const binOpen = this.comboSystem.openBinId === 'PLASTIC';
      title = '3. DISPARO DE "MAIS DANO"';
      desc = binOpen
        ? 'Com a Lixeira Vermelha aberta, aponte o Mouse na Garrafa PET e aperte Q novamente para reciclá-la!'
        : 'Aperte Q para reabrir a Lixeira de Plástico, mire na Garrafa PET e aperte Q de novo!';
      keysHtml = binOpen
        ? `
          <span class="tut-key-pill mouse-pill">🖱 MIRE NA PET</span>
          <span class="tut-key-arrow">+</span>
          <span class="tut-key-pill plastic active-key"><kbd>Q</kbd> MAIS DANO</span>
        `
        : `
          <span class="tut-key-pill plastic active-key"><kbd>Q</kbd> ABRIR PLÁSTICO</span>
          <span class="tut-key-arrow">→</span>
          <span class="tut-key-pill plastic"><kbd>Q</kbd> MAIS DANO</span>
        `;
    } else if (this.stepIndex === 3) {
      const binOpen = this.comboSystem.openBinId === 'PAPER';
      title = '4. CONTROLE DE GRUPO (PAPEL)';
      desc = binOpen
        ? 'Lixeira de Papel aberta! Aponte o Mouse nas Caixas de Papelão e aperte E para puxar e juntar o grupo!'
        : 'Duas Caixas de Papelão! Aperte E para abrir a Lixeira Azul (Papel) e depois E de novo para juntá-las.';
      keysHtml = binOpen
        ? `
          <span class="tut-key-pill paper done-key">✓ <kbd>E</kbd> PAPEL</span>
          <span class="tut-key-arrow">→</span>
          <span class="tut-key-pill mouse-pill">🖱 MIRE NAS CAIXAS</span>
          <span class="tut-key-arrow">+</span>
          <span class="tut-key-pill paper active-key"><kbd>E</kbd> JUNTAR GRUPO</span>
        `
        : `
          <span class="tut-key-pill paper active-key"><kbd>E</kbd> ABRIR PAPEL</span>
          <span class="tut-key-arrow">→</span>
          <span class="tut-key-pill paper"><kbd>E</kbd> JUNTAR GRUPO</span>
        `;
    } else if (this.stepIndex === 4) {
      const binOpen = this.comboSystem.openBinId === 'METAL';
      title = '5. ESCUDO SELETIVO (METAL)';
      if (this.shieldActivatedInStep) {
        desc = 'Escudo de Metal ativado! Deixe a Porca de Metal encostar para bloquear o ataque sem perder Pureza!';
        keysHtml = `<span class="tut-key-pill metal done-key">🛡 ESCUDO DE METAL ATIVO — BLOQUEANDO!</span>`;
        lockText = '✨ Aguarde o impacto no escudo para avançar!';
      } else {
        desc = binOpen
          ? 'Lixeira de Metal aberta! Aperte R agora para ativar o Escudo Seletivo e bloquear a Porca de Metal!'
          : 'Uma Porca de Metal está vindo! Aperte F (Lixeira Amarela) e depois R para ativar o Escudo Seletivo.';
        keysHtml = binOpen
          ? `
            <span class="tut-key-pill metal done-key">✓ <kbd>F</kbd> METAL</span>
            <span class="tut-key-arrow">→</span>
            <span class="tut-key-pill metal active-key"><kbd>R</kbd> ATIVAR ESCUDO</span>
          `
          : `
            <span class="tut-key-pill metal active-key"><kbd>F</kbd> ABRIR METAL</span>
            <span class="tut-key-arrow">→</span>
            <span class="tut-key-pill metal"><kbd>R</kbd> ATIVAR ESCUDO</span>
          `;
      }
    } else if (this.stepIndex === 5) {
      const remaining = this.enemyManager.enemies.length;
      title = '6. PRÁTICA FINAL: VARIE E SUBA O RANK!';
      desc = `Todas as teclas liberadas! Recicle os ${remaining} itens restantes usando a lixeira certa ([Q] PET · [R] Vidro) e observe seu Rank DMC e Multiplicador subirem!`;
      keysHtml = `
        <span class="tut-key-pill active-key"><kbd>WASD</kbd> MOVER</span>
        <span class="tut-key-pill plastic active-key"><kbd>Q</kbd> PET</span>
        <span class="tut-key-pill glass active-key"><kbd>R</kbd> VIDRO</span>
        <span class="tut-key-arrow">→</span>
        <span class="tut-key-pill"><kbd>Q</kbd> DANO · <kbd>E</kbd> CONTROLE · <kbd>R</kbd> ESCUDO</span>
      `;
      lockText = '🔓 Todas as teclas estão liberadas! Recicle os 2 itens para concluir o tutorial.';
    }

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.descEl) this.descEl.textContent = desc;
    if (this.keysRowEl) this.keysRowEl.innerHTML = keysHtml;
    if (this.lockHintEl && this.blockedNoticeTimer <= 0) {
      this.lockHintEl.textContent = lockText;
    }
  }
}
