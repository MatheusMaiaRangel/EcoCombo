import * as THREE from 'three';
import {
  createEnemyTextures,
  createEnemyBinBadgeTexture
} from '../art/pixelTextures.js';
import {
  CONAMA_ELEMENTS,
  ENEMY_VARIANTS,
  ENEMY_VARIANT_LIST,
  STAGE_2_NEW_VARIANT_IDS,
  getUnlockedEnemyVariants,
  computeHitDamage,
  computeHitPoints
} from '../constants/recipes.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

let NEXT_ENEMY_ID = 1;

/**
 * E2-01, E2-05, E2-06 e E3-05 — Gerenciador dos Inimigos Recicláveis
 * Estágio 1: Garrafa PET, Caixa de Papelão, Garrafa de Vidro, Porca de Metal (1 por lixeira)
 * Estágio 2 (01:30+): acumula +1 novo inimigo por lixeira (Sacola Plástica, Jornal Velho, Pote de Vidro, Lata de Alumínio)
 * com suporte aos 4 Controles de Grupo do Hwei (Separar, Juntar, Slow+Frágil, Estunar) e Escudo Protetivo Seletivo
 */
export class EnemyManager {
  constructor({
    scene,
    player,
    comboSystem,
    hud,
    sound,
    camera,
    viewportEl,
    onPlayerTouch,
    onEnemyKilled,
    getArenaHalfSize,
    resolveObstacleCollision
  }) {
    this.scene = scene;
    this.player = player;
    this.comboSystem = comboSystem;
    this.hud = hud;
    this.sound = sound;
    this.camera = camera;
    this.viewportEl = viewportEl;
    this.onPlayerTouch = onPlayerTouch;
    this.onEnemyKilled = onEnemyKilled;
    this.getArenaHalfSize = getArenaHalfSize || (() => ARENA_HALF_SIZE);
    this.resolveObstacleCollision = resolveObstacleCollision || null;

    this.enemyTextureSets = createEnemyTextures();
    this.variantBadgeTextures = {};
    ENEMY_VARIANT_LIST.forEach((variant) => {
      this.variantBadgeTextures[variant.id] = createEnemyBinBadgeTexture(
        CONAMA_ELEMENTS[variant.binId],
        variant.name
      );
    });

    this.enemies = [];

    this.spawnTimer = 1.0;
    this.spawnInterval = 2.6;
    this.maxConcurrentEnemiesStage1 = 9;
    this.maxConcurrentEnemiesStage2 = 12;
    this.difficultyMode = 'NORMAL';
    this.difficultySpeedMult = 1.0;
    this.difficultySpawnMult = 1.0;
    this.autoSpawnEnabled = true;

    // Callbacks opcionais usados pelo Tutorial Interativo (E4-07)
    this.onControlHit = null;
    this.onShieldBlock = null;

    // Registra o callback de detonação de Controle de Grupo (Modo E) no ComboSystem
    this.comboSystem.onControlWaveDetonated = (centerPos, spell, multiplier, castStyleMeta) => {
      this.detonateControlWave(centerPos, spell, multiplier, castStyleMeta);
    };
  }

  setAutoSpawnEnabled(enabled) {
    this.autoSpawnEnabled = Boolean(enabled);
  }

  /**
   * E4-07 — Instancia um inimigo reciclável controlado em posição exata para o Tutorial Interativo
   */
  spawnTutorialEnemy({ variantId = 'PLASTIC_PET', x = 0, z = -5.5, speed = 0, hp = 85 } = {}) {
    const variant = ENEMY_VARIANTS[variantId] || ENEMY_VARIANTS.PLASTIC_PET;
    const binCategory = variant.binId;
    const binElem = CONAMA_ELEMENTS[binCategory];
    const texFrames = this.enemyTextureSets[variant.id] || this.enemyTextureSets[binCategory];
    const [spriteW, spriteH] = variant.spriteScale || [1.75, 1.95];

    const group = new THREE.Group();
    group.position.set(x, 0, z);
    if (this.resolveObstacleCollision) {
      this.resolveObstacleCollision(group.position, 0.72);
    }

    const spriteGeo = new THREE.PlaneGeometry(spriteW, spriteH);
    const spriteMat = new THREE.MeshBasicMaterial({
      map: texFrames[0],
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });
    const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
    spriteMesh.position.y = spriteH * 0.49;
    spriteMesh.rotation.y = Math.PI / 4;
    spriteMesh.castShadow = true;
    group.add(spriteMesh);

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

    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, 2.12, 0);
    hpGroup.rotation.y = Math.PI / 4;

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.12, 0.42),
      new THREE.MeshBasicMaterial({
        map: this.variantBadgeTextures[variant.id],
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
        fog: false
      })
    );
    badgeMesh.position.y = 0.35;

    const hpBg = new THREE.Mesh(
      new THREE.PlaneGeometry(1.42, 0.22),
      new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false
      })
    );
    const hpFill = new THREE.Mesh(
      new THREE.PlaneGeometry(1.32, 0.14),
      new THREE.MeshBasicMaterial({
        color: binElem.hexNumber,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false
      })
    );
    hpFill.position.z = 0.01;

    hpGroup.add(badgeMesh, hpBg, hpFill);
    group.add(hpGroup);
    this.scene.add(group);

    const enemy = {
      id: NEXT_ENEMY_ID++,
      variantId: variant.id,
      itemName: variant.name,
      movementStyle: 'direct',
      knockbackResist: variant.knockbackResist ?? 1.0,
      movePhase: 0,
      binCategory,
      binElem,
      group,
      spriteMesh,
      spriteMat,
      statusRing,
      texFrames,
      hpFill,
      hpFillMat: hpFill.material,
      hp,
      maxHp: hp,
      speed,
      stunTimer: 0,
      slowTimer: 0,
      fragileTimer: 0,
      pullTimer: 0,
      pullTarget: new THREE.Vector3(),
      knockbackVel: new THREE.Vector3(0, 0, 0),
      animTimer: 0,
      hitFlashTimer: 0,
      shieldBlockCooldown: 0
    };

    this.enemies.push(enemy);
    return enemy;
  }

  getMaxConcurrentEnemies(stage = 1) {
    return stage >= 2 ? this.maxConcurrentEnemiesStage2 : this.maxConcurrentEnemiesStage1;
  }

  /**
   * E2-06 — Ao entrar no Estágio 2 (01:30), introduz os 4 novos inimigos recicláveis nos 4 lados da praça expandida
   */
  triggerStage2ArrivalWave() {
    STAGE_2_NEW_VARIANT_IDS.forEach((variantId, idx) => {
      this.spawnEnemyAroundPerimeter(2, null, variantId, idx % 4, true);
    });
  }

  /**
   * E2-05 / E2-06 — Instancia um Item Reciclável vivo nas bordas da arena
   * No Estágio 1 escolhe entre os 4 itens base; no Estágio 2 acumula os 8 itens (2 por lixeira CONAMA)
   */
  spawnEnemyAroundPerimeter(
    stage = 1,
    forcedCategory = null,
    forcedVariantId = null,
    forcedSide = null,
    ignoreCap = false
  ) {
    if (!ignoreCap && this.enemies.length >= this.getMaxConcurrentEnemies(stage)) return;

    const borderDist = this.getArenaHalfSize() - 1.1;
    const side = forcedSide !== null ? forcedSide : Math.floor(Math.random() * 4);
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

    let variant = null;
    if (forcedVariantId && ENEMY_VARIANTS[forcedVariantId]) {
      variant = ENEMY_VARIANTS[forcedVariantId];
    } else {
      const unlockedPool = getUnlockedEnemyVariants(stage, forcedCategory);
      variant = unlockedPool[Math.floor(Math.random() * unlockedPool.length)] || ENEMY_VARIANTS.PLASTIC_PET;
    }

    const binCategory = variant.binId;
    const binElem = CONAMA_ELEMENTS[binCategory];
    const texFrames = this.enemyTextureSets[variant.id] || this.enemyTextureSets[binCategory];
    const [spriteW, spriteH] = variant.spriteScale || [1.75, 1.95];

    const group = new THREE.Group();
    group.position.set(sx, 0, sz);

    // Sprite 2.5D Pixel Art do Item Reciclável com cores 100% puras e vivas (sem lavar pela iluminação/neblina!)
    const spriteGeo = new THREE.PlaneGeometry(spriteW, spriteH);
    const spriteMat = new THREE.MeshBasicMaterial({
      map: texFrames[0],
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });

    const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
    spriteMesh.position.y = spriteH * 0.49;
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

    // Barra de Vida (HP) + Etiqueta da Lixeira ([Q] GARRAFA PET, [Q] SACOLA PLÁSTICA, [F] LATA DE ALUMÍNIO, etc.)
    const hpGroup = new THREE.Group();
    hpGroup.position.set(0, 2.12, 0);
    hpGroup.rotation.y = Math.PI / 4;

    const badgeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.12, 0.42),
      new THREE.MeshBasicMaterial({
        map: this.variantBadgeTextures[variant.id],
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
        fog: false
      })
    );
    badgeMesh.position.y = 0.35;

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

    // Atributos específicos por variante (Stage 1 + Stage 2)
    const maxHp = Math.round((130 + (stage - 1) * 20) * variant.hpModifier);
    const baseSpeed =
      (3.05 + Math.random() * 0.7 + Math.min(1.4, (stage - 1) * 0.24)) * variant.speedModifier;

    this.enemies.push({
      id: NEXT_ENEMY_ID++,
      variantId: variant.id,
      itemName: variant.name,
      movementStyle: variant.movementStyle || 'direct',
      knockbackResist: variant.knockbackResist ?? 1.0,
      movePhase: Math.random() * Math.PI * 2,
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
      const baseGain = Math.min(170, 90 + (hitCount - 1) * 25) + (matchingCount > 0 ? 25 : 0);
      let varietyFactor = 0.25;
      if (repeat === 0) {
        varietyFactor = recent === 0 ? 1.0 : recent === 1 ? 0.75 : 0.5;
      } else if (repeat === 1) {
        varietyFactor = 0.55;
      }
      const styleGain = Math.round(baseGain * varietyFactor);
      if (styleGain > 0) {
        this.comboSystem.addStylePoints(styleGain);
      }
    }

    if (this.onControlHit) {
      this.onControlHit({ spell, hitCount, matchingCount });
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
    // 1. Temporizador de Geração Periódica (Spawner — E2-01 / E2-05 / E2-06; desativado no Tutorial E4-07)
    if (this.autoSpawnEnabled) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnEnemyAroundPerimeter(stage);
        const baseInterval = stage >= 2 ? 2.15 : this.spawnInterval;
        this.spawnTimer = baseInterval * this.difficultySpawnMult;
      }
    }

    const playerPos = this.player.position;
    const limit = this.getArenaHalfSize() - 0.8;

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

      if (enemy.pullTimer <= 0 && speedFactor > 0) {
        let stepSpeed = enemy.speed * this.difficultySpeedMult * speedFactor;
        const moveDir = toPlayer.clone();

        if (enemy.movementStyle === 'zigzag' && distToPlayer > 1.8) {
          // Sacola Plástica: leve zigue-zague ao vento enquanto persegue o jogador
          const perp = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x);
          const sway = Math.sin(elapsedTime * 5.2 + enemy.movePhase) * 0.45;
          moveDir.addScaledVector(perp, sway).normalize();
        } else if (enemy.movementStyle === 'stride') {
          // Jornal Velho: avanço ritmado em pequenos impulsos como folhas ao vento
          const pulse = 0.78 + 0.44 * (0.5 + 0.5 * Math.sin(elapsedTime * 4.6 + enemy.movePhase));
          stepSpeed *= pulse;
        }

        enemy.group.position.addScaledVector(moveDir, stepSpeed * dt);
      }

      // Aplica recuo/separação (Plástico Q+E ou Knockback)
      if (enemy.knockbackVel.lengthSq() > 0.05) {
        enemy.group.position.addScaledVector(enemy.knockbackVel, dt);
        enemy.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 6.5));
      }

      // E1-03 — Bloqueio físico contra os obstáculos 3D da arena + contorno suave pela lateral
      if (this.resolveObstacleCollision) {
        const collision = this.resolveObstacleCollision(enemy.group.position, 0.56);
        if (collision.hit && enemy.stunTimer <= 0 && enemy.pullTimer <= 0) {
          // Deslize tangencial suave para o inimigo contornar o pilar/lixeira em direção ao jogador
          const tangentA = new THREE.Vector3(-collision.normalZ, 0, collision.normalX);
          const sideSign = tangentA.dot(toPlayer) >= 0 ? 1 : -1;
          const slideSpeed = enemy.speed * this.difficultySpeedMult * speedFactor * 0.72;
          enemy.group.position.addScaledVector(tangentA, sideSign * slideSpeed * dt);
          this.resolveObstacleCollision(enemy.group.position, 0.56);
        }
      }

      enemy.group.position.x = THREE.MathUtils.clamp(enemy.group.position.x, -limit, limit);
      enemy.group.position.z = THREE.MathUtils.clamp(enemy.group.position.z, -limit, limit);

      const screenRightDot = toPlayer.x * 0.7071 - toPlayer.z * 0.7071;
      enemy.spriteMesh.scale.x = screenRightDot < -0.05 ? -1 : 1;

      // Colisão Inimigo-Protagonista (Com Checagem do Escudo Protetivo Seletivo — Modo R, até 2 hits!)
      if (distToPlayer < 1.15) {
        const activeShield = this.player.activeShieldBin;

        if (activeShield === enemy.binCategory) {
          // ==================== BLOQUEIO SELETIVO (ESCUDO DA LIXEIRA CERTA — ATÉ 2 HITS) ====================
          if (enemy.shieldBlockCooldown <= 0 && this.player.shieldHitGrace <= 0) {
            enemy.shieldBlockCooldown = 0.85;

            // Empurra imediatamente para fora do raio de colisão para impedir múltiplos gatilhos por frame
            const sepDir = distToPlayer > 0.001 ? toPlayer.clone().multiplyScalar(-1) : new THREE.Vector3(1, 0, 0);
            enemy.group.position.x = THREE.MathUtils.clamp(playerPos.x + sepDir.x * 1.45, -limit, limit);
            enemy.group.position.z = THREE.MathUtils.clamp(playerPos.z + sepDir.z * 1.45, -limit, limit);
            enemy.knockbackVel.copy(sepDir.multiplyScalar(15.5));

            const isParry = this.player.isShieldInParryWindow(0.55);
            enemy.stunTimer = Math.max(enemy.stunTimer, isParry ? 1.2 : 0.7);

            // Escudo consome 1 das 2 cargas ao bloquear; ao zerar, quebra e inicia a recarga
            const remainingCharges = this.player.consumeShieldCharge(1);
            this.player.invulnerableTimer = Math.max(
              this.player.invulnerableTimer,
              remainingCharges === 0 ? 0.45 : 0.25
            );

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

            const chargeSuffix = remainingCharges > 0 ? ` · ${remainingCharges} HIT RESTANTE` : ' · ESCUDO QUEBROU!';
            const blockMsg =
              styleGain === 0
                ? `🛡 BLOQUEIO REPETIDO! ATAQUE PARA SUBIR RANK!${chargeSuffix}`
                : isParry
                  ? `🛡 PARRY PERFEITO ${enemy.binElem.shortName.toUpperCase()}! (+${styleGain} ESTILO${chargeSuffix})`
                  : `🛡 BLOQUEIO ${enemy.binElem.shortName.toUpperCase()} (+${styleGain} ESTILO${chargeSuffix})`;
            const blockColor = styleGain === 0 ? '#ffd166' : isParry ? '#00f5d4' : '#98f5b1';

            this.hud.spawnFloatingText(
              playerPos.clone().add(new THREE.Vector3(0, 2.5, 0)),
              this.camera,
              this.viewportEl,
              blockMsg,
              blockColor
            );

            if (this.onShieldBlock) {
              this.onShieldBlock({ enemy, isParry });
            }
          }
        } else if (activeShield) {
          // ==================== ESCUDO DE OUTRA LIXEIRA (CONSOME 1 CARGA, -8% PUREZA E -75 ESTILO) ====================
          const pushBack = toPlayer.clone().multiplyScalar(-13.0);
          enemy.knockbackVel.copy(pushBack);
          if (this.player.invulnerableTimer <= 0 && this.player.shieldHitGrace <= 0) {
            const remainingCharges = this.player.consumeShieldCharge(1);
            this.player.invulnerableTimer = 0.75;
            this.sound.playPlayerHurt();
            this.comboSystem.addStylePoints(-65);
            const shieldMsg =
              remainingCharges > 0
                ? `🛡 ESCUDO ERRADO (-8% PUREZA · ${remainingCharges} HIT RESTANTE · USE [${enemy.binElem.keyAlt}]!)`
                : `🛡 ESCUDO ERRADO QUEBROU! (-8% PUREZA · USE [${enemy.binElem.keyAlt}]!)`;
            this.hud.spawnFloatingText(
              playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)),
              this.camera,
              this.viewportEl,
              shieldMsg,
              '#ffd166'
            );
            if (this.onPlayerTouch) {
              this.onPlayerTouch(8);
            }
          }
        } else {
          // ==================== SEM ESCUDO (-15% PUREZA E QUEDA NO RANK DMC) ====================
          const pushBack = toPlayer.clone().multiplyScalar(-11.5);
          enemy.knockbackVel.copy(pushBack);

          if (this.player.invulnerableTimer <= 0) {
            this.player.invulnerableTimer = 0.85;
            this.sound.playPlayerHurt();
            this.comboSystem.addStylePoints(-210);
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
            this.comboSystem.addStylePoints(-160);
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
            (proj.recipe.behavior === 'damage_metal'
              ? 12.5
              : isMatchingBin
                ? 5.8
                : 2.0) * (enemy.knockbackResist ?? 1.0);
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
              `✗ LIXEIRA ERRADA! ${enemy.itemName.toUpperCase()} = [${enemy.binElem.keyAlt}] ${enemy.binElem.shortName.toUpperCase()}!`,
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
