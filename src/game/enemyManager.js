import * as THREE from 'three';
import {
  createEnemyTextures,
  createEnemyBinBadgeTexture
} from '../art/pixelTextures.js';
import {
  CONAMA_ELEMENTS,
  ELEMENT_ORDER,
  computeHitDamage,
  computeHitPoints
} from '../constants/recipes.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

let NEXT_ENEMY_ID = 1;

/**
 * E2-01, E2-05 e E3-05 — Gerenciador dos Inimigos Recicláveis (Garrafa PET, Caixa de Papelão, Garrafa de Vidro, Porca de Metal)
 * com suporte aos 4 Controles de Grupo do Hwei (Separar, Juntar, Slow+Frágil, Estunar) e Escudo Protetivo Seletivo
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
    this.binBadgeTextures = {};
    ELEMENT_ORDER.forEach((binId) => {
      this.binBadgeTextures[binId] = createEnemyBinBadgeTexture(CONAMA_ELEMENTS[binId]);
    });

    this.enemies = [];

    this.spawnTimer = 1.0;
    this.spawnInterval = 2.6;
    this.maxConcurrentEnemies = 9;
    this.difficultyMode = 'NORMAL';
    this.difficultySpeedMult = 1.0;
    this.difficultySpawnMult = 1.0;

    // Registra o callback de detonação de Controle de Grupo (Modo E) no ComboSystem
    this.comboSystem.onControlWaveDetonated = (centerPos, spell, multiplier, castStyleMeta) => {
      this.detonateControlWave(centerPos, spell, multiplier, castStyleMeta);
    };
  }

  /**
   * E2-05 — Instancia um Item Reciclável vivo nas bordas da arena (Garrafa PET, Papelão, Vidro ou Porca de Metal)
   */
  spawnEnemyAroundPerimeter(stage = 1, forcedCategory = null) {
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

    const binCategory =
      forcedCategory || ELEMENT_ORDER[Math.floor(Math.random() * ELEMENT_ORDER.length)];
    const binElem = CONAMA_ELEMENTS[binCategory];
    const texFrames = this.enemyTextureSets[binCategory];

    const group = new THREE.Group();
    group.position.set(sx, 0, sz);

    // Sprite 2.5D Pixel Art do Item Reciclável com cores 100% puras e vivas (sem lavar pela iluminação/neblina!)
    const spriteGeo = new THREE.PlaneGeometry(1.75, 1.95);
    const spriteMat = new THREE.MeshBasicMaterial({
      map: texFrames[0],
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });

    const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
    spriteMesh.position.y = 0.96;
    spriteMesh.rotation.y = Math.PI / 4;
    spriteMesh.castShadow = true;
    group.add(spriteMesh);

    // Anel escuro de contorno + Anel colorido vivo no chão na cor CONAMA exata da Lixeira correspondente!
    const darkShadowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.74, 20),
      new THREE.MeshBasicMaterial({
        color: 0x120d1a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
        fog: false
      })
    );
    darkShadowRing.rotation.x = -Math.PI / 2;
    darkShadowRing.position.y = 0.025;
    group.add(darkShadowRing);

    const shadowRing = new THREE.Mesh(
      new THREE.RingGeometry(0.43, 0.68, 20),
      new THREE.MeshBasicMaterial({
        color: binElem.hexNumber,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.96,
        toneMapped: false,
        fog: false
      })
    );
    shadowRing.rotation.x = -Math.PI / 2;
    shadowRing.position.y = 0.032;
    group.add(shadowRing);

    // Halo de Status (visível quando Estunado ou Desacelerado/Fragilizado)
    const statusRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 0.92, 16),
      new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
        toneMapped: false,
        fog: false
      })
    );
    statusRing.rotation.x = -Math.PI / 2;
    statusRing.position.y = 0.05;
    group.add(statusRing);

    // Barra de Vida (HP) + Etiqueta da Lixeira ([Q] GARRAFA PET, [F] PORCA DE METAL, etc.)
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, 2.08, 0);
    hpGroup.rotation.y = Math.PI / 4;

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.92, 0.4),
      new THREE.MeshBasicMaterial({
        map: this.binBadgeTextures[binCategory],
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
        fog: false
      })
    );
    badgeMesh.position.y = 0.34;

    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.22),
      new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false
      })
    );
    const hpFillGeo = new THREE.PlaneGeometry(1.32, 0.14);
    const hpFillMat = new THREE.MeshBasicMaterial({
      color: binElem.hexNumber,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });
    const hpFill = new THREE.Mesh(hpFillGeo, hpFillMat);
    hpFill.position.z = 0.01;

    hpGroup.add(badgeMesh, hpBg, hpFill);
    group.add(hpGroup);

    this.scene.add(group);

    // Atributos por tipo de item (ex: Porca de Metal tem mais vida, Garrafa PET é mais rápida)
    const hpModifier = binCategory === 'METAL' ? 1.2 : binCategory === 'PAPER' ? 0.9 : 1.0;
    const speedModifier = binCategory === 'PLASTIC' ? 1.14 : binCategory === 'METAL' ? 0.88 : 1.0;

    const maxHp = Math.round((130 + (stage - 1) * 15) * hpModifier);
    const baseSpeed =
      (3.05 + Math.random() * 0.7 + Math.min(1.4, (stage - 1) * 0.16)) * speedModifier;

    this.enemies.push({
      id: NEXT_ENEMY_ID++,
      binCategory,
      binElem,
      group,
      spriteMesh,
      spriteMat,
      statusRing,
      texFrames,
      hpFill,
      hpFillMat,
      hp: maxHp,
      maxHp,
      speed: baseSpeed,
      stunTimer: 0,
      slowTimer: 0,
      fragileTimer: 0,
      pullTimer: 0,
      pullTarget: new THREE.Vector3(),
      knockbackVel: new THREE.Vector3(0, 0, 0),
      animTimer: Math.random() * 2,
      hitFlashTimer: 0,
      shieldBlockCooldown: 0
    });
  }

  /**
   * E3-05 — Detona o Controle de Grupo (Modo E) na coordenada alvo:
   * - PLASTIC (Q -> E): SEPARAR (Empurra todos na área para longe)
   * - PAPER   (E -> E): JUNTAR (Puxa todos na área para o centro do vórtice)
   * - GLASS   (R -> E): LENTIDÃO + FRÁGIL (70% Slow + +35% dano recebido)
   * - METAL   (F -> E): ESTUNAR (Paralisa os itens no lugar por 2.8s)
   */
  detonateControlWave(centerPos, spell, multiplier, castStyleMeta = null) {
    const aoeRadius = spell.aoeRadius || 4.4;
    this.comboSystem.spawnAreaWave(centerPos, spell.colorA, aoeRadius);
    this.comboSystem.spawnImpactParticles(
      centerPos.clone().add(new THREE.Vector3(0, 0.6, 0)),
      spell.colorA,
      spell.colorB,
      22
    );

    let hitCount = 0;
    let matchingCount = 0;

    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const enemy = this.enemies[ei];
      const dist = Math.hypot(
        enemy.group.position.x - centerPos.x,
        enemy.group.position.z - centerPos.z
      );

      if (dist <= aoeRadius) {
        hitCount += 1;
        const isMatchingBin = enemy.binCategory === spell.binId;
        if (isMatchingBin) matchingCount += 1;

        // Aplica o Controle de Grupo específico da Lixeira!
        if (spell.ccType === 'separate') {
          // PLÁSTICO (Q + E): SEPARAR / EMPURRAR
          const awayFromPlayer = new THREE.Vector3()
            .subVectors(enemy.group.position, this.player.position)
            .setY(0);
          if (awayFromPlayer.lengthSq() < 0.01) {
            awayFromPlayer.set(1, 0, 1);
          }
          awayFromPlayer.normalize();
          enemy.knockbackVel.copy(awayFromPlayer.multiplyScalar(19.5));
          enemy.slowTimer = Math.max(enemy.slowTimer, 1.2);
        } else if (spell.ccType === 'gather') {
          // PAPEL (E + E): JUNTAR / AGRUPAR NO CENTRO DO VÓRTICE
          enemy.pullTarget.copy(centerPos);
          enemy.pullTimer = 1.15;
          enemy.slowTimer = Math.max(enemy.slowTimer, 1.8);
        } else if (spell.ccType === 'slow_fragile') {
          // VIDRO (R + E): LENTIDÃO (70%) + FRAGILIDADE (+35% Dano)
          enemy.slowTimer = Math.max(enemy.slowTimer, 4.0);
          enemy.fragileTimer = Math.max(enemy.fragileTimer, 4.5);
        } else if (spell.ccType === 'stun') {
          // METAL (F + E): ESTUNAR / PARALISAR
          enemy.stunTimer = Math.max(enemy.stunTimer, 2.8);
          enemy.knockbackVel.set(0, 0, 0);
        }

        // Dano leve de controle (maior se for o item da mesma lixeira)
        const damage = computeHitDamage(
          spell.baseDamage,
          multiplier,
          isMatchingBin ? true : 0.6,
          enemy.fragileTimer > 0
        );
        enemy.hp -= damage;
        enemy.hitFlashTimer = 0.16;
        this.updateEnemyHpBar(enemy);

        const ccTag =
          spell.ccType === 'separate'
            ? '↔ SEPARADO!'
            : spell.ccType === 'gather'
              ? '🌀 JUNTADO!'
              : spell.ccType === 'slow_fragile'
                ? '❄ LENTO + FRÁGIL!'
                : '⚡ ESTUNADO (2.8s)!';

        this.hud.spawnFloatingText(
          enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
          this.camera,
          this.viewportEl,
          `${ccTag} · -${damage} HP`,
          spell.primaryHex
        );

        if (enemy.hp <= 0) {
          this.handleDefeatEnemy(ei, enemy, spell.colorA, multiplier, true);
        }
      }
    }

    if (hitCount > 0) {
      this.sound.playEnemyHit(multiplier, false);
      this.comboSystem.registerOffensiveStyleHit();
      // Recompensa o uso tático de Controle de Grupo no Style Meter Devil May Cry com controle de variedade
      const repeat = castStyleMeta ? castStyleMeta.repeatCount : this.comboSystem.repeatCount;
      const recent = castStyleMeta ? castStyleMeta.recentCount : 0;
      const baseGain = Math.min(125, 65 + (hitCount - 1) * 20) + (matchingCount > 0 ? 20 : 0);
      let varietyFactor = 0.15;
      if (repeat === 0) {
        varietyFactor = recent === 0 ? 1.0 : recent === 1 ? 0.65 : 0.35;
      } else if (repeat === 1) {
        varietyFactor = 0.45;
      }
      const styleGain = Math.round(baseGain * varietyFactor);
      if (styleGain > 0) {
        this.comboSystem.addStylePoints(styleGain);
      }
    }
  }

  updateEnemyHpBar(enemy) {
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);
    enemy.hpFill.scale.x = Math.max(0.001, hpRatio);
    enemy.hpFill.position.x = -(1 - hpRatio) * 0.64;
  }

  handleDefeatEnemy(index, enemy, colorHex, multiplier, isMatchingBin) {
    this.comboSystem.spawnImpactParticles(
      enemy.group.position.clone().add(new THREE.Vector3(0, 0.9, 0)),
      0x00f5d4,
      colorHex,
      24
    );
    this.scene.remove(enemy.group);
    this.enemies.splice(index, 1);

    if (this.onEnemyKilled) {
      this.onEnemyKilled({
        points: computeHitPoints(multiplier, isMatchingBin),
        damage: 0,
        multiplier,
        defeated: true,
        enemyPos: enemy.group.position.clone()
      });
    }
  }

  setDifficulty(mode = 'NORMAL') {
    this.difficultyMode = mode;
    if (mode === 'CALM') {
      this.difficultySpeedMult = 0.72;
      this.difficultySpawnMult = 1.3;
    } else if (mode === 'INTENSE') {
      this.difficultySpeedMult = 1.28;
      this.difficultySpawnMult = 0.78;
    } else {
      this.difficultySpeedMult = 1.0;
      this.difficultySpawnMult = 1.0;
    }
  }

  update(elapsedTime, dt, stage) {
    // 1. Temporizador de Geração Periódica (Spawner — E2-01 / E2-05)
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemyAroundPerimeter(stage);
      const baseInterval = Math.max(1.4, this.spawnInterval - (stage - 1) * 0.1);
      this.spawnTimer = baseInterval * this.difficultySpawnMult;
    }

    const playerPos = this.player.position;
    const limit = ARENA_HALF_SIZE - 0.8;

    // 2. Atualização dos Inimigos-Itens na Arena
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Timers de Controle de Grupo (Stun, Slow, Fragile, Pull) e cooldown de bloqueio no escudo
      if (enemy.stunTimer > 0) {
        enemy.stunTimer = Math.max(0, enemy.stunTimer - dt);
      }
      if (enemy.slowTimer > 0) {
        enemy.slowTimer = Math.max(0, enemy.slowTimer - dt);
      }
      if (enemy.fragileTimer > 0) {
        enemy.fragileTimer = Math.max(0, enemy.fragileTimer - dt);
      }
      if (enemy.shieldBlockCooldown > 0) {
        enemy.shieldBlockCooldown = Math.max(0, enemy.shieldBlockCooldown - dt);
      }

      // Halo visual de Controle de Grupo sob o inimigo
      if (enemy.stunTimer > 0) {
        enemy.statusRing.material.color.setHex(0xffcc00);
        enemy.statusRing.material.opacity = 0.85;
      } else if (enemy.fragileTimer > 0 || enemy.slowTimer > 0) {
        enemy.statusRing.material.color.setHex(0x00f5d4);
        enemy.statusRing.material.opacity = 0.7;
      } else {
        enemy.statusRing.material.opacity = 0.0;
      }

      // Se não estiver estunado, anima o passo do item
      if (enemy.stunTimer <= 0) {
        enemy.animTimer += dt * (enemy.slowTimer > 0 ? 3.5 : 7.0);
      }
      const frameIdx = Math.floor(enemy.animTimer) % 2;
      enemy.spriteMat.map = enemy.texFrames[frameIdx];

      if (enemy.hitFlashTimer > 0) {
        enemy.hitFlashTimer -= dt;
        enemy.spriteMat.color.setHex(0xff9999);
      } else if (enemy.stunTimer > 0) {
        enemy.spriteMat.color.setHex(0xffee55);
      } else {
        enemy.spriteMat.color.setHex(0xffffff);
      }

      // Puxão de Vórtice (Papel [E] -> [E]: JUNTAR)
      if (enemy.pullTimer > 0) {
        enemy.pullTimer = Math.max(0, enemy.pullTimer - dt);
        const toVortex = new THREE.Vector3()
          .subVectors(enemy.pullTarget, enemy.group.position)
          .setY(0);
        if (toVortex.length() > 0.25) {
          toVortex.normalize();
          enemy.group.position.addScaledVector(toVortex, 11.5 * dt);
        }
      }

      // Vetor de perseguição em direção ao protagonista
      const toPlayer = new THREE.Vector3().subVectors(playerPos, enemy.group.position);
      toPlayer.y = 0;
      const distToPlayer = toPlayer.length();
      if (distToPlayer > 0.001) {
        toPlayer.normalize();
      }

      // Se estiver ESTUNADO (Metal F+E), velocidade = 0! Se estiver LENTO (Vidro R+E), velocidade = 30%!
      const speedFactor =
        enemy.stunTimer > 0 ? 0.0 : enemy.slowTimer > 0 ? 0.3 : 1.0;

      if (enemy.pullTimer <= 0) {
        enemy.group.position.addScaledVector(
          toPlayer,
          enemy.speed * this.difficultySpeedMult * speedFactor * dt
        );
      }

      // Aplica recuo/separação (Plástico Q+E ou Knockback)
      if (enemy.knockbackVel.lengthSq() > 0.05) {
        enemy.group.position.addScaledVector(enemy.knockbackVel, dt);
        enemy.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 6.5));
      }

      enemy.group.position.x = THREE.MathUtils.clamp(enemy.group.position.x, -limit, limit);
      enemy.group.position.z = THREE.MathUtils.clamp(enemy.group.position.z, -limit, limit);

      const screenRightDot = toPlayer.x * 0.7071 - toPlayer.z * 0.7071;
      enemy.spriteMesh.scale.x = screenRightDot < -0.05 ? -1 : 1;

      // Colisão Inimigo-Protagonista (Com Checagem do Escudo Protetivo Seletivo — Modo R!)
      if (distToPlayer < 1.15) {
        const activeShield = this.player.activeShieldBin;

        if (activeShield === enemy.binCategory) {
          // ==================== BLOQUEIO SELETIVO (ESCUDO DA LIXEIRA CERTA — 1 IMPACTO) ====================
          if (enemy.shieldBlockCooldown <= 0) {
            enemy.shieldBlockCooldown = 0.85;

            // Empurra imediatamente para fora do raio de colisão para impedir múltiplos gatilhos por frame
            const sepDir = distToPlayer > 0.001 ? toPlayer.clone().multiplyScalar(-1) : new THREE.Vector3(1, 0, 0);
            enemy.group.position.x = THREE.MathUtils.clamp(playerPos.x + sepDir.x * 1.45, -limit, limit);
            enemy.group.position.z = THREE.MathUtils.clamp(playerPos.z + sepDir.z * 1.45, -limit, limit);
            enemy.knockbackVel.copy(sepDir.multiplyScalar(15.5));

            const isParry = this.player.isShieldInParryWindow(0.55);
            enemy.stunTimer = Math.max(enemy.stunTimer, isParry ? 1.2 : 0.7);

            // Escudo consome 1 carga ao bloquear e inicia a recarga (evita invencibilidade infinita)
            this.player.clearShield(true);
            this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 0.45);

            this.sound.playComboReady(null, isParry ? 4.0 : 2.2);
            const { styleGain } = this.comboSystem.computeShieldBlockStyleGain({ isParry });
            if (styleGain > 0) {
              this.comboSystem.addStylePoints(styleGain);
            } else {
              this.comboSystem.syncHUD();
            }

            this.comboSystem.spawnImpactParticles(
              playerPos.clone().add(new THREE.Vector3(0, 1.1, 0)),
              enemy.binElem.hexNumber,
              isParry ? 0x00f5d4 : 0xffffff,
              isParry ? 20 : 12
            );

            const blockMsg =
              styleGain === 0
                ? '🛡 BLOQUEIO REPETIDO! ATAQUE PARA SUBIR RANK!'
                : isParry
                  ? `🛡 PARRY PERFEITO ${enemy.binElem.shortName.toUpperCase()}! (+${styleGain} ESTILO)`
                  : `🛡 BLOQUEIO ${enemy.binElem.shortName.toUpperCase()} (+${styleGain} ESTILO)`;
            const blockColor = styleGain === 0 ? '#ffd166' : isParry ? '#00f5d4' : '#98f5b1';

            this.hud.spawnFloatingText(
              playerPos.clone().add(new THREE.Vector3(0, 2.5, 0)),
              this.camera,
              this.viewportEl,
              blockMsg,
              blockColor
            );
          }
        } else if (activeShield) {
          // ==================== ESCUDO DE OUTRA LIXEIRA (QUEBRA, -8% PUREZA E PENALIDADE DE ESTILO) ====================
          const pushBack = toPlayer.clone().multiplyScalar(-13.0);
          enemy.knockbackVel.copy(pushBack);
          this.player.clearShield(true);
          if (this.player.invulnerableTimer <= 0) {
            this.player.invulnerableTimer = 0.75;
            this.sound.playPlayerHurt();
            this.comboSystem.addStylePoints(-90);
            this.hud.spawnFloatingText(
              playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)),
              this.camera,
              this.viewportEl,
              `🛡 ESCUDO ERRADO QUEBROU! (-8% PUREZA · USE [${enemy.binElem.keyAlt}]!)`,
              '#ffd166'
            );
            if (this.onPlayerTouch) {
              this.onPlayerTouch(8);
            }
          } else {
            this.comboSystem.syncHUD();
          }
        } else {
          // ==================== SEM ESCUDO (-15% PUREZA E QUEDA PESADA NO RANK DMC) ====================
          const pushBack = toPlayer.clone().multiplyScalar(-11.5);
          enemy.knockbackVel.copy(pushBack);

          if (this.player.invulnerableTimer <= 0) {
            this.player.invulnerableTimer = 0.85;
            this.sound.playPlayerHurt();
            this.comboSystem.addStylePoints(-280);
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
              `-15% PUREZA! (USE ESCUDO [${enemy.binElem.keyAlt}+R]!)`,
              '#ff3b30'
            );
            if (this.onPlayerTouch) {
              this.onPlayerTouch(15);
            }
          }
        }
      }
    }

    // 3. Colisão Projéteis vs Inimigos Recicláveis
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

        if (dist <= proj.radius + 0.7) {
          proj.hitEnemyIds.add(enemy.id);

          // Se for projétil de Controle de Grupo (Modo E), detona a Onda de Controle em área!
          if (proj.recipe.modeId === 'CONTROL') {
            this.detonateControlWave(
              enemy.group.position.clone(),
              proj.recipe,
              proj.multiplier,
              proj.castStyleMeta
            );
            removeProjectile = true;
            break;
          }

          // Modo Q (Mais Dano): Verifica se a Lixeira usada corresponde ao Item Reciclável!
          const isMatchingBin = proj.recipe.binId === enemy.binCategory;
          const wasControlled =
            enemy.stunTimer > 0 ||
            enemy.slowTimer > 0 ||
            enemy.fragileTimer > 0 ||
            enemy.pullTimer > 0;

          if (isMatchingBin) {
            // ACERTO NA LIXEIRA CERTA! Sobe o Style Meter Devil May Cry com régua exigente de variedade!
            this.comboSystem.registerOffensiveStyleHit();
            const meta = proj.castStyleMeta || {
              repeatCount: this.comboSystem.repeatCount,
              recentCount: 0,
              hitsScored: 0
            };
            const isSecondaryHit = meta.hitsScored > 0;
            meta.hitsScored += 1;
            const styleGain = this.comboSystem.computeDamageStyleGain({
              repeatCount: meta.repeatCount,
              recentCount: meta.recentCount,
              wasControlled,
              isSecondaryHit
            });
            if (styleGain > 0) {
              this.comboSystem.addStylePoints(styleGain);
            }
          } else {
            // ERROU A LIXEIRA DO ITEM! Derruba o Rank/Multiplicador e avisa qual lixeira usar!
            this.comboSystem.addStylePoints(-220);
          }

          const currentMultiplier = this.comboSystem.activeMultiplier;
          const currentRank = this.comboSystem.styleState.rank;
          const damage = computeHitDamage(
            proj.recipe.baseDamage,
            currentMultiplier,
            isMatchingBin,
            enemy.fragileTimer > 0
          );
          const points = computeHitPoints(currentMultiplier, isMatchingBin);

          enemy.hp -= damage;
          enemy.hitFlashTimer = 0.15;
          this.updateEnemyHpBar(enemy);

          const knockStrength =
            proj.recipe.behavior === 'damage_metal'
              ? 12.5
              : isMatchingBin
                ? 5.8
                : 2.0;
          enemy.knockbackVel.copy(proj.direction).multiplyScalar(knockStrength);

          this.comboSystem.spawnImpactParticles(
            enemy.group.position.clone().add(new THREE.Vector3(0, 1.0, 0)),
            proj.recipe.colorA,
            proj.recipe.colorB,
            isMatchingBin ? 18 : 7
          );

          if (isMatchingBin) {
            const comboTag = wasControlled ? 'COMBO HWEI!' : `RANK ${currentRank}`;
            this.hud.spawnFloatingText(
              enemy.group.position.clone().add(new THREE.Vector3(0, 2.1, 0)),
              this.camera,
              this.viewportEl,
              `✓ +${points} PTS [${comboTag} • ${currentMultiplier.toFixed(1)}x] · -${damage} HP`,
              this.comboSystem.styleState.color
            );
          } else {
            this.hud.spawnFloatingText(
              enemy.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
              this.camera,
              this.viewportEl,
              `✗ LIXEIRA ERRADA! ${enemy.binElem.enemyItemName.toUpperCase()} = [${enemy.binElem.keyAlt}] ${enemy.binElem.shortName.toUpperCase()}!`,
              '#ff4d6d'
            );
          }

          const defeated = enemy.hp <= 0;
          this.sound.playEnemyHit(currentMultiplier, defeated);

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
              multiplier: currentMultiplier,
              defeated,
              enemyPos: enemy.group.position.clone()
            });
          }

          // Ricochete (Plástico Q+Q) ou Perfuração (Vidro R+Q)
          if (proj.ricochetLeft > 0 && isMatchingBin) {
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
          } else if (proj.pierceLeft > 0 && isMatchingBin) {
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
