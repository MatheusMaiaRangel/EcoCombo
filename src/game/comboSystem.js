import * as THREE from 'three';
import {
  CONAMA_ELEMENTS,
  KEY_TO_ELEMENT,
  KEY_TO_HWEI_MODE,
  MAX_STYLE_POINTS,
  resolveHweiSpell,
  getStyleRankFromPoints
} from '../constants/recipes.js';
import { buildRecipeObjectMesh } from './playerController.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

/**
 * E3-01, E3-02, E3-05 e E4-05 — Sistema de Comandos Estilo Hwei (4 Lixeiras CONAMA + Leque de 3 Modos)
 * e Medidor de Estilo Devil May Cry (Ranks D, C, B, A, S, SS, SSS + Multiplicador Destacado Abaixo)
 */
export class ComboSystem {
  constructor({
    scene,
    player,
    hud,
    sound,
    viewportEl,
    camera,
    onShotFired,
    onElementalMastery,
    onUniqueSpellUsed,
    isGameplayActive,
    getArenaHalfSize,
    findObstacleHit
  }) {
    this.scene = scene;
    this.player = player;
    this.hud = hud;
    this.sound = sound;
    this.viewportEl = viewportEl;
    this.camera = camera;
    this.onShotFired = onShotFired;
    this.onElementalMastery = onElementalMastery || null;
    this.onUniqueSpellUsed = onUniqueSpellUsed || null;
    this.isGameplayActive = isGameplayActive || (() => true);
    this.getArenaHalfSize = getArenaHalfSize || (() => ARENA_HALF_SIZE);
    this.findObstacleHit = findObstacleHit || null;

    // Estado do Grimório / Lixeira estilo Hwei
    // null = Nenhuma lixeira aberta (1º toque escolhe Q/E/R/F)
    // 'PLASTIC' | 'PAPER' | 'GLASS' | 'METAL' = Lixeira aberta exibindo o Leque (2º toque: Q=Dano, E=Controle, R=Escudo, F=Cancelar)
    this.openBinId = null;
    this.lastSpell = null;
    this.lastSpellId = null;
    this.repeatCount = 0;
    this.recentSpellIds = [];
    this.consecutiveShieldBlocks = 0;

    // E6-02 — Combinações/habilidades distintas disparadas na partida atual
    this.usedSpellsThisMatch = new Set();

    // E3-04 — Maestria Elemental (4 combos/habilidades distintos em sequência = +10% Pureza + Pulso em Área)
    this.masteryChain = [];
    this.masteryCount = 0;
    this.masteryResetNoticeTimer = 0;
    this.masteryTriggeredFlashTimer = 0;

    // Medidor de Estilo Devil May Cry (0 a 2000 pontos -> Ranks D, C, B, A, S, SS, SSS)
    this.stylePoints = 0; // Começa em D (1.0x): precisa jogar com variedade para escalar até SSS (6.0x)!
    this.styleState = getStyleRankFromPoints(this.stylePoints);
    this.activeMultiplier = this.styleState.multiplier;

    // Projéteis 3D, ondas de área (Controle de Grupo) e partículas
    this.projectiles = [];
    this.areaWaves = [];
    this.particles = [];

    // Callback de explosão de Controle de Grupo registrada pelo EnemyManager
    this.onControlWaveDetonated = null;

    // Hooks opcionais para Tutorial Interativo (E4-07 — travamento de teclas e detecção de ações)
    this.canOpenBin = () => true;
    this.canExecuteMode = () => true;
    this.onBlockedInput = null;
    this.onBinOpened = null;
    this.onSpellExecuted = null;

    this.bindInputs();
    this.syncHUD();
  }

  setInputGate({
    canOpenBin,
    canExecuteMode,
    onBlockedInput,
    onBinOpened,
    onSpellExecuted
  } = {}) {
    this.canOpenBin = canOpenBin || (() => true);
    this.canExecuteMode = canExecuteMode || (() => true);
    this.onBlockedInput = onBlockedInput || null;
    this.onBinOpened = onBinOpened || null;
    this.onSpellExecuted = onSpellExecuted || null;
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat || !this.isGameplayActive()) return;

      // Se nenhuma lixeira está aberta, Q/E/R/F (ou 1/2/3/4) abre a Lixeira correspondente (1º Toque Hwei)
      if (!this.openBinId) {
        const binId = KEY_TO_ELEMENT[e.code];
        if (binId) {
          if (!this.canOpenBin(binId, e.code)) {
            if (this.onBlockedInput) this.onBlockedInput(e.code);
            return;
          }
          this.openBin(binId);
        }
        return;
      }

      // Se uma lixeira JÁ está aberta, o 2º Toque escolhe o Modo no Leque (Q=Dano, E=Controle, R=Escudo, F=Cancelar)
      const modeId = KEY_TO_HWEI_MODE[e.code];
      if (modeId) {
        if (!this.canExecuteMode(modeId, this.openBinId, e.code)) {
          if (this.onBlockedInput) this.onBlockedInput(e.code);
          return;
        }
        this.executeModeFromOpenBin(modeId);
      }
    });

    // Clique Direito do Mouse cancela/fecha a lixeira aberta (igual ao Hwei no LoL)
    window.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!this.isGameplayActive()) return;
      if (this.openBinId) {
        if (!this.canExecuteMode('CANCEL', this.openBinId, 'MouseRight')) {
          if (this.onBlockedInput) this.onBlockedInput('MouseRight');
          return;
        }
        this.closeBin(true);
      }
    });

    // Clique nas pílulas das 4 Lixeiras CONAMA no painel lateral
    const pills = document.querySelectorAll('.conama-key-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        if (!this.isGameplayActive()) return;
        const binId = pill.getAttribute('data-element');
        if (!binId) return;
        if (this.openBinId === binId) {
          if (!this.canExecuteMode('CANCEL', this.openBinId, 'ClickCancel')) {
            if (this.onBlockedInput) this.onBlockedInput('ClickCancel');
            return;
          }
          this.closeBin(true);
        } else {
          if (!this.canOpenBin(binId, `Bin_${binId}`)) {
            if (this.onBlockedInput) this.onBlockedInput(`Bin_${binId}`);
            return;
          }
          this.openBin(binId);
        }
      });
    });

    // Clique direto nos cards do Leque Hwei no HUD
    const fanButtons = document.querySelectorAll('[data-hwei-mode]');
    fanButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!this.isGameplayActive()) return;
        const modeId = btn.getAttribute('data-hwei-mode');
        if (this.openBinId && modeId) {
          if (!this.canExecuteMode(modeId, this.openBinId, `Mode_${modeId}`)) {
            if (this.onBlockedInput) this.onBlockedInput(`Mode_${modeId}`);
            return;
          }
          this.executeModeFromOpenBin(modeId);
        }
      });
    });
  }

  /**
   * 1º Toque Estilo Hwei: Abre uma das 4 Lixeiras CONAMA (Q=Plástico, E=Papel, R=Vidro, F=Metal)
   * e exibe o Leque de 3 Opções (Q=Mais Dano, E=Controle Único da Lixeira, R=Escudo Protetivo)
   */
  openBin(binId) {
    this.openBinId = binId;
    this.sound.playElementSelect(binId, 0);

    // Feedback no botão da lixeira
    document.querySelectorAll('.conama-key-pill').forEach((pill) => {
      pill.classList.toggle('active-bin', pill.getAttribute('data-element') === binId);
    });

    // E4-03 — Emite partículas 3D de canalização ao abrir a lixeira CONAMA
    const binElem = CONAMA_ELEMENTS[binId];
    if (binElem) {
      this.spawnConjureParticles(
        this.player.position.clone().add(new THREE.Vector3(0, 1.15, 0)),
        binElem.hexNumber,
        0xffffff,
        this.activeMultiplier >= 4.0 ? 12 : 7
      );
    }

    // Mostra preview do objeto da lixeira nas mãos do protagonista
    const defaultSpell = resolveHweiSpell(binId, 'DAMAGE');
    this.player.setConjuredRecipePreview(defaultSpell, [binId]);
    this.syncHUD();
    if (this.onBinOpened) {
      this.onBinOpened(binId);
    }
  }

  /**
   * Fecha o leque da lixeira atual
   */
  closeBin(playCancelFeedback = false) {
    this.openBinId = null;
    document.querySelectorAll('.conama-key-pill').forEach((pill) => {
      pill.classList.remove('active-bin');
    });
    if (playCancelFeedback) {
      this.sound.playElementSelect('PAPER', 0);
    }
    this.player.setConjuredRecipePreview(null, []);
    this.syncHUD();
  }

  /**
   * 2º Toque Estilo Hwei: Executa o modo escolhido dentro do Leque da Lixeira aberta
   * - DAMAGE (Q / 1): Dispara ataque de Alto Dano na direção do mouse
   * - CONTROL (E / 2): Dispara o Controle de Grupo exclusivo daquela lixeira (Separar / Juntar / Slow / Estunar)
   * - SHIELD (R / 3): Ativa o Escudo Protetivo Seletivo daquela lixeira no protagonista
   * - CANCEL (F / 4): Fecha o leque sem gastar ação
   */
  executeModeFromOpenBin(modeId) {
    if (!this.openBinId) return false;

    if (modeId === 'CANCEL') {
      this.closeBin(true);
      return true;
    }

    const binId = this.openBinId;
    const spell = resolveHweiSpell(binId, modeId);
    if (!spell) return false;

    // Se for Modo Escudo (R), valida se já há escudo ativo ou em recarga ANTES de gastar ação
    if (modeId === 'SHIELD') {
      if (this.player.activeShieldBin) {
        if (this.viewportEl && this.camera) {
          this.hud.spawnFloatingText(
            this.player.position.clone().add(new THREE.Vector3(0, 2.4, 0)),
            this.camera,
            this.viewportEl,
            '🛡 ESCUDO JÁ ESTÁ ATIVO!',
            '#ffd166'
          );
        }
        this.closeBin(false);
        return false;
      }
      if (this.player.shieldCooldown > 0) {
        if (this.viewportEl && this.camera) {
          this.hud.spawnFloatingText(
            this.player.position.clone().add(new THREE.Vector3(0, 2.4, 0)),
            this.camera,
            this.viewportEl,
            `🛡 ESCUDO EM RECARGA (${this.player.shieldCooldown.toFixed(1)}s)`,
            '#ffd166'
          );
        }
        this.closeBin(false);
        return false;
      }
    }

    // Conta quantas vezes esta habilidade exata apareceu na janela recente (últimos 4 comandos)
    const recentCount = this.getSpellRecentCount(spell.id);

    // Atualiza contador de repetição consecutiva da mesma habilidade exata
    if (this.lastSpellId === spell.id) {
      this.repeatCount += 1;
    } else {
      this.repeatCount = 0;
      this.lastSpellId = spell.id;
    }
    this.recordSpellCast(spell.id);
    this.lastSpell = spell;

    // E6-02 — Rastreia combinações distintas usadas na partida para desbloqueio de insígnias
    const isNewInMatch = !this.usedSpellsThisMatch.has(spell.id);
    this.usedSpellsThisMatch.add(spell.id);
    if (isNewInMatch && this.onUniqueSpellUsed) {
      this.onUniqueSpellUsed({
        spell,
        uniqueCount: this.usedSpellsThisMatch.size,
        totalSpells: 12
      });
    }

    // Se for o Modo 3 (R = Escudo Protetivo Seletivo), ativa na hora ao redor do jogador!
    if (modeId === 'SHIELD') {
      this.activateSelectiveShield(spell);
      this.closeBin(false);
      if (this.onSpellExecuted) {
        this.onSpellExecuted({ binId, modeId, spell });
      }
      return true;
    }

    // Metadados compartilhados entre todos os projéteis/hits deste mesmo disparo:
    // apenas o 1º hit conta para o Style Meter e validação de lixeira (evita penalizar ricochete/perfuração/leque!)
    const castStyleMeta = {
      spellId: spell.id,
      binId: spell.binId,
      modeId: spell.modeId,
      repeatCount: this.repeatCount,
      recentCount,
      hitsScored: 0,
      primaryHitResolved: false,
      primaryMatchedBin: null
    };

    // Para Q (Mais Dano) e E (Controle de Grupo), dispara na direção mirada pelo Mouse!
    this.fireSpellProjectile(spell, castStyleMeta);
    this.closeBin(false);
    if (this.onSpellExecuted) {
      this.onSpellExecuted({ binId, modeId, spell });
    }
    return true;
  }

  /**
   * Se o jogador clicar com o Botão Esquerdo do Mouse (LMB) na arena:
   * - Se uma lixeira estiver aberta, dispara o ataque principal (Modo Q = Mais Dano) daquela lixeira!
   * - Se nenhuma lixeira estiver aberta, lembra o jogador de abrir uma lixeira (Q, E, R ou F)
   */
  tryFireAtAim(viewportEl, camera) {
    if (this.openBinId) {
      if (!this.canExecuteMode('DAMAGE', this.openBinId, 'MouseLeft')) {
        if (this.onBlockedInput) this.onBlockedInput('MouseLeft');
        return false;
      }
      return this.executeModeFromOpenBin('DAMAGE');
    }

    if (!this.canOpenBin(null, 'MouseLeft')) {
      return false;
    }

    this.hud.spawnFloatingText(
      this.player.position.clone().add(new THREE.Vector3(0, 2.3, 0)),
      camera || this.camera,
      viewportEl || this.viewportEl,
      'ABRA UMA LIXEIRA [Q, E, R, F] E ESCOLHA O MODO!',
      '#ffd166'
    );
    return false;
  }

  /**
   * Ativa o Escudo Protetivo Seletivo (Modo R no leque da Lixeira)
   * Não concede pontos de estilo ao ativar: o jogador precisa realmente bloquear o item certo!
   */
  activateSelectiveShield(spell) {
    const binElem = CONAMA_ELEMENTS[spell.binId];
    this.player.activateShield(
      spell.binId,
      spell.duration || 3.0,
      spell.cooldown || 3.0,
      spell.maxCharges || 2
    );
    this.sound.playComboReady(spell, this.activeMultiplier);

    // Onda curta defensiva ao ativar o escudo
    this.spawnAreaWave(this.player.position.clone(), spell.colorA, 2.5);
    this.spawnImpactParticles(
      this.player.position.clone().add(new THREE.Vector3(0, 1.1, 0)),
      spell.colorA,
      0xffffff,
      14
    );

    if (this.viewportEl && this.camera) {
      this.hud.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
        this.camera,
        this.viewportEl,
        `🛡 ESCUDO ${binElem.shortName.toUpperCase()}! (ATÉ 2 HITS)`,
        binElem.hex
      );
    }

    if (this.onShotFired) {
      this.onShotFired(spell, this.activeMultiplier, this.repeatCount);
    }
  }

  /**
   * Dispara o projétil de Mais Dano (Q) ou Controle de Grupo (E) na direção da mira do Mouse
   */
  fireSpellProjectile(spell, castStyleMeta = null) {
    // Se repetiu exatamente o mesmo ataque 3+ vezes seguidas sem variar modo ou lixeira, penaliza o estilo!
    if (this.repeatCount >= 3) {
      this.addStylePoints(-110);
      if (this.viewportEl && this.camera) {
        this.hud.spawnFloatingText(
          this.player.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
          this.camera,
          this.viewportEl,
          '⚠ ATAQUE REPETIDO! VARIE O MODO [Q/E/R] OU LIXEIRA!',
          '#ff4d6d'
        );
      }
    }

    const isStale =
      this.repeatCount >= 3 || (this.repeatCount >= 2 && this.activeMultiplier <= 1.0);
    this.sound.playShoot(this.activeMultiplier, isStale, spell.binId);

    const baseDir = this.player.aimDirection.clone().normalize();
    const spawnOrigin = this.player.position
      .clone()
      .add(new THREE.Vector3(baseDir.x * 0.9, 1.15, baseDir.z * 0.9));
    const targetPoint = this.player.aimPoint.clone();

    // E4-03 — Partículas 3D progressivas ao conjurar/disparar (mais intensas em >= 4.0x, discretas em 1.0x/stale)
    const castBurstCount = isStale || this.activeMultiplier <= 1.0
      ? 4
      : this.activeMultiplier >= 4.0
        ? 18
        : 10;
    this.spawnImpactParticles(
      spawnOrigin,
      isStale ? 0x94a3b8 : spell.colorA,
      this.activeMultiplier >= 4.0 && !isStale ? 0x00f5d4 : spell.colorB,
      castBurstCount,
      this.activeMultiplier >= 4.0 && !isStale ? 1.25 : 0.85
    );

    if (spell.behavior === 'damage_paper') {
      // Papel (E + Q): Rajada tripla de lâminas de origami (compartilha castStyleMeta)
      const angles = [-0.15, 0, 0.15];
      angles.forEach((ang) => {
        const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        this.spawnProjectileInstance(
          spell,
          spawnOrigin,
          dir,
          targetPoint,
          this.activeMultiplier,
          castStyleMeta
        );
      });
    } else {
      this.spawnProjectileInstance(
        spell,
        spawnOrigin,
        baseDir,
        targetPoint,
        this.activeMultiplier,
        castStyleMeta
      );
    }

    if (this.onShotFired) {
      this.onShotFired(spell, this.activeMultiplier, this.repeatCount);
    }
  }

  spawnProjectileInstance(spell, origin, direction, targetPoint, multiplier, castStyleMeta = null) {
    const mesh = buildRecipeObjectMesh(spell, spell.modeId === 'CONTROL' ? 1.15 : 1.0);
    mesh.position.copy(origin);
    const yaw = Math.atan2(direction.x, direction.z);
    mesh.rotation.set(0, yaw, 0);

    const light = new THREE.PointLight(spell.colorA, 1.7, 5.8);
    mesh.add(light);
    this.scene.add(mesh);

    const distToTarget = origin.distanceTo(targetPoint);
    const currentHalfSize = this.getArenaHalfSize();

    this.projectiles.push({
      mesh,
      recipe: spell,
      direction: direction.clone().normalize(),
      targetPoint: targetPoint.clone(),
      maxTravelDist:
        spell.modeId === 'CONTROL'
          ? Math.max(2.5, Math.min(currentHalfSize, distToTarget))
          : 99,
      traveledDist: 0,
      speed: spell.speed,
      multiplier,
      castStyleMeta,
      radius: spell.radius,
      life: 2.6,
      pierceLeft: spell.behavior === 'damage_glass' ? 2 : 0,
      ricochetLeft: spell.behavior === 'damage_plastic' ? 1 : 0,
      isRicochetBounce: false,
      pierceCount: 0,
      hitEnemyIds: new Set(),
      trailTimer: 0
    });
  }

  /**
   * Cria um anel 3D expansivo no chão para visualizar o Controle de Grupo (Separar / Juntar / Slow / Estunar)
   */
  spawnAreaWave(centerPos, colorHex, maxRadius = 4.2) {
    const ringGeo = new THREE.RingGeometry(0.3, 0.65, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      toneMapped: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(centerPos.x, 0.08, centerPos.z);
    this.scene.add(ringMesh);

    this.areaWaves.push({
      mesh: ringMesh,
      mat: ringMat,
      age: 0,
      duration: 0.42,
      maxScale: maxRadius / 0.55
    });
  }

  getSpellRecentCount(spellId) {
    let count = 0;
    for (const id of this.recentSpellIds) {
      if (id === spellId) count += 1;
    }
    return count;
  }

  recordSpellCast(spellId) {
    this.recentSpellIds.push(spellId);
    if (this.recentSpellIds.length > 4) {
      this.recentSpellIds.shift();
    }
  }

  registerOffensiveStyleHit() {
    this.consecutiveShieldBlocks = 0;
  }

  /**
   * E3-04 — Registra uma habilidade válida na sequência de Maestria Elemental (4 combos inéditos seguidos).
   * - Se repetir uma habilidade já presente na sequência (ou errar a lixeira no 1º hit), a contagem reinicia.
   * - Ao atingir 4 distintos sem repetição, dispara o Pulso de Purificação (+10% Pureza Ambiental).
   */
  registerMasteryAction(spell, { isValid = true } = {}) {
    if (!spell) return { triggered: false, reset: false, count: this.masteryChain.length };

    if (!isValid) {
      if (this.masteryChain.length > 0) {
        this.masteryChain = [];
        this.masteryResetNoticeTimer = 1.6;
        this.syncHUD();
        return { triggered: false, reset: true, count: 0 };
      }
      return { triggered: false, reset: false, count: 0 };
    }

    const alreadyInChain = this.masteryChain.some((entry) => entry.spellId === spell.id);
    if (alreadyInChain) {
      const hadProgress = this.masteryChain.length;
      this.masteryChain = [];
      this.masteryResetNoticeTimer = 1.6;
      if (hadProgress >= 2 && this.viewportEl && this.camera) {
        this.hud.spawnFloatingText(
          this.player.position.clone().add(new THREE.Vector3(0, 2.75, 0)),
          this.camera,
          this.viewportEl,
          '↺ MAESTRIA REINICIADA (COMBO REPETIDO)',
          '#ff8fa3'
        );
      }
      this.syncHUD();
      return { triggered: false, reset: true, count: 0 };
    }

    this.masteryResetNoticeTimer = 0;
    this.masteryTriggeredFlashTimer = 0;
    this.masteryChain.push({
      spellId: spell.id,
      binId: spell.binId,
      comboKeys: spell.comboKeys,
      colorHex: spell.primaryHex
    });

    if (this.masteryChain.length >= 4) {
      const completedChain = [...this.masteryChain];
      this.masteryChain = [];
      this.masteryCount += 1;
      this.masteryTriggeredFlashTimer = 1.9;
      this.triggerElementalMastery(completedChain);
      return { triggered: true, reset: false, count: 4 };
    }

    this.syncHUD();
    return { triggered: false, reset: false, count: this.masteryChain.length };
  }

  triggerElementalMastery(completedChain) {
    const center = this.player.position.clone();
    // Pulso visual duplo de purificação em área + explosão nas 4 cores CONAMA
    this.spawnAreaWave(center, 0x00f5d4, 9.0);
    this.spawnAreaWave(center, 0xffd166, 6.2);

    const particleOrigin = center.clone().add(new THREE.Vector3(0, 1.15, 0));
    this.spawnImpactParticles(particleOrigin, 0xff3b30, 0x007aff, 16);
    this.spawnImpactParticles(particleOrigin, 0x34c759, 0xffcc00, 16);

    if (this.sound && typeof this.sound.playMasteryPulse === 'function') {
      this.sound.playMasteryPulse();
    }

    this.addStylePoints(180);

    if (this.onElementalMastery) {
      this.onElementalMastery({
        chain: completedChain,
        masteryCount: this.masteryCount,
        purityBonus: 10,
        scoreBonus: 400,
        pulseRadius: 8.5
      });
    }
    this.syncHUD();
  }

  /**
   * Calcula ganho de estilo para acertos de Dano (Modo Q) considerando:
   * - Variedade recente (últimos 4 comandos) e repetição consecutiva
   * - Bônus de combo Controle [E] -> Dano [Q]
   * - Redução para múltiplos hits de um mesmo disparo (ex.: rajada tripla, perfuração ou ricochete)
   */
  computeDamageStyleGain({ repeatCount = 0, recentCount = 0, wasControlled = false, isSecondaryHit = false }) {
    let gain = 0;
    if (repeatCount === 0) {
      gain = recentCount === 0 ? 130 : recentCount === 1 ? 90 : 55;
    } else if (repeatCount === 1) {
      gain = 55;
    } else if (repeatCount === 2) {
      gain = 20;
    }

    if (wasControlled && repeatCount < 2) {
      gain += 65;
    }

    if (isSecondaryHit) {
      gain = Math.round(gain * 0.35);
    }

    return gain;
  }

  /**
   * Calcula ganho de estilo para bloqueios do Escudo Seletivo (Modo R):
   * - Parry Perfeito (ativado <= 0.55s antes do impacto): base 105 pts
   * - Bloqueio Comum (> 0.55s): base 40 pts
   * - Retorno decrescente para bloqueios consecutivos sem atacar (1º: 100%, 2º: 40%, 3º+: 0%)
   */
  computeShieldBlockStyleGain({ isParry = false }) {
    this.consecutiveShieldBlocks += 1;
    const base = isParry ? 105 : 40;
    let factor = 0;
    if (this.consecutiveShieldBlocks === 1) {
      factor = 1.0;
    } else if (this.consecutiveShieldBlocks === 2) {
      factor = 0.4;
    }
    return {
      styleGain: Math.round(base * factor),
      blockIndex: this.consecutiveShieldBlocks
    };
  }

  /**
   * Atualiza o Medidor de Estilo Devil May Cry (D -> C -> B -> A -> S -> SS -> SSS)
   * e recalcula o Multiplicador em destaque abaixo
   */
  addStylePoints(delta) {
    this.stylePoints = Math.max(0, Math.min(MAX_STYLE_POINTS, this.stylePoints + delta));
    this.styleState = getStyleRankFromPoints(this.stylePoints);
    this.activeMultiplier = this.styleState.multiplier;
    this.syncHUD();
  }

  /**
   * E4-03 — Emite partículas 3D em espiral ascendente ao canalizar uma Lixeira CONAMA
   */
  spawnConjureParticles(centerPos, colorA, colorB, count = 8) {
    const maxLive = 280;
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= maxLive) break;
      const size = 0.08 + Math.random() * 0.09;
      const geo = new THREE.BoxGeometry(size, size, size);
      const color = i % 2 === 0 ? colorA : colorB;
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.95,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      const angle = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.35;
      const radius = 0.55 + Math.random() * 0.45;
      mesh.position.set(
        centerPos.x + Math.cos(angle) * radius,
        centerPos.y + (Math.random() - 0.5) * 0.4,
        centerPos.z + Math.sin(angle) * radius
      );

      const velocity = new THREE.Vector3(
        Math.cos(angle) * (1.2 + Math.random() * 1.4),
        2.2 + Math.random() * 2.2,
        Math.sin(angle) * (1.2 + Math.random() * 1.4)
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        mat,
        velocity,
        life: 0.28 + Math.random() * 0.18,
        maxLife: 0.46
      });
    }
  }

  /**
   * E4-03 — Emite partículas 3D nas cores da lixeira/habilidade com intensidade escalável por multiplicador
   */
  spawnImpactParticles(position, colorA, colorB, count = 14, intensity = 1.0) {
    const maxLive = 280;
    const safeCount = Math.min(count, Math.max(0, maxLive - this.particles.length));
    for (let i = 0; i < safeCount; i++) {
      const size = (0.09 + Math.random() * 0.13) * Math.min(1.45, Math.max(0.75, intensity));
      const geo = new THREE.BoxGeometry(size, size, size);
      const color = i % 2 === 0 ? colorA : colorB;
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = (2.0 + Math.random() * 6.5) * intensity;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        (1.6 + Math.random() * 4.2) * intensity,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        mat,
        velocity,
        life: (0.34 + Math.random() * 0.28) * Math.min(1.3, Math.max(0.8, intensity)),
        maxLife: 0.65 * Math.min(1.3, Math.max(0.8, intensity))
      });
    }
  }

  update(dt) {
    // 1. Decaimento temporal progressivo da barra de estilo Devil May Cry (mais exigente em S/SS/SSS)
    if (this.stylePoints > 0) {
      const decayRate = this.styleState.decayRate || 10;
      this.stylePoints = Math.max(0, this.stylePoints - decayRate * dt);
      const newState = getStyleRankFromPoints(this.stylePoints);
      const rankChanged = newState.rank !== this.styleState.rank;
      this.styleState = newState;
      this.activeMultiplier = this.styleState.multiplier;
      if (rankChanged) {
        this.syncHUD();
      } else {
        this.hud.updateStyleMeterBarOnly(this.styleState);
      }
    }

    // Atualiza timers visuais do medidor de Maestria Elemental (E3-04)
    let masteryVisualChanged = false;
    if (this.masteryResetNoticeTimer > 0) {
      this.masteryResetNoticeTimer = Math.max(0, this.masteryResetNoticeTimer - dt);
      if (this.masteryResetNoticeTimer === 0) masteryVisualChanged = true;
    }
    if (this.masteryTriggeredFlashTimer > 0) {
      this.masteryTriggeredFlashTimer = Math.max(0, this.masteryTriggeredFlashTimer - dt);
      if (this.masteryTriggeredFlashTimer === 0) masteryVisualChanged = true;
    }
    if (masteryVisualChanged) {
      this.hud.updateMasteryHUD({
        chain: this.masteryChain,
        masteryCount: this.masteryCount,
        justTriggered: this.masteryTriggeredFlashTimer > 0,
        justReset: this.masteryResetNoticeTimer > 0
      });
    }

    // Atualiza indicador de duração/cargas/recarga do Escudo no HUD
    this.hud.updateShieldStatus(
      this.player.activeShieldBin,
      this.player.shieldTimer,
      this.player.shieldCooldown,
      this.openBinId,
      this.player.shieldCharges,
      this.player.shieldMaxCharges
    );

    // 2. Atualiza Projéteis em Trajetória na Arena (respeitando expansão dinâmica do Estágio 2)
    const limit = this.getArenaHalfSize() + 0.5;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      const stepDist = p.speed * dt;
      p.traveledDist += stepDist;
      p.mesh.position.addScaledVector(p.direction, stepDist);
      p.mesh.rotation.z += dt * 7.5;

      p.trailTimer += dt;
      if (p.trailTimer >= 0.04) {
        p.trailTimer = 0;
        this.spawnImpactParticles(p.mesh.position, p.recipe.colorA, p.recipe.colorB, 1);
      }

      // E1-03 — Impacto de projéteis contra obstáculos 3D sólidos (dissipa projéteis comuns em partículas)
      if (this.findObstacleHit) {
        const hitObs = this.findObstacleHit(p.mesh.position, Math.max(0.22, p.radius * 0.5));
        if (hitObs) {
          this.spawnImpactParticles(p.mesh.position, p.recipe.colorA, 0xd6d3d1, 14);
          if (this.sound && typeof this.sound.playObstacleHit === 'function') {
            this.sound.playObstacleHit();
          }
          if (p.recipe.modeId === 'CONTROL' && this.onControlWaveDetonated) {
            this.onControlWaveDetonated(
              p.mesh.position.clone(),
              p.recipe,
              p.multiplier,
              p.castStyleMeta
            );
          }
          this.scene.remove(p.mesh);
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      // Se for uma habilidade de Controle de Grupo (Modo E) que chegou no ponto mirado pelo mouse, detona em área!
      if (p.recipe.modeId === 'CONTROL' && p.traveledDist >= p.maxTravelDist) {
        if (this.onControlWaveDetonated) {
          this.onControlWaveDetonated(
            p.mesh.position.clone(),
            p.recipe,
            p.multiplier,
            p.castStyleMeta
          );
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      const outOfBounds =
        Math.abs(p.mesh.position.x) > limit || Math.abs(p.mesh.position.z) > limit;

      if (p.life <= 0 || outOfBounds) {
        if (outOfBounds) {
          this.spawnImpactParticles(p.mesh.position, p.recipe.colorA, p.recipe.colorB, 5);
        }
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // 3. Atualiza Ondas Visuais de Controle de Grupo
    for (let i = this.areaWaves.length - 1; i >= 0; i--) {
      const w = this.areaWaves[i];
      w.age += dt;
      const ratio = Math.min(1, w.age / w.duration);
      const scale = 1 + ratio * (w.maxScale - 1);
      w.mesh.scale.setScalar(scale);
      w.mat.opacity = Math.max(0, (1 - ratio) * 0.85);
      if (w.age >= w.duration) {
        this.scene.remove(w.mesh);
        w.mesh.geometry.dispose();
        w.mat.dispose();
        this.areaWaves.splice(i, 1);
      }
    }

    // 4. Atualiza Partículas 3D
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.life -= dt;
      if (pt.life <= 0) {
        this.scene.remove(pt.mesh);
        pt.mesh.geometry.dispose();
        pt.mat.dispose();
        this.particles.splice(i, 1);
        continue;
      }
      pt.velocity.y -= 9.8 * dt;
      pt.mesh.position.addScaledVector(pt.velocity, dt);
      if (pt.mesh.position.y < 0.08) {
        pt.mesh.position.y = 0.08;
        pt.velocity.y *= -0.4;
      }
      pt.mat.opacity = Math.max(0, pt.life / pt.maxLife);
    }
  }

  syncHUD() {
    this.hud.updateComboHUD({
      openBinId: this.openBinId,
      styleState: this.styleState,
      displayMultiplier: this.activeMultiplier,
      displayRepeatCount: this.repeatCount,
      lastRecipe: this.lastSpell,
      activeShieldBin: this.player.activeShieldBin
    });
    this.hud.updateShieldStatus(
      this.player.activeShieldBin,
      this.player.shieldTimer,
      this.player.shieldCooldown,
      this.openBinId,
      this.player.shieldCharges,
      this.player.shieldMaxCharges
    );
    this.hud.updateMasteryHUD({
      chain: this.masteryChain,
      masteryCount: this.masteryCount,
      justTriggered: this.masteryTriggeredFlashTimer > 0,
      justReset: this.masteryResetNoticeTimer > 0
    });
  }

  reset() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];

    for (const w of this.areaWaves) {
      this.scene.remove(w.mesh);
    }
    this.areaWaves = [];

    for (const pt of this.particles) {
      this.scene.remove(pt.mesh);
    }
    this.particles = [];

    this.openBinId = null;
    this.lastSpell = null;
    this.lastSpellId = null;
    this.repeatCount = 0;
    this.recentSpellIds = [];
    this.consecutiveShieldBlocks = 0;
    this.usedSpellsThisMatch.clear();
    this.masteryChain = [];
    this.masteryCount = 0;
    this.masteryResetNoticeTimer = 0;
    this.masteryTriggeredFlashTimer = 0;
    this.stylePoints = 0;
    this.styleState = getStyleRankFromPoints(this.stylePoints);
    this.activeMultiplier = this.styleState.multiplier;
    this.player.setConjuredRecipePreview(null, []);
    this.syncHUD();
    this.hud.updateShieldStatus(null, 0, 0, null);
  }
}
