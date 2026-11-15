import * as THREE from 'three';
import {
  KEY_TO_ELEMENT,
  resolveRecipe,
  computeStaleMultiplier
} from '../constants/recipes.js';
import { buildRecipeObjectMesh } from './playerController.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

/**
 * E3-01 e E3-02 — Sistema de Combinação das 4 Cores CONAMA, Disparo Mirado e Multiplicador Decrescente (Stale Decay)
 */
export class ComboSystem {
  constructor({ scene, player, hud, sound, onShotFired }) {
    this.scene = scene;
    this.player = player;
    this.hud = hud;
    this.sound = sound;
    this.onShotFired = onShotFired;

    // Buffer de 2 elementos da combinação atual
    this.slots = [];
    this.currentRecipe = null;

    // Rastreador de repetição de combo (E3-02: lastComboId e contador R)
    this.lastComboId = null;
    this.lastRecipe = null;
    this.repeatCount = 0;
    this.activeMultiplier = 4.0;

    // Lista de projéteis 3D ativos e partículas de impacto na arena
    this.projectiles = [];
    this.particles = [];

    this.bindInputs();
    this.syncHUD();
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const elemId = KEY_TO_ELEMENT[e.code];
      if (elemId) {
        this.pushElement(elemId);
      }
    });

    // Clique nas pílulas CONAMA do painel lateral também canaliza o elemento
    const pills = document.querySelectorAll('.conama-key-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const elemId = pill.getAttribute('data-element');
        if (elemId) {
          this.pushElement(elemId);
        }
      });
    });
  }

  /**
   * Adiciona um dos 4 elementos CONAMA (Plástico, Papel, Vidro, Metal) ao buffer de 2 slots
   */
  pushElement(elemId) {
    // Feedback visual no botão correspondente da legenda lateral
    const btn = document.querySelector(`.conama-key-pill[data-element="${elemId}"]`);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }

    // Se já havia uma receita completa (2 slots) não disparada, iniciar nova dupla permite trocar de combo livremente
    if (this.slots.length >= 2) {
      this.slots = [elemId];
      this.currentRecipe = null;
      this.sound.playElementSelect(elemId, 0);
    } else if (this.slots.length === 0) {
      this.slots = [elemId];
      this.currentRecipe = null;
      this.sound.playElementSelect(elemId, 0);
    } else if (this.slots.length === 1) {
      this.slots.push(elemId);
      this.currentRecipe = resolveRecipe(this.slots[0], this.slots[1]);

      const preview = this.getPreviewDecayForRecipe(this.currentRecipe);
      this.sound.playElementSelect(elemId, 1);
      this.sound.playComboReady(this.currentRecipe, preview.multiplier);
    }

    this.player.setConjuredRecipePreview(this.currentRecipe, this.slots);
    this.syncHUD();
  }

  /**
   * Calcula qual será o contador R e o multiplicador M(R) para a receita informada
   */
  getPreviewDecayForRecipe(recipe) {
    if (!recipe) {
      return {
        repeatCount: this.repeatCount,
        multiplier: this.activeMultiplier
      };
    }

    if (this.lastComboId === null) {
      return { repeatCount: 0, multiplier: 4.0 };
    }

    if (recipe.id === this.lastComboId) {
      const nextR = this.repeatCount + 1;
      return {
        repeatCount: nextR,
        multiplier: computeStaleMultiplier(nextR)
      };
    }

    // RN05: Trocar para uma combinação diferente restaura imediatamente o multiplicador para 4.0x (R = 0)
    return {
      repeatCount: 0,
      multiplier: 4.0
    };
  }

  /**
   * E3-01 / E3-02 — Dispara o Objeto/Energia formado na direção mirada pelo Mouse (LMB)
   */
  tryFireAtAim(viewportEl, camera) {
    if (!this.currentRecipe) {
      // Se o jogador clicou sem ter formado 2 cores, avisa de forma amigável
      this.hud.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
        camera,
        viewportEl,
        'COMBINE 2 CORES (1-4 / QERF)!',
        '#ffd166'
      );
      return false;
    }

    const recipe = this.currentRecipe;

    // Atualiza o rastreador oficial de repetição (RN04 / RN05 / E3-02)
    if (this.lastComboId === recipe.id) {
      this.repeatCount += 1;
    } else {
      this.repeatCount = 0;
      this.lastComboId = recipe.id;
    }

    this.lastRecipe = recipe;
    this.activeMultiplier = computeStaleMultiplier(this.repeatCount);

    // Toca som sintetizado proporcional ao multiplicador (ou som desgastado em 1.0x)
    this.sound.playShoot(this.activeMultiplier);

    // Se atingiu 1.0x (R >= 3), exibe aviso flutuante imediato sobre o protagonista
    if (this.activeMultiplier <= 1.0) {
      this.hud.spawnFloatingText(
        this.player.position.clone().add(new THREE.Vector3(0, 2.5, 0)),
        camera,
        viewportEl,
        '1.0x — COMBO REPETIDO! VARIE!',
        '#ff4d6d'
      );
    }

    // Instancia o(s) projétil(is) 3D na direção calculada pelo Raycaster
    const baseDir = this.player.aimDirection.clone().normalize();
    const spawnOrigin = this.player.position
      .clone()
      .add(new THREE.Vector3(baseDir.x * 0.9, 1.15, baseDir.z * 0.9));

    if (recipe.behavior === 'triple_fan') {
      // Papel + Papel: Rajada de Origami Cortante (leque triplo)
      const angles = [-0.18, 0, 0.18];
      angles.forEach((ang) => {
        const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        this.spawnProjectileInstance(recipe, spawnOrigin, dir, this.activeMultiplier);
      });
    } else {
      this.spawnProjectileInstance(recipe, spawnOrigin, baseDir, this.activeMultiplier);
    }

    // Limpa os 2 slots após o disparo para a próxima combinação
    this.slots = [];
    this.currentRecipe = null;
    this.player.setConjuredRecipePreview(null, []);
    this.syncHUD();

    if (this.onShotFired) {
      this.onShotFired(recipe, this.activeMultiplier, this.repeatCount);
    }

    return true;
  }

  spawnProjectileInstance(recipe, origin, direction, multiplier) {
    const mesh = buildRecipeObjectMesh(recipe, 1.0);
    mesh.position.copy(origin);
    const yaw = Math.atan2(direction.x, direction.z);
    mesh.rotation.set(0, yaw, 0);

    // Luz pontual no projétil para interagir com o chão em grid e UnrealBloomPass
    const light = new THREE.PointLight(recipe.colorA, 1.6, 5.5);
    mesh.add(light);

    this.scene.add(mesh);

    this.projectiles.push({
      mesh,
      recipe,
      direction: direction.clone().normalize(),
      speed: recipe.speed,
      multiplier,
      radius: recipe.radius,
      life: 1.8,
      pierceLeft: recipe.behavior === 'pierce' || recipe.behavior === 'precision_beam' ? 2 : 0,
      ricochetLeft: recipe.behavior === 'ricochet' ? 1 : 0,
      hitEnemyIds: new Set(),
      trailTimer: 0
    });
  }

  /**
   * Emite partículas 3D nas cores combinadas da receita (E3-01)
   */
  spawnImpactParticles(position, colorA, colorB, count = 14) {
    for (let i = 0; i < count; i++) {
      const size = 0.1 + Math.random() * 0.12;
      const geo = new THREE.BoxGeometry(size, size, size);
      const color = i % 2 === 0 ? colorA : colorB;
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(position);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 6.5;
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        1.5 + Math.random() * 4.0,
        Math.sin(angle) * speed
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        mat,
        velocity,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6
      });
    }
  }

  update(dt) {
    // 1. Atualiza Projéteis em Trajetória na Arena
    const limit = ARENA_HALF_SIZE + 0.5;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.mesh.position.addScaledVector(p.direction, p.speed * dt);
      p.mesh.rotation.z += dt * 7.5;

      // Rastro sutil de partículas
      p.trailTimer += dt;
      if (p.trailTimer >= 0.04) {
        p.trailTimer = 0;
        this.spawnImpactParticles(p.mesh.position, p.recipe.colorA, p.recipe.colorB, 1);
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

    // 2. Atualiza Partículas 3D
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
    // Se uma receita está pronta nas mãos, mostra imediatamente o multiplicador que ela terá ao ser disparada
    const preview = this.currentRecipe
      ? this.getPreviewDecayForRecipe(this.currentRecipe)
      : { repeatCount: this.repeatCount, multiplier: this.activeMultiplier };

    this.hud.updateComboHUD({
      slots: this.slots,
      recipe: this.currentRecipe,
      displayMultiplier: preview.multiplier,
      displayRepeatCount: preview.repeatCount,
      lastRecipe: this.lastRecipe
    });
  }

  reset() {
    for (const p of this.projectiles) {
      this.scene.remove(p.mesh);
    }
    this.projectiles = [];

    for (const pt of this.particles) {
      this.scene.remove(pt.mesh);
    }
    this.particles = [];

    this.slots = [];
    this.currentRecipe = null;
    this.lastComboId = null;
    this.lastRecipe = null;
    this.repeatCount = 0;
    this.activeMultiplier = 4.0;
    this.player.setConjuredRecipePreview(null, []);
    this.syncHUD();
  }
}
