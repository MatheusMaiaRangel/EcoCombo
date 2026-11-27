import * as THREE from 'three';
import { ArenaScene } from './game/arenaScene.js';
import { PlayerController } from './game/playerController.js';
import { ComboSystem } from './game/comboSystem.js';
import { EnemyManager } from './game/enemyManager.js';
import { BossManager } from './game/bossManager.js';
import { TutorialManager } from './game/tutorialManager.js';
import { ProgressionStore } from './game/progressionStore.js';
import { SidebarCharacterRenderer } from './ui/sidebarCharacter.js';
import { HUDController } from './ui/hudController.js';
import { StartMenuAnimator } from './ui/startMenuAnimator.js';
import { CutscenePlayer } from './ui/cutscenePlayer.js';
import { SoundEngine } from './audio/soundEngine.js';
import {
  STAGE_2_UNLOCK_TIME_SEC,
  STAGE_3_UNLOCK_TIME_SEC,
  STAGE_3_BOSS_UNLOCK_TIME_SEC,
  BOSS_CYCLE_INTERVAL_SEC
} from './constants/recipes.js';

const SETTINGS_STORAGE_KEY = 'ecocombo_settings_v1';

class EcoComboMVPApp {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.viewportEl = document.getElementById('arena-viewport');

    // Estado da Partida e Fluxo de Menus (E4-06 / E4-07 / E4-08)
    // 'MENU' | 'CUTSCENE' | 'TUTORIAL' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
    this.gameState = 'MENU';
    this.optionsOrigin = 'PLAYING'; // 'MENU' | 'PLAYING'

    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.bestRankIndex = 0;
    this.bestRank = 'D';
    this.bestRankColor = '#8d99ae';
    this.bossDefeatedCount = 0;
    this.nextBossSpawnTimeSec = STAGE_3_BOSS_UNLOCK_TIME_SEC;
    this.recordSavedThisMatch = false;
    this.isGameOver = false;

    this.settings = this.loadSettings();
    this.progressionStore = new ProgressionStore();
    this.recordSavedThisMatch = false;
    this.recordsModalOpen = false;
    this.lgpdModalOpen = false;
    this.matchBadgesAwarded = new Set();

    // 1. Áudio Sintetizado Procedural (Web Audio API)
    this.sound = new SoundEngine();

    // 2. Painel Lateral Reativo (E4-01: Estrutura Capsule + Arte Until Then) e Animador por Frames do Menu Inicial (E4-06)
    const upperCanvas = document.getElementById('character-upper-canvas');
    const portraitCanvas = document.getElementById('character-portrait-canvas');
    this.sidebarCharacter = new SidebarCharacterRenderer(upperCanvas, portraitCanvas);
    this.hud = new HUDController(this.sidebarCharacter);
    this.startMenuAnimator = new StartMenuAnimator(document.getElementById('start-menu-bg-canvas'));

    // 3. Cena 3D Isométrica 2.5D com Sombras, UnrealBloomPass, Obstáculos 3D (E1-03), Atmosfera por Pureza (E1-04) e Estágio 2 (E2-06)
    this.arena = new ArenaScene(this.canvas, this.viewportEl);
    const getArenaHalfSize = () => this.arena.getHalfSize();
    const resolveObstacleCollision = (pos, radius) => this.arena.resolveCircleCollision(pos, radius);
    const findObstacleHit = (pos, radius) => this.arena.findProjectileObstacleHit(pos, radius);

    // 4. Protagonista no WASD + 4 Orbes em Órbita + Mira com Raycaster (E1-02 / E1-03)
    this.player = new PlayerController(
      this.arena.scene,
      this.arena.camera,
      this.viewportEl,
      this.arena.groundPlane,
      getArenaHalfSize,
      resolveObstacleCollision
    );

    // 5. Sistema de Lixeiras e Leque Hwei (Q/E/R/F) + Medidor de Estilo Devil May Cry (E3-05 / E4-05)
    this.comboSystem = new ComboSystem({
      scene: this.arena.scene,
      player: this.player,
      hud: this.hud,
      sound: this.sound,
      viewportEl: this.viewportEl,
      camera: this.arena.camera,
      getArenaHalfSize,
      findObstacleHit,
      isGameplayActive: () =>
        this.gameState === 'PLAYING' ||
        (this.gameState === 'TUTORIAL' && !this.tutorialManager?.completed),
      onShotFired: () => {
        this.sidebarCharacter.triggerShootFlash();
      },
      onElementalMastery: (event) => {
        this.handleElementalMastery(event);
      },
      onUniqueSpellUsed: (event) => {
        this.handleUniqueSpellUsed(event);
      }
    });

    // 6. Gerenciador dos Inimigos Recicláveis (Estágio 1: 4 itens • Estágio 2 aos 01:30: acumula +4 novos itens — E2-05 / E2-06)
    this.enemyManager = new EnemyManager({
      scene: this.arena.scene,
      player: this.player,
      comboSystem: this.comboSystem,
      hud: this.hud,
      sound: this.sound,
      camera: this.arena.camera,
      viewportEl: this.viewportEl,
      getArenaHalfSize,
      resolveObstacleCollision,
      onPlayerTouch: (purityLoss) => this.handlePlayerHit(purityLoss),
      onEnemyKilled: (hitEvent) => this.handleEnemyHitOrKilled(hitEvent)
    });

    // 6b. Gerenciador do Chefão "Colosso de Entulho" (Épico E5)
    this.bossManager = new BossManager({
      scene: this.arena.scene,
      player: this.player,
      comboSystem: this.comboSystem,
      hud: this.hud,
      sound: this.sound,
      camera: this.arena.camera,
      viewportEl: this.viewportEl,
      getArenaHalfSize,
      resolveObstacleCollision,
      onPlayerHit: (purityLoss) => this.handlePlayerHit(purityLoss),
      onPlayerToxicTick: (purityLoss) => this.handlePlayerHit(purityLoss),
      onBossHit: ({ points }) => this.handleBossHitPoints(points),
      onBossDefeated: (event) => this.handleBossDefeated(event)
    });

    this.enemyManager.onControlWaveExtraTarget = (centerPos, spell, multiplier, castStyleMeta) =>
      this.bossManager.handleControlWave(centerPos, spell, multiplier, castStyleMeta);

    // 7. Tutorial Interativo Guiado na Arena (E4-07) e Cutscene Inicial Legendada em Pixel Art (E4-08)
    this.tutorialManager = new TutorialManager({
      player: this.player,
      comboSystem: this.comboSystem,
      enemyManager: this.enemyManager,
      hud: this.hud,
      sound: this.sound,
      camera: this.arena.camera,
      viewportEl: this.viewportEl
    });

    this.cutscenePlayer = new CutscenePlayer({
      sound: this.sound
    });

    this.applySettingsToSystems();
    this.bindUIEvents();

    // Inicia no Menu Inicial (E4-06): a partida só começa após o jogador clicar em "Iniciar Partida"
    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(this.stage, this.score, 0, this.matchElapsedSec);
    this.hud.showStartMenu();

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  loadSettings() {
    const defaults = {
      soundEnabled: true,
      volumePercent: 85,
      difficulty: 'NORMAL',
      bloomEnabled: true,
      floatingTextEnabled: true
    };
    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!raw) return defaults;
      const parsed = JSON.parse(raw);
      return {
        soundEnabled:
          typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : defaults.soundEnabled,
        volumePercent:
          typeof parsed.volumePercent === 'number' ? parsed.volumePercent : defaults.volumePercent,
        difficulty: ['CALM', 'NORMAL', 'INTENSE'].includes(parsed.difficulty)
          ? parsed.difficulty
          : defaults.difficulty,
        bloomEnabled:
          typeof parsed.bloomEnabled === 'boolean' ? parsed.bloomEnabled : defaults.bloomEnabled,
        floatingTextEnabled:
          typeof parsed.floatingTextEnabled === 'boolean'
            ? parsed.floatingTextEnabled
            : defaults.floatingTextEnabled
      };
    } catch {
      return defaults;
    }
  }

  saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignora erro caso localStorage esteja bloqueado
    }
  }

  applySettingsToSystems() {
    this.sound.setEnabled(this.settings.soundEnabled);
    this.sound.setVolumePercent(this.settings.volumePercent);
    this.arena.setBloomEnabled(this.settings.bloomEnabled);
    this.enemyManager.setDifficulty(this.settings.difficulty);
    this.bossManager.setDifficulty(this.settings.difficulty);
    this.hud.setFloatingTextEnabled(this.settings.floatingTextEnabled);
    this.syncOptionsUI();
  }

  syncOptionsUI() {
    const topAudioBtn = document.getElementById('btn-toggle-audio');
    if (topAudioBtn) {
      topAudioBtn.textContent = this.settings.soundEnabled ? '🔊 SOM: ON' : '🔇 SOM: OFF';
    }

    const optSoundBtn = document.getElementById('opt-btn-sound-toggle');
    if (optSoundBtn) {
      optSoundBtn.textContent = this.settings.soundEnabled ? 'LIGADO' : 'DESLIGADO';
      optSoundBtn.classList.toggle('active', this.settings.soundEnabled);
    }

    const volSlider = document.getElementById('opt-slider-volume');
    const volLabel = document.getElementById('opt-volume-label');
    if (volSlider) {
      volSlider.value = String(this.settings.volumePercent);
    }
    if (volLabel) {
      volLabel.textContent = `${this.settings.volumePercent}%`;
    }

    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      const mode = btn.getAttribute('data-difficulty');
      btn.classList.toggle('active', mode === this.settings.difficulty);
    });

    const optBloomBtn = document.getElementById('opt-btn-bloom-toggle');
    if (optBloomBtn) {
      optBloomBtn.textContent = this.settings.bloomEnabled ? 'LIGADO' : 'DESLIGADO';
      optBloomBtn.classList.toggle('active', this.settings.bloomEnabled);
    }

    const optFloatingBtn = document.getElementById('opt-btn-floating-toggle');
    if (optFloatingBtn) {
      optFloatingBtn.textContent = this.settings.floatingTextEnabled ? 'VISÍVEL' : 'OCULTO';
      optFloatingBtn.classList.toggle('active', this.settings.floatingTextEnabled);
    }
  }

  bindUIEvents() {
    // Clique Esquerdo do Mouse (LMB) na Arena dispara o Objeto/Energia formado (E3-01 / E4-07)
    this.viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('button')) return;
      if (
        this.gameState !== 'PLAYING' &&
        !(this.gameState === 'TUTORIAL' && !this.tutorialManager.completed)
      ) {
        return;
      }
      this.comboSystem.tryFireAtAim(this.viewportEl, this.arena.camera);
    });

    // Botão rápido de alternar som no topo da arena
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        this.settings.soundEnabled = this.sound.toggle();
        this.saveSettings();
        this.syncOptionsUI();
        if (this.settings.soundEnabled) {
          this.sound.playMenuClick(true);
        }
      });
    }

    // Botão no topo da arena para abrir o Menu de Pausa e Opções (ESC) ou sair do Tutorial
    const openPauseBtn = document.getElementById('btn-open-pause-menu');
    if (openPauseBtn) {
      openPauseBtn.addEventListener('click', () => {
        if (this.gameState === 'PLAYING') {
          this.openPauseMenu('PLAYING');
        } else if (this.gameState === 'PAUSED') {
          this.handlePausePrimaryAction();
        } else if (this.gameState === 'TUTORIAL') {
          this.exitTutorialToMenu();
        }
      });
    }

    // ==================== EVENTOS DO MENU INICIAL (E4-06 / E4-07 / E4-08) ====================
    const startPlayBtn = document.getElementById('btn-start-play');
    if (startPlayBtn) {
      startPlayBtn.addEventListener('click', () => {
        this.startNewMatchFromMenu();
      });
    }

    const startOptionsBtn = document.getElementById('btn-start-open-options');
    if (startOptionsBtn) {
      startOptionsBtn.addEventListener('click', () => {
        this.openPauseMenu('MENU');
      });
    }

    // E4-07: Botão "COMO JOGAR" vai direto para o Tutorial Interativo na Arena!
    const startGuideBtn = document.getElementById('btn-start-toggle-guide');
    if (startGuideBtn) {
      startGuideBtn.addEventListener('click', () => {
        this.startTutorialFromMenu();
      });
    }

    // E4-08: Botão "HISTÓRIA" no Menu Inicial para rever a Cutscene Inicial quando quiser
    const startWatchIntroBtn = document.getElementById('btn-start-watch-intro');
    if (startWatchIntroBtn) {
      startWatchIntroBtn.addEventListener('click', () => {
        this.sound.playMenuClick(true);
        this.startCutscene({ thenPlayMatch: false });
      });
    }

    // E6-01: Botão "RECORDES" no Menu Inicial e modal Top 5
    const startRecordsBtn = document.getElementById('btn-start-open-records');
    if (startRecordsBtn) {
      startRecordsBtn.addEventListener('click', () => {
        this.openRecordsModal();
      });
    }

    const recordsCloseBtn = document.getElementById('btn-records-close');
    if (recordsCloseBtn) {
      recordsCloseBtn.addEventListener('click', () => {
        this.closeRecordsModal();
      });
    }

    // E6-03: Botões e fluxo do Modal "Meus Dados (LGPD)"
    ['btn-start-open-lgpd', 'btn-options-open-lgpd', 'btn-records-open-lgpd'].forEach((id) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.openLgpdModal();
        });
      }
    });

    const lgpdCloseBtn = document.getElementById('btn-lgpd-close');
    if (lgpdCloseBtn) {
      lgpdCloseBtn.addEventListener('click', () => {
        this.closeLgpdModal();
      });
    }

    const lgpdRequestClearBtn = document.getElementById('btn-lgpd-request-clear');
    if (lgpdRequestClearBtn) {
      lgpdRequestClearBtn.addEventListener('click', () => {
        this.sound.playMenuClick(true);
        this.hud.toggleLgpdConfirmBox(true);
      });
    }

    const lgpdCancelClearBtn = document.getElementById('btn-lgpd-cancel-clear');
    if (lgpdCancelClearBtn) {
      lgpdCancelClearBtn.addEventListener('click', () => {
        this.sound.playMenuClick(false);
        this.hud.toggleLgpdConfirmBox(false);
      });
    }

    const lgpdConfirmClearBtn = document.getElementById('btn-lgpd-confirm-clear');
    if (lgpdConfirmClearBtn) {
      lgpdConfirmClearBtn.addEventListener('click', () => {
        this.handleConfirmClearLocalData();
      });
    }

    const recordForm = document.getElementById('gameover-record-form');
    if (recordForm) {
      recordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSaveRecordSubmit();
      });
    }

    // ==================== EVENTOS DO TUTORIAL INTERATIVO (E4-07) ====================
    const tutorialExitBtn = document.getElementById('btn-tutorial-exit');
    if (tutorialExitBtn) {
      tutorialExitBtn.addEventListener('click', () => {
        this.exitTutorialToMenu();
      });
    }

    const tutorialStartGameBtn = document.getElementById('btn-tutorial-start-game');
    if (tutorialStartGameBtn) {
      tutorialStartGameBtn.addEventListener('click', () => {
        this.tutorialManager.stop();
        this.startNewMatchFromMenu();
      });
    }

    const tutorialToMenuBtn = document.getElementById('btn-tutorial-to-menu');
    if (tutorialToMenuBtn) {
      tutorialToMenuBtn.addEventListener('click', () => {
        this.exitTutorialToMenu();
      });
    }

    // ==================== EVENTOS DO MENU DE PAUSA E OPÇÕES (ESC — E4-06) ====================
    const pauseResumeBtn = document.getElementById('btn-pause-resume');
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener('click', () => {
        this.handlePausePrimaryAction();
      });
    }

    const pauseRestartBtn = document.getElementById('btn-pause-restart');
    if (pauseRestartBtn) {
      pauseRestartBtn.addEventListener('click', () => {
        this.sound.playMenuClick(true);
        this.restartMatch();
      });
    }

    const pauseToStartBtn = document.getElementById('btn-pause-to-start');
    if (pauseToStartBtn) {
      pauseToStartBtn.addEventListener('click', () => {
        this.returnToStartMenu();
      });
    }

    // Controles Interativos das Opções
    const optSoundBtn = document.getElementById('opt-btn-sound-toggle');
    if (optSoundBtn) {
      optSoundBtn.addEventListener('click', () => {
        this.settings.soundEnabled = !this.settings.soundEnabled;
        this.sound.setEnabled(this.settings.soundEnabled);
        this.saveSettings();
        this.syncOptionsUI();
        if (this.settings.soundEnabled) {
          this.sound.playMenuClick(true);
        }
      });
    }

    const volSlider = document.getElementById('opt-slider-volume');
    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value);
        this.settings.volumePercent = val;
        if (val > 0 && !this.settings.soundEnabled) {
          this.settings.soundEnabled = true;
          this.sound.setEnabled(true);
        }
        this.sound.setVolumePercent(val);
        this.saveSettings();
        this.syncOptionsUI();
      });
      volSlider.addEventListener('change', () => {
        this.sound.playMenuClick(true);
      });
    }

    document.querySelectorAll('[data-difficulty]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-difficulty');
        if (!mode) return;
        this.settings.difficulty = mode;
        this.enemyManager.setDifficulty(mode);
        this.bossManager.setDifficulty(mode);
        this.saveSettings();
        this.syncOptionsUI();
        this.sound.playMenuClick(true);
      });
    });

    const optBloomBtn = document.getElementById('opt-btn-bloom-toggle');
    if (optBloomBtn) {
      optBloomBtn.addEventListener('click', () => {
        this.settings.bloomEnabled = !this.settings.bloomEnabled;
        this.arena.setBloomEnabled(this.settings.bloomEnabled);
        this.saveSettings();
        this.syncOptionsUI();
        this.sound.playMenuClick(true);
      });
    }

    const optFloatingBtn = document.getElementById('opt-btn-floating-toggle');
    if (optFloatingBtn) {
      optFloatingBtn.addEventListener('click', () => {
        this.settings.floatingTextEnabled = !this.settings.floatingTextEnabled;
        this.hud.setFloatingTextEnabled(this.settings.floatingTextEnabled);
        this.saveSettings();
        this.syncOptionsUI();
        this.sound.playMenuClick(true);
      });
    }

    // ==================== EVENTOS DE FIM DE PARTIDA (PUREZA 0%) ====================
    const restartBtn = document.getElementById('btn-restart-match');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.sound.playMenuClick(true);
        this.restartMatch();
      });
    }

    const gameoverToMenuBtn = document.getElementById('btn-gameover-to-menu');
    if (gameoverToMenuBtn) {
      gameoverToMenuBtn.addEventListener('click', () => this.returnToStartMenu());
    }

    // Atalhos Globais de Teclado: ESC (Pausa / Pular Cutscene / Sair do Tutorial / Fechar Recordes), ESPAÇO e ENTER
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      const activeTag = document.activeElement?.tagName;
      const isTypingInField = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.lgpdModalOpen) {
          this.closeLgpdModal();
          return;
        }
        if (this.recordsModalOpen) {
          this.closeRecordsModal();
          return;
        }
        if (this.gameState === 'CUTSCENE') {
          this.cutscenePlayer.skip();
        } else if (this.gameState === 'TUTORIAL') {
          this.exitTutorialToMenu();
        } else if (this.gameState === 'PLAYING') {
          this.openPauseMenu('PLAYING');
        } else if (this.gameState === 'PAUSED') {
          this.handlePausePrimaryAction();
        }
        return;
      }

      if (isTypingInField) return;

      if (this.gameState === 'CUTSCENE') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.cutscenePlayer.advanceOrReveal();
        }
        return;
      }

      if (e.code === 'Enter') {
        if (this.recordsModalOpen || this.lgpdModalOpen) return;
        if (this.gameState === 'MENU') {
          e.preventDefault();
          this.startNewMatchFromMenu();
        } else if (this.gameState === 'TUTORIAL' && this.tutorialManager.completed) {
          e.preventDefault();
          this.tutorialManager.stop();
          this.startNewMatchFromMenu();
        } else if (this.gameState === 'GAMEOVER') {
          e.preventDefault();
          this.restartMatch();
        }
      }
    });
  }

  /**
   * E6-01 — Abre/fecha o Modal de Top 5 Recordes Locais e salva novos recordes com apelido (3–12 chars)
   */
  openRecordsModal() {
    this.sound.playMenuClick(true);
    this.recordsModalOpen = true;
    const records = this.progressionStore.loadTop5Records();
    const badgesState = this.progressionStore.loadBadgesState();
    this.hud.showRecordsModal(records, badgesState);
  }

  closeRecordsModal() {
    this.sound.playMenuClick(false);
    this.recordsModalOpen = false;
    this.hud.hideRecordsModal();
  }

  /**
   * E6-03 — Abre/fecha o Modal "Meus Dados (LGPD)" e executa limpeza imediata do localStorage
   */
  openLgpdModal() {
    this.sound.playMenuClick(true);
    this.lgpdModalOpen = true;
    const snapshot = this.progressionStore.inspectLocalData();
    this.hud.showLgpdModal(snapshot);
  }

  closeLgpdModal() {
    this.sound.playMenuClick(false);
    this.lgpdModalOpen = false;
    this.hud.hideLgpdModal();
  }

  handleConfirmClearLocalData() {
    const result = this.progressionStore.clearAllLocalData();
    this.settings = this.loadSettings();
    this.applySettingsToSystems();

    // Atualiza o modal LGPD e também o modal de Recordes caso esteja aberto por trás
    const freshSnapshot = this.progressionStore.inspectLocalData();
    const feedback = result.cleared
      ? `✓ ${result.clearedCount} registro(s) local(is) apagado(s) do navegador com sucesso!`
      : 'Não foi possível limpar o localStorage neste navegador.';
    this.hud.renderLgpdDataSnapshot(freshSnapshot, feedback);
    this.hud.renderRecordsList(this.hud.recordsModalList, [], null);
    this.hud.renderBadgesPanel(freshSnapshot.badgesState);
    this.hud.renderRecordsList(this.hud.gameoverRecordsList, [], null);
    this.sound.playTutorialStepComplete();
  }

  handleSaveRecordSubmit() {
    if (this.recordSavedThisMatch || this.gameState !== 'GAMEOVER') return;
    const nickInput = document.getElementById('input-record-nickname');
    const rawNick = nickInput ? nickInput.value : '';
    const result = this.progressionStore.saveTop5Record({
      nickname: rawNick,
      score: this.score,
      stage: this.stage,
      kills: this.kills,
      bestRank: this.bestRank,
      elapsedSec: this.matchElapsedSec
    });

    if (!result.saved) {
      this.sound.playBlockedKey();
      this.hud.setRecordFormStatus({
        message: result.error,
        isError: true,
        lockForm: false
      });
      return;
    }

    this.recordSavedThisMatch = true;
    this.sound.playTutorialStepComplete();
    this.hud.setRecordFormStatus({
      message: `✓ Salvo em #${result.rankPosition} no Top 5 local!`,
      isError: false,
      lockForm: true,
      records: result.records,
      highlightId: result.entry?.id || null
    });
  }

  closeAllUtilityModals() {
    this.recordsModalOpen = false;
    this.lgpdModalOpen = false;
    this.hud.hideRecordsModal();
    this.hud.hideLgpdModal();
  }

  /**
   * Inicia a partida a partir do Menu Inicial (E4-06 / E4-08)
   * Na 1ª vez, reproduz a Cutscene Inicial legendada e pulável antes de entrar na arena.
   */
  startNewMatchFromMenu() {
    this.sound.playMenuClick(true);
    if (!this.cutscenePlayer.hasSeenIntro()) {
      this.startCutscene({ thenPlayMatch: true });
      return;
    }
    this.beginPlayMatch();
  }

  /**
   * E4-08 — Reproduz a Cutscene Inicial em Pixel Art (legendada e pulável)
   */
  startCutscene({ thenPlayMatch = true } = {}) {
    this.closeAllUtilityModals();
    this.hud.clearFloatingTexts();
    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.hud.hideAchievementToast();
    if (this.matchBadgesAwarded) {
      this.matchBadgesAwarded.clear();
    }
    if (this.tutorialManager.active) {
      this.tutorialManager.stop();
    }
    this.player.clearKeys();
    this.gameState = 'CUTSCENE';

    this.cutscenePlayer.play({
      onComplete: () => {
        if (thenPlayMatch) {
          this.beginPlayMatch();
        } else {
          this.returnToStartMenu();
        }
      }
    });
  }

  /**
   * E4-07 — Entra diretamente na arena 2.5D em Modo Tutorial Interativo Guiado ("COMO JOGAR")
   */
  startTutorialFromMenu() {
    this.sound.playMenuClick(true);
    this.closeAllUtilityModals();
    this.hud.clearFloatingTexts();
    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.hud.hideAchievementToast();
    if (this.matchBadgesAwarded) {
      this.matchBadgesAwarded.clear();
    }

    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.bestRankIndex = 0;
    this.bestRank = 'D';
    this.bestRankColor = '#8d99ae';
    this.bossDefeatedCount = 0;
    this.nextBossSpawnTimeSec = STAGE_3_BOSS_UNLOCK_TIME_SEC;
    this.recordSavedThisMatch = false;
    this.isGameOver = false;
    this.gameState = 'TUTORIAL';

    this.arena.setStageSize(1, true);
    this.arena.randomizeObstacles({ mode: 'tutorial' });
    this.arena.setPurity(this.purity, true);
    this.hud.setCurrentStage(1);
    this.enemyManager.setMaxConcurrentOverride(null);
    this.bossManager.reset();
    this.tutorialManager.start();

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      0
    );
  }

  exitTutorialToMenu() {
    this.tutorialManager.stop();
    this.returnToStartMenu();
  }

  /**
   * Inicia efetivamente o loop de combate na arena (usado após a cutscene ou diretamente nas partidas seguintes)
   */
  beginPlayMatch() {
    this.closeAllUtilityModals();
    this.hud.clearFloatingTexts();
    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.hud.hideAchievementToast();
    if (this.matchBadgesAwarded) {
      this.matchBadgesAwarded.clear();
    }
    if (this.tutorialManager.active) {
      this.tutorialManager.stop();
    }

    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.bestRankIndex = 0;
    this.bestRank = 'D';
    this.bestRankColor = '#8d99ae';
    this.bossDefeatedCount = 0;
    this.nextBossSpawnTimeSec = STAGE_3_BOSS_UNLOCK_TIME_SEC;
    this.recordSavedThisMatch = false;
    this.isGameOver = false;
    this.gameState = 'PLAYING';

    this.arena.setStageSize(1, true);
    this.arena.randomizeObstacles({ mode: 'match' });
    this.arena.setPurity(this.purity, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.setMaxConcurrentOverride(null);
    this.enemyManager.setAutoSpawnEnabled(true);
    this.enemyManager.reset();
    this.bossManager.reset();
    this.enemyManager.spawnEnemyAroundPerimeter(1, 'PLASTIC');
    this.enemyManager.spawnEnemyAroundPerimeter(1, 'METAL');

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  /**
   * Abre o Menu de Pausa & Opções (seja apertando ESC no meio da gameplay ou clicando em Opções no Menu Inicial)
   */
  openPauseMenu(origin = 'PLAYING') {
    this.optionsOrigin = origin;
    this.player.clearKeys();
    if (this.comboSystem.openBinId) {
      this.comboSystem.closeBin(false);
    }

    const badgeEl = document.getElementById('pause-menu-badge');
    const liveStatsEl = document.getElementById('pause-live-stats');
    const resumeBtn = document.getElementById('btn-pause-resume');
    const restartBtn = document.getElementById('btn-pause-restart');
    const toStartBtn = document.getElementById('btn-pause-to-start');

    if (origin === 'MENU') {
      this.gameState = 'PAUSED';
      this.sound.playMenuClick(true);
      if (this.hud.startMenuOverlay) {
        this.hud.startMenuOverlay.classList.add('options-open');
      }
      if (badgeEl) badgeEl.textContent = '⚙ CONFIGURAÇÕES // MENU INICIAL';
      if (liveStatsEl) liveStatsEl.classList.add('hidden');
      if (resumeBtn) resumeBtn.textContent = '▶ SALVAR & VOLTAR AO MENU (ESC)';
      if (restartBtn) restartBtn.classList.add('hidden');
      if (toStartBtn) toStartBtn.classList.add('hidden');
    } else {
      this.gameState = 'PAUSED';
      this.sound.playPauseToggle(true);
      if (badgeEl) badgeEl.textContent = '⏸ JOGO PAUSADO // TECLA ESC';
      if (liveStatsEl) liveStatsEl.classList.remove('hidden');
      if (resumeBtn) resumeBtn.textContent = '▶ CONTINUAR PARTIDA (ESC)';
      if (restartBtn) restartBtn.classList.remove('hidden');
      if (toStartBtn) toStartBtn.classList.remove('hidden');
    }

    this.syncOptionsUI();
    this.hud.showPauseMenu({
      score: this.score,
      stage: this.stage,
      purity: this.purity,
      rank: this.comboSystem.styleState?.rank || 'D'
    });
  }

  handlePausePrimaryAction() {
    if (this.optionsOrigin === 'MENU') {
      this.sound.playMenuClick(false);
      this.hud.hidePauseMenu();
      this.hud.showStartMenu();
      this.gameState = 'MENU';
    } else {
      this.resumeMatch();
    }
  }

  resumeMatch() {
    if (this.gameState !== 'PAUSED') return;
    this.player.clearKeys();
    this.hud.hidePauseMenu();
    this.gameState = 'PLAYING';
    this.sound.playPauseToggle(false);
  }

  returnToStartMenu() {
    this.sound.playMenuClick(false);
    if (this.tutorialManager.active) {
      this.tutorialManager.stop();
    }
    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.bestRankIndex = 0;
    this.bestRank = 'D';
    this.bestRankColor = '#8d99ae';
    this.bossDefeatedCount = 0;
    this.nextBossSpawnTimeSec = STAGE_3_BOSS_UNLOCK_TIME_SEC;
    this.recordSavedThisMatch = false;
    this.isGameOver = false;
    this.gameState = 'MENU';

    this.closeAllUtilityModals();
    this.hud.clearFloatingTexts();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.hud.hideAchievementToast();
    if (this.matchBadgesAwarded) {
      this.matchBadgesAwarded.clear();
    }
    this.arena.setStageSize(1, true);
    this.arena.setPurity(this.purity, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.setMaxConcurrentOverride(null);
    this.enemyManager.setAutoSpawnEnabled(true);
    this.enemyManager.reset();
    this.bossManager.reset();

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(this.stage, this.score, 0, this.matchElapsedSec);
    this.hud.showStartMenu();
  }

  /**
   * E2-06 / E2-03 — Ativa o Estágio 2 aos 01:30: expande suavemente o mapa, acumula +1 inimigo por lixeira e aplica +15% HP / +8% vel
   */
  enterStage2() {
    if (this.stage >= 2) return;
    this.stage = 2;
    this.arena.setStageSize(2, false);
    this.hud.setCurrentStage(2);
    this.hud.showStageTransitionBanner(2, 5200);
    this.sound.playStageTransition(2);
    this.enemyManager.triggerStage2ArrivalWave();
    this.comboSystem.syncHUD();
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  /**
   * E2-03 / E2-04 — Ativa o Estágio 3 aos 03:00 (Onda Final): +30% HP, +16% velocidade e alta incidência de blindados
   * (Base pronta para receber o Chefão ao final do Estágio 3 no Épico E5)
   */
  enterStage3() {
    if (this.stage >= 3) return;
    this.stage = 3;
    this.hud.setCurrentStage(3);
    this.hud.showStageTransitionBanner(3, 5600);
    this.sound.playStageTransition(3);
    this.enemyManager.triggerStage3ArrivalWave();
    this.comboSystem.syncHUD();
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  /**
   * E6-02 — Desbloqueia e concede o bônus de pontos de uma insígnia (uma vez por partida + salvo no localStorage)
   */
  awardMatchBadge(badgeId) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;
    if (this.matchBadgesAwarded.has(badgeId)) return;

    const { badge } = this.progressionStore.unlockBadge(badgeId);
    if (!badge) return;

    this.matchBadgesAwarded.add(badgeId);
    this.score += badge.bonusPoints;

    if (typeof this.sound.playAchievementUnlock === 'function') {
      this.sound.playAchievementUnlock();
    }
    this.hud.showAchievementToast(badge);
    this.hud.spawnFloatingText(
      this.player.position.clone().add(new THREE.Vector3(0, 3.05, 0)),
      this.arena.camera,
      this.viewportEl,
      `${badge.icon} ${badge.title.toUpperCase()}! +${badge.bonusPoints.toLocaleString('pt-BR')} PTS`,
      badge.accent || '#ffd166'
    );
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec,
      { bossActive: this.bossManager.isActive(), nextBossTimeSec: this.nextBossSpawnTimeSec }
    );
  }

  /**
   * E6-02 — Monitora novas combinações disparadas na partida:
   * ao atingir a 10ª combinação distinta, desbloqueia "Alquimista da Reciclagem" (+1.000 pts)!
   */
  handleUniqueSpellUsed({ spell, uniqueCount } = {}) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;
    if (spell?.id) {
      this.progressionStore.recordDiscoveredSpell(spell.id);
    }
    if (uniqueCount >= 10) {
      this.awardMatchBadge('ALCHEMIST');
    }
    if (uniqueCount >= 12) {
      this.awardMatchBadge('HWEI_GRANDMASTER');
    }
  }

  /**
   * E5-01 — Instancia o Chefão Colosso de Entulho ao final do Estágio 3 (e a cada novo ciclo de 3 ondas)
   */
  spawnStageBoss() {
    if (this.bossManager.isActive()) return;
    const bossTier = this.bossDefeatedCount + 1;
    // Durante o Chefão, limita inimigos comuns a 5 para permitir gerar Rank DMC sem lotar a arena
    this.enemyManager.setMaxConcurrentOverride(5);
    this.bossManager.spawnColossus({ stage: this.stage, bossTier });
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec,
      { bossActive: true, nextBossTimeSec: this.nextBossSpawnTimeSec }
    );
  }

  handleBossHitPoints(points = 0) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;
    this.score += points;
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec,
      { bossActive: this.bossManager.isActive(), nextBossTimeSec: this.nextBossSpawnTimeSec }
    );
  }

  /**
   * E5-04 — Derrota do Chefão Colosso de Entulho:
   * purifica o cenário, concede +3.000 pontos, restaura +50% de Pureza Ambiental e avança para o próximo estágio!
   */
  handleBossDefeated({
    bossName = 'COLOSSO DE ENTULHO',
    scoreBonus = 3000,
    purityBonus = 50,
    position = null
  } = {}) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;

    this.bossDefeatedCount += 1;
    this.kills += 1;
    this.score += scoreBonus;
    this.purity = Math.min(100, this.purity + purityBonus);
    this.stage += 1;
    this.nextBossSpawnTimeSec = this.matchElapsedSec + BOSS_CYCLE_INTERVAL_SEC;

    // Purifica todos os resíduos remanescentes e restaura a atmosfera limpa do parque
    const purifiedMinions = this.enemyManager.purifyAllEnemiesOnBossDefeat();
    this.kills += purifiedMinions;
    this.enemyManager.setMaxConcurrentOverride(null);

    this.hud.setCurrentStage(this.stage);
    this.hud.updatePurity(this.purity);
    this.arena.setPurity(this.purity, false);
    this.sidebarCharacter.triggerMasteryFlash();
    this.hud.triggerPortraitMastery(2200);

    this.hud.showBossVictoryBanner({
      bossName,
      nextStage: this.stage,
      scoreBonus,
      purityBonus
    });
    this.awardMatchBadge('COLOSSUS_SLAYER');

    const anchorPos = (position || this.player.position).clone().add(new THREE.Vector3(0, 3.2, 0));
    this.hud.spawnFloatingText(
      anchorPos,
      this.arena.camera,
      this.viewportEl,
      `🏆 +${scoreBonus.toLocaleString('pt-BR')} PTS · +${purityBonus}% PUREZA!`,
      '#00f5d4'
    );

    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec,
      { bossActive: false, nextBossTimeSec: this.nextBossSpawnTimeSec }
    );
  }

  /**
   * E3-04 — Bônus de Maestria Elemental (4 combos inéditos seguidos):
   * recupera +10% de Pureza Ambiental e dispara Pulso de Purificação em área!
   */
  handleElementalMastery({ purityBonus = 10, scoreBonus = 400, pulseRadius = 8.5 } = {}) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;

    this.purity = Math.min(100, this.purity + purityBonus);
    this.score += scoreBonus;
    this.sidebarCharacter.triggerMasteryFlash();
    this.hud.triggerPortraitMastery();
    this.hud.updatePurity(this.purity);
    this.arena.setPurity(this.purity, false);

    this.enemyManager.applyMasteryPurificationPulse(
      this.player.position.clone(),
      pulseRadius
    );

    this.hud.spawnFloatingText(
      this.player.position.clone().add(new THREE.Vector3(0, 2.8, 0)),
      this.arena.camera,
      this.viewportEl,
      `🌟 MAESTRIA ELEMENTAL! +${purityBonus}% PUREZA · +${scoreBonus} PTS`,
      '#00f5d4'
    );
    this.awardMatchBadge('ELEMENTAL_MASTERY');

    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  handlePlayerHit(purityLoss = 15) {
    if (this.gameState === 'TUTORIAL') {
      // No Tutorial Interativo (E4-07), nunca ocorre Game Over e a Pureza permanece protegida
      this.purity = Math.max(85, this.purity - Math.min(5, purityLoss));
      this.sidebarCharacter.triggerHurt();
      this.hud.triggerPortraitHurt();
      this.hud.triggerDamageFlash();
      this.hud.updatePurity(this.purity);
      return;
    }

    if (this.gameState !== 'PLAYING' || this.isGameOver) return;
    this.purity = Math.max(0, this.purity - purityLoss);
    this.sidebarCharacter.triggerHurt();
    this.hud.triggerPortraitHurt();
    this.hud.triggerDamageFlash();
    this.hud.updatePurity(this.purity);
    this.arena.setPurity(this.purity, false);
    if (this.purity < 30) {
      this.arena.triggerPollutionSurge();
    }

    if (this.purity <= 0) {
      this.isGameOver = true;
      this.gameState = 'GAMEOVER';
      this.player.clearKeys();
      if (this.comboSystem.openBinId) {
        this.comboSystem.closeBin(false);
      }
      if (typeof this.sound.playGameOver === 'function') {
        this.sound.playGameOver();
      }
      this.hud.showPurityDepletedModal({
        score: this.score,
        stage: this.stage,
        kills: this.kills,
        elapsedSec: this.matchElapsedSec,
        bestRank: this.bestRank,
        bestRankColor: this.bestRankColor,
        masteryCount: this.comboSystem.masteryCount || 0
      });
      // E6-01 — Verifica elegibilidade no Top 5 local e exibe tabela + formulário de apelido
      this.recordSavedThisMatch = false;
      const top5Records = this.progressionStore.loadTop5Records();
      const eligible = this.progressionStore.isTop5Eligible(this.score);
      this.hud.setupGameOverRecordForm({
        eligible,
        lastNickname: this.progressionStore.getLastNickname(),
        records: top5Records
      });
      this.hud.updateGameOverBadgesStrip({
        uniqueSpellsCount: this.comboSystem.usedSpellsThisMatch.size,
        alchemistUnlocked: this.matchBadgesAwarded.has('ALCHEMIST')
      });
    }
  }

  handleEnemyHitOrKilled({ points, multiplier, defeated, enemyPos }) {
    if (this.gameState === 'TUTORIAL') {
      this.score += points;
      if (defeated) {
        this.kills += 1;
        this.tutorialManager.handleEnemyKilled();
      }
      this.hud.updateStageAndScore(
        this.stage,
        this.score,
        this.enemyManager.enemies.length,
        0
      );
      return;
    }

    if (this.gameState !== 'PLAYING' || this.isGameOver) return;

    this.score += points;

    if (defeated) {
      this.kills += 1;

      // Seção 3.3.4 do Documento Mestre: Derrotar inimigos com combos variados (M >= 2.5x) recupera +2% de Pureza Ambiental
      if (multiplier >= 2.5 && this.purity < 100) {
        this.purity = Math.min(100, this.purity + 2);
        this.hud.updatePurity(this.purity);
        this.arena.setPurity(this.purity, false);
        this.hud.spawnFloatingText(
          enemyPos.add(new THREE.Vector3(0, 1.2, 0)),
          this.arena.camera,
          this.viewportEl,
          '+2% PUREZA',
          '#34c759'
        );
      }
    }

    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  restartMatch() {
    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.bestRankIndex = 0;
    this.bestRank = 'D';
    this.bestRankColor = '#8d99ae';
    this.bossDefeatedCount = 0;
    this.nextBossSpawnTimeSec = STAGE_3_BOSS_UNLOCK_TIME_SEC;
    this.recordSavedThisMatch = false;
    this.isGameOver = false;
    this.gameState = 'PLAYING';

    this.closeAllUtilityModals();
    this.hud.clearFloatingTexts();
    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.hud.hideAchievementToast();
    if (this.matchBadgesAwarded) {
      this.matchBadgesAwarded.clear();
    }

    this.arena.setStageSize(1, true);
    this.arena.randomizeObstacles({ mode: 'match' });
    this.arena.setPurity(this.purity, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.setMaxConcurrentOverride(null);
    this.enemyManager.setAutoSpawnEnabled(true);
    this.enemyManager.reset();
    this.bossManager.reset();
    this.enemyManager.spawnEnemyAroundPerimeter(1, 'PLASTIC');
    this.enemyManager.spawnEnemyAroundPerimeter(1, 'METAL');

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsedTime = this.clock.getElapsedTime();

    if (this.gameState === 'PLAYING') {
      this.matchElapsedSec += dt;
      if (this.stage === 1 && this.matchElapsedSec >= STAGE_2_UNLOCK_TIME_SEC) {
        this.enterStage2();
      } else if (this.stage === 2 && this.matchElapsedSec >= STAGE_3_UNLOCK_TIME_SEC) {
        this.enterStage3();
      } else if (
        this.stage >= 3 &&
        !this.bossManager.isActive() &&
        this.matchElapsedSec >= this.nextBossSpawnTimeSec
      ) {
        this.spawnStageBoss();
      }

      this.player.update(elapsedTime, dt);
      this.comboSystem.update(dt);
      this.enemyManager.update(elapsedTime, dt, this.stage);
      this.bossManager.update(elapsedTime, dt);
      const currentStyle = this.comboSystem.styleState;
      if (currentStyle && currentStyle.index > this.bestRankIndex) {
        this.bestRankIndex = currentStyle.index;
        this.bestRank = currentStyle.rank;
        this.bestRankColor = currentStyle.color;
        if (currentStyle.index >= 4) {
          this.awardMatchBadge('STYLE_S_RANK');
        }
      }
      this.hud.updateStageAndScore(
        this.stage,
        this.score,
        this.enemyManager.enemies.length,
        this.matchElapsedSec,
        {
          bossActive: this.bossManager.isActive(),
          nextBossTimeSec: this.nextBossSpawnTimeSec
        }
      );
      this.arena.update(elapsedTime, dt, this.player.position, false);
    } else if (this.gameState === 'TUTORIAL') {
      if (!this.tutorialManager.completed) {
        this.player.update(elapsedTime, dt);
        this.comboSystem.update(dt);
        this.enemyManager.update(elapsedTime, dt, 1);
        this.tutorialManager.update(dt);
        this.hud.updateStageAndScore(1, this.score, this.enemyManager.enemies.length, 0);
      }
      this.arena.update(elapsedTime, dt, this.player.position, false);
    } else if (this.gameState === 'CUTSCENE') {
      this.cutscenePlayer.update(elapsedTime, dt);
      this.player.updateIdleOrbsOnly(elapsedTime);
      this.arena.update(elapsedTime, dt, this.player.position, true);
    } else if (this.gameState === 'MENU') {
      // No Menu Inicial, roda a animação por frames em Pixel Art (vento, árvores, pássaros e protagonista)
      this.startMenuAnimator.updateAndRender(elapsedTime, dt);
      this.player.updateIdleOrbsOnly(elapsedTime);
      this.arena.update(elapsedTime, dt, this.player.position, true);
    } else {
      // Em PAUSED ou GAMEOVER, congela a lógica de combate (se abriu Opções pelo Menu Inicial, mantém os frames vivos ao fundo)
      if (this.gameState === 'PAUSED' && this.optionsOrigin === 'MENU') {
        this.startMenuAnimator.updateAndRender(elapsedTime, dt);
      }
      this.arena.update(elapsedTime, dt, this.player.position, false);
    }

    this.arena.render();
    this.sidebarCharacter.render(elapsedTime, dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__ECOCOMBO_APP__ = new EcoComboMVPApp();
});
