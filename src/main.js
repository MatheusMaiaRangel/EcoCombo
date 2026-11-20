import * as THREE from 'three';
import { ArenaScene } from './game/arenaScene.js';
import { PlayerController } from './game/playerController.js';
import { ComboSystem } from './game/comboSystem.js';
import { EnemyManager } from './game/enemyManager.js';
import { SidebarCharacterRenderer } from './ui/sidebarCharacter.js';
import { HUDController } from './ui/hudController.js';
import { SoundEngine } from './audio/soundEngine.js';
import { STAGE_2_UNLOCK_TIME_SEC } from './constants/recipes.js';

const SETTINGS_STORAGE_KEY = 'ecocombo_settings_v1';

class EcoComboMVPApp {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.viewportEl = document.getElementById('arena-viewport');

    // Estado da Partida e Fluxo de Menus (E4-06)
    // 'MENU' (Menu Inicial) | 'PLAYING' (Gameplay ativa) | 'PAUSED' (Menu ESC) | 'GAMEOVER' (Pureza 0%)
    this.gameState = 'MENU';
    this.optionsOrigin = 'PLAYING'; // 'MENU' | 'PLAYING'

    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.isGameOver = false;

    this.settings = this.loadSettings();

    // 1. Áudio Sintetizado Procedural (Web Audio API)
    this.sound = new SoundEngine();

    // 2. Painel Lateral Reativo (E4-01: Estrutura Capsule + Arte Until Then)
    const upperCanvas = document.getElementById('character-upper-canvas');
    const portraitCanvas = document.getElementById('character-portrait-canvas');
    this.sidebarCharacter = new SidebarCharacterRenderer(upperCanvas, portraitCanvas);
    this.hud = new HUDController(this.sidebarCharacter);

    // 3. Cena 3D Isométrica 2.5D com Sombras, UnrealBloomPass e Expansão Dinâmica no Estágio 2 (E1-01 / E2-06)
    this.arena = new ArenaScene(this.canvas, this.viewportEl);
    const getArenaHalfSize = () => this.arena.getHalfSize();

    // 4. Protagonista no WASD + 4 Orbes em Órbita + Mira com Raycaster (E1-02)
    this.player = new PlayerController(
      this.arena.scene,
      this.arena.camera,
      this.viewportEl,
      this.arena.groundPlane,
      getArenaHalfSize
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
      isGameplayActive: () => this.gameState === 'PLAYING',
      onShotFired: () => {
        this.sidebarCharacter.triggerShootFlash();
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
      onPlayerTouch: (purityLoss) => this.handlePlayerHit(purityLoss),
      onEnemyKilled: (hitEvent) => this.handleEnemyHitOrKilled(hitEvent)
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
    // Clique Esquerdo do Mouse (LMB) na Arena dispara o Objeto/Energia formado (E3-01)
    this.viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.gameState !== 'PLAYING') return;
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

    // Botão no topo da arena para abrir o Menu de Pausa e Opções (ESC)
    const openPauseBtn = document.getElementById('btn-open-pause-menu');
    if (openPauseBtn) {
      openPauseBtn.addEventListener('click', () => {
        if (this.gameState === 'PLAYING') {
          this.openPauseMenu('PLAYING');
        } else if (this.gameState === 'PAUSED') {
          this.handlePausePrimaryAction();
        }
      });
    }

    // ==================== EVENTOS DO MENU INICIAL (E4-06) ====================
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

    const startGuideBtn = document.getElementById('btn-start-toggle-guide');
    const howtoBox = document.getElementById('start-howto-box');
    if (startGuideBtn && howtoBox) {
      startGuideBtn.addEventListener('click', () => {
        this.sound.playMenuClick(true);
        howtoBox.classList.toggle('hidden');
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
      restartBtn.addEventListener('click', () => this.restartMatch());
    }

    const gameoverToMenuBtn = document.getElementById('btn-gameover-to-menu');
    if (gameoverToMenuBtn) {
      gameoverToMenuBtn.addEventListener('click', () => this.returnToStartMenu());
    }

    // Atalhos Globais de Teclado: ESC (Abre/Fecha Menu de Pausa e Opções) e ENTER (Inicia/Reinicia)
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;

      if (e.code === 'Escape') {
        e.preventDefault();
        if (this.gameState === 'PLAYING') {
          this.openPauseMenu('PLAYING');
        } else if (this.gameState === 'PAUSED') {
          this.handlePausePrimaryAction();
        }
        return;
      }

      if (e.code === 'Enter') {
        if (this.gameState === 'MENU') {
          e.preventDefault();
          this.startNewMatchFromMenu();
        } else if (this.gameState === 'GAMEOVER') {
          e.preventDefault();
          this.restartMatch();
        }
      }
    });
  }

  /**
   * Inicia a partida a partir do Menu Inicial (E4-06)
   */
  startNewMatchFromMenu() {
    this.sound.playMenuClick(true);
    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();

    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.isGameOver = false;
    this.gameState = 'PLAYING';

    this.arena.setStageSize(1, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.reset();
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
      this.hud.hideStartMenu();
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
    this.score = 0;
    this.stage = 1;
    this.matchElapsedSec = 0;
    this.purity = 100;
    this.kills = 0;
    this.isGameOver = false;
    this.gameState = 'MENU';

    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();
    this.arena.setStageSize(1, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.reset();

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(this.stage, this.score, 0, this.matchElapsedSec);
    this.hud.showStartMenu();
  }

  /**
   * E2-06 — Ativa o Estágio 2 aos 01:30: expande suavemente o mapa e acumula +1 novo inimigo por lixeira CONAMA
   */
  enterStage2() {
    if (this.stage >= 2) return;
    this.stage = 2;
    this.arena.setStageSize(2, false);
    this.hud.setCurrentStage(2);
    this.hud.showStageTransitionBanner(5200);
    this.sound.playStageTransition();
    this.enemyManager.triggerStage2ArrivalWave();
    this.comboSystem.syncHUD();
    this.hud.updateStageAndScore(
      this.stage,
      this.score,
      this.enemyManager.enemies.length,
      this.matchElapsedSec
    );
  }

  handlePlayerHit(purityLoss = 15) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;
    this.purity = Math.max(0, this.purity - purityLoss);
    this.sidebarCharacter.triggerHurt();
    this.hud.updatePurity(this.purity);

    if (this.purity <= 0) {
      this.isGameOver = true;
      this.gameState = 'GAMEOVER';
      this.player.clearKeys();
      if (this.comboSystem.openBinId) {
        this.comboSystem.closeBin(false);
      }
      this.hud.showPurityDepletedModal({
        score: this.score,
        stage: this.stage,
        kills: this.kills
      });
    }
  }

  handleEnemyHitOrKilled({ points, multiplier, defeated, enemyPos }) {
    if (this.gameState !== 'PLAYING' || this.isGameOver) return;

    this.score += points;

    if (defeated) {
      this.kills += 1;

      // Seção 3.3.4 do Documento Mestre: Derrotar inimigos com combos variados (M >= 2.5x) recupera +2% de Pureza Ambiental
      if (multiplier >= 2.5 && this.purity < 100) {
        this.purity = Math.min(100, this.purity + 2);
        this.hud.updatePurity(this.purity);
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
    this.isGameOver = false;
    this.gameState = 'PLAYING';

    this.hud.hideStartMenu();
    this.hud.hidePauseMenu();
    this.hud.hidePurityDepletedModal();
    this.hud.hideStageTransitionBanner();

    this.arena.setStageSize(1, true);
    this.hud.setCurrentStage(1);
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.reset();
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
      }

      this.player.update(elapsedTime, dt);
      this.comboSystem.update(dt);
      this.enemyManager.update(elapsedTime, dt, this.stage);
      this.hud.updateStageAndScore(
        this.stage,
        this.score,
        this.enemyManager.enemies.length,
        this.matchElapsedSec
      );
      this.arena.update(elapsedTime, dt, this.player.position, false);
    } else if (this.gameState === 'MENU') {
      // No Menu Inicial, mantém os 4 orbes orbitando e a câmera isométrica em leve panorâmica
      this.player.updateIdleOrbsOnly(elapsedTime);
      this.arena.update(elapsedTime, dt, this.player.position, true);
    } else {
      // Em PAUSED ou GAMEOVER, congela a lógica de combate mas mantém os cristais da arena vivos
      this.arena.update(elapsedTime, dt, this.player.position, false);
    }

    this.arena.render();
    this.sidebarCharacter.render(elapsedTime, dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__ECOCOMBO_APP__ = new EcoComboMVPApp();
});
