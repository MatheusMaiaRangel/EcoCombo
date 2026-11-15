import * as THREE from 'three';
import { createEnemyTextures } from '../art/pixelTextures.js';
import { computeHitDamage, computeHitPoints } from '../constants/recipes.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

let NEXT_ENEMY_ID = 1;

/**
 * E2-01 — Gerenciador dos Inimigos da Poluição ("Bichos") na Arena Isométrica
 */
export class EnemyManager {
  constructor({ scene, player, comboSystem, hud, sound, camera, viewportEl, onPlayerTouch, onEnemyKilled }) {
    this.scene = scene;
    this.player = player;
    this.comboSystem = comboSystem;
    this.hud = hud;
    this.sound = sound;
    this.camera = camera;
    this.viewportEl = viewportEl;
    this.onPlayerTouch = onPlayerTouch;
    this.onEnemyKilled = onEnemyKilled;

    this.enemyTextureSets = createEnemyTextures();
    this.enemies = [];

    this.spawnTimer = 1.0;
    this.spawnInterval = 2.45;
    this.maxConcurrentEnemies = 9;
  }

  /**
   * Instancia um "bicho" da poluição nas bordas da arena isométrica com barra de HP flutuante (E2-01)
   */
  spawnEnemyAroundPerimeter(stage = 1) {
    if (this.enemies.length >= this.maxConcurrentEnemies) return;

    const borderDist = ARENA_HALF_SIZE - 1.1;
    const side = Math.floor(Math.random() * 4);
    const randOffset = (Math.random() * 2 - 1) * borderDist;

    let sx = 0;
    let sz = 0;
    if (side === 0) {
      sx = randOffset;
      sz = -borderDist;
    } else if (side === 1) {
      sx = randOffset;
      sz = borderDist;
    } else if (side === 2) {
      sx = -borderDist;
      sz = randOffset;
    } else {
      sx = borderDist;
      sz = randOffset;
    }

    const variantIdx = Math.floor(Math.random() * this.enemyTextureSets.length);
    const texFrames = this.enemyTextureSets[variantIdx];

    const group = new THREE.Group();
    group.position.set(sx, 0, sz);

    // Sprite 2.5D Pixel Art do Bicho com Sombra Projetada no Chão (THREE.NearestFilter)
    const spriteGeo = new THREE.PlaneGeometry(1.55, 1.55);
    const spriteMat = new THREE.MeshStandardMaterial({
      map: texFrames[0],
      transparent: true,
      alphaTest: 0.45,
      roughness: 0.6,
      side: THREE.DoubleSide
    });

    const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
    spriteMesh.position.y = 0.8;
    spriteMesh.rotation.y = Math.PI / 4;
    spriteMesh.castShadow = true;
    spriteMesh.receiveShadow = true;
    group.add(spriteMesh);

    // Sombra/Anel Tóxico no chão sob o bicho
    const shadowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.35, 0.56, 16),
      new THREE.MeshBasicMaterial({
        color: 0xff3b30,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45
      })
    );
    shadowRing.rotation.x = -Math.PI / 2;
    shadowRing.position.y = 0.025;
    group.add(shadowRing);

    // Barra de Vida (HP) Flutuante 3D acima do inimigo (Critério de Aceite E2-01)
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, 1.82, 0);
    hpGroup.rotation.y = Math.PI / 4;

    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.25, 0.17),
      new THREE.MeshBasicMaterial({ color: 0x161420, side: THREE.DoubleSide })
    );
    const hpFillGeo = new THREE.PlaneGeometry(1.18, 0.11);
    const hpFillMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.DoubleSide
    });
    const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFill.position.z = 0.01;

    hpGroup.add(hpBg, hpFill);
    group.add(hpGroup);

    this.scene.add(group);

    const maxHp = 130 + (stage - 1) * 15;
    const baseSpeed = 3.15 + Math.random() * 0.85 + Math.min(1.5, (stage - 1) * 0.18);

    this.enemies.push({
      id: NEXT_ENEMY_ID++,
      group,
      spriteMesh,
      spriteMat,
      texFrames,
      hpFill,
      hpFillMat,
      hp: maxHp,
      maxHp,
      speed: baseSpeed,
      slowTimer: 0,
      knockbackVel: new THREE.Vector3(0, 0, 0),
      animTimer: Math.random() * 2,
      hitFlashTimer: 0
    });
  }

  update(elapsedTime, dt, stage) {
    // 1. Temporizador de Geração Periódica (Spawner — E2-01)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemyAroundPerimeter(stage);
      this.spawnTimer = Math.max(1.35, this.spawnInterval - (stage - 1) * 0.1);
    }

    const playerPos = this.player.position;
    const limit = ARENA_HALF_SIZE - 0.8;

    // 2. Perseguição Contínua no Plano (X, Z) + Colisão com Protagonista
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Animação das pernas do bicho
      enemy.animTimer += dt * 7;
      const frameIdx = Math.floor(enemy.animTimer) % 2;
      enemy.spriteMat.map = enemy.texFrames[frameIdx];

      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
        enemy.spriteMat.emissive.setHex(0xffffff);
        enemy.spriteMat.emissiveIntensity = 0.8;
      } else {
        enemy.spriteMat.emissive.setHex(0x000000);
        enemy.spriteMat.emissiveIntensity = 0;
      }

      if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      }

      // Vetor de perseguição em direção às coordenadas (X, Z) do protagonista
      const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.group.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();

      if (distToPlayer > 0.001) {
        toPlayer.normalize();
      }

      const speedFactor = enemy.slowTimer > 0 ? 0.45 : 1.0;
      enemy.group.position.addScaledVector(toPlayer, enemy.speed * speedFactor * dt);

      // Aplica recuo (knockback) caso tenha colidido ou recebido impacto pesado
      if (enemy.knockbackVel.lengthSq() > 0.05) {
        enemy.group.position.addScaledVector(enemy.knockbackVel, dt);
        enemy.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 7));
      }

      enemy.group.position.x = THREE.MathUtils.clamp(enemy.group.position.x, -limit, limit);
      enemy.group.position.z = THREE.MathUtils.clamp(enemy.group.position.z, -limit, limit);

      // Espelha o sprite do bicho conforme direção de movimento na tela isométrica
      const screenRightDot = toPlayer.x * 0.7071 - toPlayer.z * 0.7071;
      enemy.spriteMesh.scale.x = screenRightDot < -0.05 ? -1 : 1;

      // Colisão Inimigo-Protagonista (E2-01: -15% Pureza e Recuo do Inimigo)
      if (distToPlayer < 1.12) {
        const pushBack = toPlayer.clone().multiplyScalar(-11.5);
        enemy.knockbackVel.copy(pushBack);

        if (this.player.invulnerableTimer <= 0) {
          this.player.invulnerableTimer = 0.85;
          this.sound.playPlayerHurt();
          this.comboSystem.spawnImpactParticles(
            playerPos.clone().add(new THREE.Vector3(0, 1.0, 0)),
            0xff3b30,
            0xff006e,
            16
          );
          this.hud.spawnFloatingText(
            playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)),
            this.camera,
            this.viewportEl,
            '-15% PUREZA AMBIENTAL!',
            '#ff3b30'
          );
          if (this.onPlayerTouch) {
            this.onPlayerTouch(15);
          }
        }
      }
    }

    // 3. Colisão Projéteis (Objetos/Energias) vs Inimigos ("Bichos") — E3-01 e E3-02
    const projectiles = this.comboSystem.projectiles;
    for (let pi = projectiles.length - 1; pi >= 0; pi--) {
      const proj = projectiles[pi];
      let removeProjectile = false;

      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const enemy = this.enemies[ei];
        if (proj.hitEnemyIds.has(enemy.id)) continue;

        const dx = proj.mesh.position.x - enemy.group.position.x;
        const dz = proj.mesh.position.z - enemy.group.position.z;
        const dist = Math.hypot(dx, dz);

        if (dist <= proj.radius + 0.68) {
          proj.hitEnemyIds.add(enemy.id);

          // E3-02: Dano e Pontos proporcionais ao Multiplicador M(R)
          const damage = computeHitDamage(proj.recipe.baseDamage, proj.multiplier);
          const points = computeHitPoints(proj.multiplier);

          enemy.hp -= damage;
          enemy.hitFlashTimer = 0.14;

          // Atualiza Barra de HP Flutuante
          const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
          enemy.hpFill.scale.x = Math.max(0.001, hpRatio);
          enemy.hpFill.position.x = -(1 - hpRatio) * 0.59;
          if (hpRatio > 0.5) {
            enemy.hpFillMat.color.setHex(0xffbe0b);
          } else {
            enemy.hpFillMat.color.setHex(0xff3b30);
          }

          // Comportamento por receita no impacto
          const knockStrength = proj.recipe.behavior === 'knockback' ? 12.0 : 5.5;
          enemy.knockbackVel.copy(proj.direction).multiplyScalar(knockStrength);
          if (proj.recipe.behavior === 'slow_shock') {
            enemy.slowTimer = 2.5;
          }

          // Partículas 3D nas cores combinadas (E3-01)
          this.comboSystem.spawnImpactParticles(
            enemy.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
            proj.recipe.colorA,
            proj.recipe.colorB,
            proj.multiplier >= 4.0 ? 18 : 10
          );

          // Texto Flutuante de Impacto com Pontos, Multiplicador e Dano (E3-02)
          const textColor =
            proj.multiplier >= 4.0
              ? '#00f5d4'
              : proj.multiplier >= 2.5
                ? '#ffd166'
                : proj.multiplier > 1.0
                  ? '#f8961e'
                  : '#ff4d6d';

          const floatMsg =
            proj.multiplier <= 1.0
              ? `+${points} PTS (1.0x REPETIDO!) · -${damage} HP`
              : `+${points} PTS (${proj.multiplier.toFixed(1)}x!) · -${damage} HP`;

          this.hud.spawnFloatingText(
            enemy.group.position.clone().add(new THREE.Vector3(0, 2.0, 0)),
            this.camera,
            this.viewportEl,
            floatMsg,
            textColor
          );

          const defeated = enemy.hp <= 0;
          this.sound.playEnemyHit(proj.multiplier, defeated);

          if (defeated) {
            this.comboSystem.spawnImpactParticles(
              enemy.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
              0x00f5d4,
              proj.recipe.colorA,
              24
            );
            this.scene.remove(enemy.group);
            this.enemies.splice(ei, 1);
          }

          if (this.onEnemyKilled) {
            this.onEnemyKilled({
              points,
              damage,
              multiplier: proj.multiplier,
              defeated,
              enemyPos: enemy.group.position.clone()
            });
          }

          // Ricochete (Plástico + Plástico) ou Perfuração (Vidro + Vidro)
          if (proj.ricochetLeft > 0) {
            proj.ricochetLeft -= 1;
            const nextTarget = this.findNearestEnemy(proj.mesh.position, proj.hitEnemyIds);
            if (nextTarget) {
              const newDir = new THREE.Vector3()
                .subVectors(nextTarget.group.position, proj.mesh.position)
                .setY(0)
                .normalize();
              proj.direction.copy(newDir);
            } else {
              proj.direction.x *= -1;
              proj.direction.z *= -1;
            }
          } else if (proj.pierceLeft > 0) {
            proj.pierceLeft -= 1;
          } else {
            removeProjectile = true;
          }

          break;
        }
      }

      if (removeProjectile) {
        this.scene.remove(proj.mesh);
        projectiles.splice(pi, 1);
      }
    }
  }

  findNearestEnemy(fromPos, excludeIds) {
    let best = null;
    let bestDist = Infinity;
    for (const e of this.enemies) {
      if (excludeIds.has(e.id)) continue;
      const d = fromPos.distanceTo(e.group.position);
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    return best;
  }

  reset() {
    for (const e of this.enemies) {
      this.scene.remove(e.group);
    }
    this.enemies = [];
    this.spawnTimer = 0.6;
  }
}
