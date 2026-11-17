import * as THREE from 'three';
import { ArenaScene } from './game/arenaScene.js';
import { PlayerController } from './game/playerController.js';
import { ComboSystem } from './game/comboSystem.js';
import { EnemyManager } from './game/enemyManager.js';
import { SidebarCharacterRenderer } from './ui/sidebarCharacter.js';
import { HUDController } from './ui/hudController.js';
import { SoundEngine } from './audio/soundEngine.js';

class EcoComboMVPApp {
  constructor() {
    this.canvas = document.getElementById('three-canvas');
    this.viewportEl = document.getElementById('arena-viewport');

    // Estado da Partida (Sprint 1 MVP)
    this.score = 0;
    this.stage = 1;
    this.purity = 100;
    this.kills = 0;
    this.isGameOver = false;

    // 1. Áudio Sintetizado Procedural (Web Audio API)
    this.sound = new SoundEngine();

    // 2. Painel Lateral Reativo (E4-01: Estrutura Capsule + Arte Until Then)
    const upperCanvas = document.getElementById('character-upper-canvas');
    const portraitCanvas = document.getElementById('character-portrait-canvas');
    this.sidebarCharacter = new SidebarCharacterRenderer(upperCanvas, portraitCanvas);
    this.hud = new HUDController(this.sidebarCharacter);

    // 3. Cena 3D Isométrica 2.5D com Sombras e UnrealBloomPass (E1-01)
    this.arena = new ArenaScene(this.canvas, this.viewportEl);

    // 4. Protagonista no WASD + 4 Orbes em Órbita + Mira com Raycaster (E1-02)
    this.player = new PlayerController(
      this.arena.scene,
      this.arena.camera,
      this.viewportEl,
      this.arena.groundPlane
    );

    // 5. Sistema de Lixeiras e Leque Hwei (Q/E/R/F) + Medidor de Estilo Devil May Cry (E3-05 / E4-05)
    this.comboSystem = new ComboSystem({
      scene: this.arena.scene,
      player: this.player,
      hud: this.hud,
      sound: this.sound,
      viewportEl: this.viewportEl,
      camera: this.arena.camera,
      onShotFired: () => {
        this.sidebarCharacter.triggerShootFlash();
      }
    });

    // 6. Gerenciador dos Inimigos Recicláveis (Garrafa PET, Papelão, Vidro, Porca de Metal — E2-05)
    this.enemyManager = new EnemyManager({
      scene: this.arena.scene,
      player: this.player,
      comboSystem: this.comboSystem,
      hud: this.hud,
      sound: this.sound,
      camera: this.arena.camera,
      viewportEl: this.viewportEl,
      onPlayerTouch: (purityLoss) => this.handlePlayerHit(purityLoss),
      onEnemyKilled: (hitEvent) => this.handleEnemyHitOrKilled(hitEvent)
    });

    this.bindUIEvents();

    // Instancia 1 Garrafa PET (Plástico) e 1 Porca de Metal (Metal) iniciais nas bordas
    this.enemyManager.spawnEnemyAroundPerimeter(this.stage, 'PLASTIC');
    this.enemyManager.spawnEnemyAroundPerimeter(this.stage, 'METAL');
    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(this.stage, this.score, this.enemyManager.enemies.length);

    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  bindUIEvents() {
    // Clique Esquerdo do Mouse (LMB) na Arena dispara o Objeto/Energia formado (E3-01)
    this.viewportEl.addEventListener('mousedown', (e) => {
      if (e.button !== 0 || this.isGameOver) return;
      this.comboSystem.tryFireAtAim(this.viewportEl, this.arena.camera);
    });

    // Botão de alternar som sintetizado
    const audioBtn = document.getElementById('btn-toggle-audio');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const on = this.sound.toggle();
        audioBtn.textContent = on ? '🔊 SOM: ON' : '🔇 SOM: OFF';
      });
    }

    // Botão / Tecla de reinício quando Pureza chega a 0%
    const restartBtn = document.getElementById('btn-restart-match');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartMatch());
    }

    window.addEventListener('keydown', (e) => {
      if (this.isGameOver && e.code === 'Enter') {
        this.restartMatch();
      }
    });
  }

  handlePlayerHit(purityLoss = 15) {
    if (this.isGameOver) return;
    this.purity = Math.max(0, this.purity - purityLoss);
    this.sidebarCharacter.triggerHurt();
    this.hud.updatePurity(this.purity);

    if (this.purity <= 0) {
      this.isGameOver = true;
      this.hud.showPurityDepletedModal({
        score: this.score,
        stage: this.stage,
        kills: this.kills
      });
    }
  }

  handleEnemyHitOrKilled({ points, multiplier, defeated, enemyPos }) {
    if (this.isGameOver) return;

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

      // Avança o indicador STAGE a cada 8 bichos purificados
      const newStage = 1 + Math.floor(this.kills / 8);
      if (newStage > this.stage) {
        this.stage = newStage;
      }
    }

    this.hud.updateStageAndScore(this.stage, this.score, this.enemyManager.enemies.length);
  }

  restartMatch() {
    this.score = 0;
    this.stage = 1;
    this.purity = 100;
    this.kills = 0;
    this.isGameOver = false;

    this.hud.hidePurityDepletedModal();
    this.player.reset();
    this.comboSystem.reset();
    this.enemyManager.reset();
    this.enemyManager.spawnEnemyAroundPerimeter(1);
    this.enemyManager.spawnEnemyAroundPerimeter(1);

    this.hud.updatePurity(this.purity);
    this.hud.updateStageAndScore(this.stage, this.score, this.enemyManager.enemies.length);
  }

  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(0.05, this.clock.getDelta());
    const elapsedTime = this.clock.getElapsedTime();

    if (!this.isGameOver) {
      this.player.update(elapsedTime, dt);
      this.comboSystem.update(dt);
      this.enemyManager.update(elapsedTime, dt, this.stage);
      this.hud.updateStageAndScore(
        this.stage,
        this.score,
        this.enemyManager.enemies.length
      );
    }

    this.arena.update(elapsedTime, dt, this.player.position);
    this.arena.render();
    this.sidebarCharacter.render(elapsedTime, dt);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.__ECOCOMBO_APP__ = new EcoComboMVPApp();
});
