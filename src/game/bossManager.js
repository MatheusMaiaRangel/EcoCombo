import * as THREE from 'three';
import { createBossColossusTextures } from '../art/pixelTextures.js';
import { computeHitDamage, computeHitPoints } from '../constants/recipes.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

/**
 * E5-01 — Gerenciador do Chefão "Colosso de Entulho"
 * Surge ao final de cada ciclo de 3 ondas (Estágio 3+), persegue o protagonista,
 * executa ataques de alcance médio (rajada de entulho) e exibe barra de HP destacada no HUD.
 */
export class BossManager {
  constructor({
    scene,
    player,
    comboSystem,
    hud,
    sound,
    camera,
    viewportEl,
    getArenaHalfSize,
    resolveObstacleCollision,
    onPlayerHit,
    onBossHit,
    onBossDefeated
  }) {
    this.scene = scene;
    this.player = player;
    this.comboSystem = comboSystem;
    this.hud = hud;
    this.sound = sound;
    this.camera = camera;
    this.viewportEl = viewportEl;
    this.getArenaHalfSize = getArenaHalfSize || (() => ARENA_HALF_SIZE);
    this.resolveObstacleCollision = resolveObstacleCollision || null;
    this.onPlayerHit = onPlayerHit || null;
    this.onBossHit = onBossHit || null;
    this.onBossDefeated = onBossDefeated || null;

    this.bossTextures = createBossColossusTextures();
    this.boss = null;
    this.bossProjectiles = [];
    this.difficultySpeedMult = 1.0;
  }

  setDifficulty(mode = 'NORMAL') {
    if (mode === 'CALM') {
      this.difficultySpeedMult = 0.78;
    } else if (mode === 'INTENSE') {
      this.difficultySpeedMult = 1.22;
    } else {
      this.difficultySpeedMult = 1.0;
    }
  }

  isActive() {
    return Boolean(this.boss);
  }

  /**
   * E5-01 — Instancia o Chefão Colosso de Entulho na borda norte da arena
   */
  spawnColossus({ stage = 3, bossTier = 1 } = {}) {
    if (this.boss) return this.boss;

    const halfSize = this.getArenaHalfSize();
    const spawnPos = new THREE.Vector3(0, 0, -(halfSize - 2.6));

    const group = new THREE.Group();
    group.position.copy(spawnPos);

    // Sprite 2.5D Gigante em Pixel Art (4.5 x 4.8)
    const spriteGeo = new THREE.PlaneGeometry(4.5, 4.8);
    const spriteMat = new THREE.MeshBasicMaterial({
      map: this.bossTextures[0],
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });
    const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
    spriteMesh.position.y = 2.38;
    spriteMesh.rotation.y = Math.PI / 4;
    spriteMesh.castShadow = true;
    group.add(spriteMesh);

    // Anel escuro + Anel violeta pulsante na base do Colosso
    const baseDarkRing = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 2.05, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0f081a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        toneMapped: false,
        fog: false
      })
    );
    baseDarkRing.rotation.x = -Math.PI / 2;
    baseDarkRing.position.y = 0.03;
    group.add(baseDarkRing);

    const auraRingMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      toneMapped: false,
      fog: false
    });
    const auraRing = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.08, 32), auraRingMat);
    auraRing.rotation.x = -Math.PI / 2;
    auraRing.position.y = 0.045;
    group.add(auraRing);

    // Anel de aviso de ataque de alcance médio (pulsa antes de disparar projéteis de entulho)
    const telegraphMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      toneMapped: false,
      fog: false
    });
    const telegraphRing = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.55, 32), telegraphMat);
    telegraphRing.rotation.x = -Math.PI / 2;
    telegraphRing.position.y = 0.06;
    group.add(telegraphRing);

    // Fragmentos de lixo das 4 cores CONAMA orbitando o Colosso
    const debrisOrbit = new THREE.Group();
    debrisOrbit.position.y = 2.1;
    const conamaHexes = [0xff3b30, 0x007aff, 0x34c759, 0xffcc00];
    const debrisChunks = conamaHexes.map((hex, idx) => {
      const chunk = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.32, 0),
        new THREE.MeshStandardMaterial({
          color: hex,
          emissive: hex,
          emissiveIntensity: 0.35,
          roughness: 0.45,
          metalness: 0.25,
          toneMapped: false
        })
      );
      const ang = (idx * Math.PI) / 2;
      chunk.position.set(Math.cos(ang) * 2.15, (idx % 2 === 0 ? 0.35 : -0.25), Math.sin(ang) * 2.15);
      debrisOrbit.add(chunk);
      return chunk;
    });
    group.add(debrisOrbit);

    // E5-02 — Escudo 3D de Entulho Compactado (exige combos variados M >= 2.5x para quebrar!)
    const shieldGroup = new THREE.Group();
    shieldGroup.position.y = 2.2;
    const shieldWireMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.78,
      toneMapped: false,
      fog: false
    });
    const shieldWire = new THREE.Mesh(new THREE.IcosahedronGeometry(2.35, 1), shieldWireMat);
    const shieldShellMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });
    const shieldShell = new THREE.Mesh(new THREE.IcosahedronGeometry(2.26, 1), shieldShellMat);
    shieldGroup.add(shieldWire, shieldShell);
    group.add(shieldGroup);

    // Luz roxa dramática acompanhando o Chefão
    const bossLight = new THREE.PointLight(0xc084fc, 2.2, 11);
    bossLight.position.set(0, 2.8, 0);
    group.add(bossLight);

    this.scene.add(group);

    const maxHp = Math.round(1850 * (1 + (bossTier - 1) * 0.38));
    const shieldMaxHp = Math.round(620 * (1 + (bossTier - 1) * 0.35));
    const speed = 2.75 + Math.min(0.8, (bossTier - 1) * 0.22);

    this.boss = {
      id: `BOSS_COLOSSUS_${bossTier}`,
      name: bossTier > 1 ? `COLOSSO DE ENTULHO MK.${bossTier}` : 'COLOSSO DE ENTULHO',
      stage,
      bossTier,
      group,
      spriteMesh,
      spriteMat,
      auraRing,
      auraRingMat,
      telegraphRing,
      telegraphMat,
      debrisOrbit,
      debrisChunks,
      shieldGroup,
      shieldWireMat,
      shieldShellMat,
      bossLight,
      hp: maxHp,
      maxHp,
      shieldHp: shieldMaxHp,
      shieldMaxHp,
      shieldActive: true,
      shieldDeflectFlash: 0,
      radius: 1.85,
      speed,
      animTimer: 0,
      hitFlashTimer: 0,
      stunTimer: 0,
      slowTimer: 0,
      fragileTimer: 0,
      knockbackVel: new THREE.Vector3(),
      rangedAttackCooldown: 2.8,
      telegraphTimer: 0,
      pendingAttackDir: new THREE.Vector3(0, 0, 1)
    };

    // Onda dramática e som de entrada do Chefão
    this.comboSystem.spawnAreaWave(spawnPos.clone(), 0xa855f7, 7.5);
    this.comboSystem.spawnImpactParticles(
      spawnPos.clone().add(new THREE.Vector3(0, 2.0, 0)),
      0xa855f7,
      0xa3e635,
      34,
      1.35
    );
    if (this.sound && typeof this.sound.playBossSpawn === 'function') {
      this.sound.playBossSpawn();
    }
    this.syncBossHUD();

    if (this.viewportEl && this.camera) {
      this.hud.spawnFloatingText(
        spawnPos.clone().add(new THREE.Vector3(0, 4.4, 0)),
        this.camera,
        this.viewportEl,
        `👑 ${this.boss.name} SURGIU!`,
        '#d8b4fe'
      );
    }

    return this.boss;
  }

  syncBossHUD() {
    if (!this.boss) {
      this.hud.hideBossHUD();
      return;
    }
    this.hud.updateBossHUD({
      name: this.boss.name,
      stage: this.boss.stage,
      hp: this.boss.hp,
      maxHp: this.boss.maxHp,
      shieldHp: this.boss.shieldHp,
      shieldMaxHp: this.boss.shieldMaxHp,
      shieldActive: this.boss.shieldActive,
      subtitle: this.boss.shieldActive
        ? '🛡 ESCUDO ATIVO: USE COMBOS VARIADOS (M ≥ 2.5x / RANK A+)! REPETIDOS PERDEM 80% DE DANO!'
        : '💥 ESCUDO QUEBRADO! ATINGE O NÚCLEO DO COLOSSO COM DANO TOTAL!'
    });
  }

  /**
   * Dispara uma rajada de 3 esferas de entulho de alcance médio em direção ao jogador
   */
  fireMidRangeDebrisVolley(origin, baseDir) {
    if (this.sound && typeof this.sound.playBossAttack === 'function') {
      this.sound.playBossAttack();
    }
    this.comboSystem.spawnAreaWave(origin.clone().setY(0), 0xd946ef, 3.2);

    const angles = [-0.26, 0, 0.26];
    angles.forEach((ang) => {
      const dir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang).normalize();
      const mesh = new THREE.Group();
      const core = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42, 0),
        new THREE.MeshBasicMaterial({
          color: 0xa3e635,
          toneMapped: false,
          fog: false
        })
      );
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.54, 0.07, 8, 16),
        new THREE.MeshBasicMaterial({
          color: 0xc084fc,
          toneMapped: false,
          fog: false
        })
      );
      ring.rotation.x = Math.PI / 2;
      mesh.add(core, ring);
      mesh.position.set(origin.x + dir.x * 1.6, 1.15, origin.z + dir.z * 1.6);
      this.scene.add(mesh);

      this.bossProjectiles.push({
        mesh,
        direction: dir,
        speed: 10.8 * this.difficultySpeedMult,
        radius: 0.52,
        life: 1.55, // Alcance médio (~15-16 unidades)
        trailTimer: 0
      });
    });
  }

  /**
   * Recebe ondas de Controle de Grupo (Modo E) disparadas pelo jogador
   */
  handleControlWave(centerPos, spell, multiplier, castStyleMeta = null) {
    if (!this.boss) return false;
    const aoeRadius = (spell.aoeRadius || 4.4) + this.boss.radius * 0.7;
    const dist = Math.hypot(
      this.boss.group.position.x - centerPos.x,
      this.boss.group.position.z - centerPos.z
    );
    if (dist > aoeRadius) return false;

    if (spell.ccType === 'slow_fragile') {
      this.boss.slowTimer = Math.max(this.boss.slowTimer, 3.0);
      this.boss.fragileTimer = Math.max(this.boss.fragileTimer, 3.5);
    } else if (spell.ccType === 'stun') {
      this.boss.stunTimer = Math.max(this.boss.stunTimer, 1.1);
    } else if (spell.ccType === 'separate') {
      const away = new THREE.Vector3()
        .subVectors(this.boss.group.position, this.player.position)
        .setY(0);
      if (away.lengthSq() > 0.01) {
        away.normalize();
        this.boss.knockbackVel.copy(away.multiplyScalar(6.5));
      }
    }

    const damage = computeHitDamage(
      spell.baseDamage,
      multiplier,
      true,
      this.boss.fragileTimer > 0
    );
    const points = computeHitPoints(multiplier, true);
    this.applyDamageToBoss(damage, points, multiplier, spell, castStyleMeta, true);
    return true;
  }

  applyDamageToBoss(damage, points, multiplier, spell, castStyleMeta = null, isControl = false) {
    if (!this.boss) return;

    const b = this.boss;
    const repeatCount = castStyleMeta ? castStyleMeta.repeatCount : this.comboSystem.repeatCount;

    // E5-02 — Escudo do Chefão exige combos variados (M >= 2.5x)!
    // Repetidos ou em 1.0x sofrem redução de 80% no dano com aviso "VARIE O COMBO!".
    if (b.shieldActive && b.shieldHp > 0) {
      const isRepeatedOrOneX = multiplier <= 1.0 || repeatCount >= 2;
      const isHighVariety = multiplier >= 2.5 && !isRepeatedOrOneX;

      let shieldDamage = damage;
      let earnedPoints = points;
      let msg = '';
      let msgColor = '#38bdf8';

      if (isHighVariety) {
        // M >= 2.5x (Rank A / S / SS / SSS): dano TOTAL no escudo!
        shieldDamage = damage;
        msg = `💥 ESCUDO DO COLOSSO -${shieldDamage} (${multiplier.toFixed(1)}x DANO TOTAL!)`;
        msgColor = '#00f5d4';
        this.sound.playEnemyHit(multiplier, false, spell ? spell.binId : null, true);
        this.comboSystem.spawnImpactParticles(
          b.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
          0x00f5d4,
          spell ? spell.colorA : 0x38bdf8,
          multiplier >= 4.0 ? 32 : 20,
          1.25
        );
      } else if (isRepeatedOrOneX) {
        // Combo repetido / 1.0x: dano reduzido em 80% com aviso explícito "VARIE O COMBO!"
        shieldDamage = Math.max(1, Math.round(damage * 0.2));
        earnedPoints = Math.round(points * 0.2);
        b.shieldDeflectFlash = 0.35;
        msg = `🛡 VARIE O COMBO! (-80% DANO · EXIGE M ≥ 2.5x) · -${shieldDamage}`;
        msgColor = '#ff4d6d';
        if (typeof this.sound.playArmorDeflect === 'function') {
          this.sound.playArmorDeflect();
        }
        this.comboSystem.spawnImpactParticles(
          b.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
          0xa855f7,
          0xff4d6d,
          8,
          0.75
        );
      } else {
        // Combo fresco em 1.5x–2.0x (subindo para Rank A): dano parcial enquanto carrega estilo
        shieldDamage = Math.max(1, Math.round(damage * 0.45));
        earnedPoints = Math.round(points * 0.6);
        b.shieldDeflectFlash = 0.2;
        msg = `🛡 ESCUDO RESISTIU! SUBA PARA M ≥ 2.5x (RANK A+) · -${shieldDamage}`;
        msgColor = '#ffd166';
        if (typeof this.sound.playArmorDeflect === 'function') {
          this.sound.playArmorDeflect();
        }
        this.comboSystem.spawnImpactParticles(
          b.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
          0x38bdf8,
          0xffd166,
          12,
          0.9
        );
      }

      b.shieldHp = Math.max(0, b.shieldHp - shieldDamage);
      b.hitFlashTimer = 0.12;

      if (b.shieldHp <= 0) {
        // QUEBRA DO ESCUDO DO COLOSSO!
        b.shieldActive = false;
        if (b.shieldGroup) {
          b.shieldGroup.visible = false;
        }
        b.stunTimer = Math.max(b.stunTimer, 2.2);
        this.comboSystem.spawnAreaWave(b.group.position.clone(), 0x00f5d4, 8.5);
        this.comboSystem.spawnImpactParticles(
          b.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
          0x38bdf8,
          0xffd166,
          42,
          1.45
        );
        if (typeof this.sound.playArmorBreak === 'function') {
          this.sound.playArmorBreak();
        }
        this.comboSystem.addStylePoints(160);
        msg = '💥 ESCUDO DO COLOSSO QUEBRADO! ATORDOADO + DANO TOTAL!';
        msgColor = '#ffd166';
      }

      this.syncBossHUD();

      if (this.viewportEl && this.camera) {
        this.hud.spawnFloatingText(
          b.group.position.clone().add(new THREE.Vector3(0, 4.4, 0)),
          this.camera,
          this.viewportEl,
          msg,
          msgColor
        );
      }

      if (this.onBossHit) {
        this.onBossHit({ points: earnedPoints, damage: shieldDamage, multiplier, defeated: false });
      }
      return;
    }

    // Escudo já quebrado: dano direto na vida principal do Colosso!
    b.hp = Math.max(0, b.hp - damage);
    b.hitFlashTimer = 0.16;
    this.syncBossHUD();

    this.comboSystem.spawnImpactParticles(
      b.group.position.clone().add(new THREE.Vector3(0, 2.2, 0)),
      spell ? spell.colorA : 0x00f5d4,
      multiplier >= 4.0 ? 0xffd166 : spell ? spell.colorB : 0xffffff,
      multiplier >= 4.0 ? 32 : 18,
      multiplier >= 4.0 ? 1.3 : 1.0
    );

    const defeated = b.hp <= 0;
    this.sound.playEnemyHit(multiplier, defeated, spell ? spell.binId : null, true);

    if (this.viewportEl && this.camera) {
      this.hud.spawnFloatingText(
        b.group.position.clone().add(new THREE.Vector3(0, 4.3, 0)),
        this.camera,
        this.viewportEl,
        `${isControl ? '✦ CONTROLE' : '💥 COLOSSO'} · -${damage} HP (${multiplier.toFixed(1)}x)`,
        this.comboSystem.styleState.color
      );
    }

    if (this.onBossHit) {
      this.onBossHit({ points, damage, multiplier, defeated });
    }

    if (defeated) {
      this.handleBossDefeat();
    }
  }

  handleBossDefeat() {
    if (!this.boss) return;
    const defeatedBoss = this.boss;
    const pos = defeatedBoss.group.position.clone();

    this.comboSystem.spawnAreaWave(pos, 0x00f5d4, 11.5);
    this.comboSystem.spawnImpactParticles(pos.clone().add(new THREE.Vector3(0, 2.2, 0)), 0x00f5d4, 0xffd166, 48, 1.5);

    this.scene.remove(defeatedBoss.group);
    this.boss = null;
    this.clearBossProjectiles();
    this.hud.hideBossHUD();

    if (this.onBossDefeated) {
      this.onBossDefeated({
        bossName: defeatedBoss.name,
        bossTier: defeatedBoss.bossTier,
        stage: defeatedBoss.stage,
        position: pos
      });
    }
  }

  update(elapsedTime, dt) {
    this.updateBossProjectiles(dt);

    if (!this.boss) return;

    const b = this.boss;
    const playerPos = this.player.position;
    const limit = this.getArenaHalfSize() - 1.6;

    if (b.stunTimer > 0) b.stunTimer = Math.max(0, b.stunTimer - dt);
    if (b.slowTimer > 0) b.slowTimer = Math.max(0, b.slowTimer - dt);
    if (b.fragileTimer > 0) b.fragileTimer = Math.max(0, b.fragileTimer - dt);
    if (b.shieldDeflectFlash > 0) b.shieldDeflectFlash = Math.max(0, b.shieldDeflectFlash - dt);

    // E5-02 — Anima o Escudo 3D de Entulho enquanto ativo
    if (b.shieldActive && b.shieldGroup) {
      b.shieldGroup.rotation.y += dt * 1.15;
      b.shieldGroup.rotation.x += dt * 0.55;
      const pulse = 1.0 + Math.sin(elapsedTime * 4.2) * 0.04;
      b.shieldGroup.scale.setScalar(pulse);
      if (b.shieldDeflectFlash > 0) {
        b.shieldWireMat.color.setHex(0xff4d6d);
        b.shieldShellMat.color.setHex(0xff3b30);
        b.shieldShellMat.opacity = 0.34;
      } else {
        b.shieldWireMat.color.setHex(0x38bdf8);
        b.shieldShellMat.color.setHex(0xa855f7);
        b.shieldShellMat.opacity = 0.16;
      }
    }

    // Animação dos detritos orbitando e do sprite 2.5D
    b.debrisOrbit.rotation.y += dt * 1.4;
    b.debrisChunks.forEach((chunk, idx) => {
      chunk.rotation.x += dt * 1.6;
      chunk.rotation.z += dt * 1.2;
      chunk.position.y = Math.sin(elapsedTime * 3.0 + idx * 1.5) * 0.45;
    });

    if (b.stunTimer <= 0) {
      b.animTimer += dt * (b.slowTimer > 0 ? 2.4 : 4.6);
    }
    b.spriteMat.map = this.bossTextures[Math.floor(b.animTimer) % 2];

    if (b.hitFlashTimer > 0) {
      b.hitFlashTimer -= dt;
      b.spriteMat.color.setHex(0xffaaaa);
    } else if (b.stunTimer > 0) {
      b.spriteMat.color.setHex(0xffee55);
    } else if (b.telegraphTimer > 0) {
      b.spriteMat.color.setHex(0xf0abfc);
    } else {
      b.spriteMat.color.setHex(0xffffff);
    }

    const toPlayer = new THREE.Vector3().subVectors(playerPos, b.group.position).setY(0);
    const distToPlayer = toPlayer.length();
    if (distToPlayer > 0.001) {
      toPlayer.normalize();
    }

    // Espelha o sprite do Colosso na direção do protagonista
    const screenRightDot = toPlayer.x * 0.7071 - toPlayer.z * 0.7071;
    b.spriteMesh.scale.x = screenRightDot < -0.05 ? -1 : 1;

    // 1. Ataque de alcance médio (Rajada de Entulho com telégrafo visual de 0.65s)
    if (b.telegraphTimer > 0) {
      b.telegraphTimer -= dt;
      b.telegraphMat.opacity = 0.55 + Math.sin(elapsedTime * 28) * 0.35;
      b.telegraphRing.scale.setScalar(1.0 + (0.65 - Math.max(0, b.telegraphTimer)) * 0.55);
      if (b.telegraphTimer <= 0) {
        b.telegraphMat.opacity = 0.0;
        b.telegraphRing.scale.setScalar(1.0);
        this.fireMidRangeDebrisVolley(b.group.position.clone(), b.pendingAttackDir);
        b.rangedAttackCooldown = Math.max(2.6, 4.1 - (b.bossTier - 1) * 0.35);
      }
    } else if (b.stunTimer <= 0) {
      b.rangedAttackCooldown -= dt;
      if (b.rangedAttackCooldown <= 0 && distToPlayer <= 15.5 && distToPlayer >= 3.2) {
        b.telegraphTimer = 0.65;
        b.pendingAttackDir.copy(toPlayer);
      }
    }

    // 2. Perseguição pesada pela arena isométrica (desacelera brevemente durante o telégrafo)
    const speedFactor =
      b.stunTimer > 0 ? 0.0 : b.telegraphTimer > 0 ? 0.25 : b.slowTimer > 0 ? 0.45 : 1.0;
    if (speedFactor > 0) {
      b.group.position.addScaledVector(
        toPlayer,
        b.speed * this.difficultySpeedMult * speedFactor * dt
      );
    }

    if (b.knockbackVel.lengthSq() > 0.05) {
      b.group.position.addScaledVector(b.knockbackVel, dt);
      b.knockbackVel.multiplyScalar(Math.max(0, 1 - dt * 6.0));
    }

    if (this.resolveObstacleCollision) {
      const col = this.resolveObstacleCollision(b.group.position, 1.35);
      if (col.hit && b.stunTimer <= 0) {
        const tangent = new THREE.Vector3(-col.normalZ, 0, col.normalX);
        const sign = tangent.dot(toPlayer) >= 0 ? 1 : -1;
        b.group.position.addScaledVector(
          tangent,
          sign * b.speed * this.difficultySpeedMult * speedFactor * 0.75 * dt
        );
        this.resolveObstacleCollision(b.group.position, 1.35);
      }
    }

    b.group.position.x = THREE.MathUtils.clamp(b.group.position.x, -limit, limit);
    b.group.position.z = THREE.MathUtils.clamp(b.group.position.z, -limit, limit);

    // 3. Contato físico com o Colosso (-20% Pureza ou bloqueado com qualquer Escudo Seletivo [R])
    if (distToPlayer < b.radius + 0.65 && this.player.invulnerableTimer <= 0) {
      if (this.player.activeShieldBin && this.player.shieldHitGrace <= 0) {
        const remainingCharges = this.player.consumeShieldCharge(1);
        this.player.invulnerableTimer = 0.7;
        const pushBack = toPlayer.clone().multiplyScalar(-9.5);
        b.knockbackVel.copy(pushBack);
        this.sound.playComboReady(null, 3.2);
        this.hud.spawnFloatingText(
          playerPos.clone().add(new THREE.Vector3(0, 2.5, 0)),
          this.camera,
          this.viewportEl,
          `🛡 IMPACTO DO COLOSSO BLOQUEADO!${remainingCharges > 0 ? ` (${remainingCharges} HIT)` : ''}`,
          '#00f5d4'
        );
      } else {
        this.player.invulnerableTimer = 1.0;
        this.sound.playPlayerHurt();
        this.comboSystem.addStylePoints(-240);
        this.hud.spawnFloatingText(
          playerPos.clone().add(new THREE.Vector3(0, 2.4, 0)),
          this.camera,
          this.viewportEl,
          '-20% PUREZA! (IMPACTO DO COLOSSO!)',
          '#ff3b30'
        );
        if (this.onPlayerHit) {
          this.onPlayerHit(20);
        }
      }
    }

    // 4. Colisão Projéteis do Jogador vs Chefão Colosso de Entulho
    const projectiles = this.comboSystem.projectiles;
    for (let pi = projectiles.length - 1; pi >= 0; pi--) {
      if (!this.boss) break;
      const proj = projectiles[pi];
      if (proj.hitEnemyIds.has(b.id)) continue;

      const dx = proj.mesh.position.x - b.group.position.x;
      const dz = proj.mesh.position.z - b.group.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= proj.radius + b.radius) {
        proj.hitEnemyIds.add(b.id);

        if (proj.recipe.modeId === 'CONTROL') {
          this.comboSystem.spawnAreaWave(
            proj.mesh.position.clone(),
            proj.recipe.colorA,
            proj.recipe.aoeRadius || 4.4
          );
          this.handleControlWave(
            proj.mesh.position.clone(),
            proj.recipe,
            proj.multiplier,
            proj.castStyleMeta
          );
          this.scene.remove(proj.mesh);
          projectiles.splice(pi, 1);
          continue;
        }

        // Todas as 4 lixeiras CONAMA funcionam contra o Colosso (ele reúne os 4 materiais!)
        const meta = proj.castStyleMeta || {
          repeatCount: this.comboSystem.repeatCount,
          recentCount: 0,
          hitsScored: 0,
          primaryHitResolved: false,
          primaryMatchedBin: null
        };
        const isFirstHitOfCast = !meta.primaryHitResolved;
        if (isFirstHitOfCast) {
          meta.primaryHitResolved = true;
          meta.primaryMatchedBin = true;
          this.comboSystem.registerOffensiveStyleHit();
          meta.hitsScored += 1;
          const styleGain = this.comboSystem.computeDamageStyleGain({
            repeatCount: meta.repeatCount,
            recentCount: meta.recentCount,
            wasControlled: b.stunTimer > 0 || b.slowTimer > 0 || b.fragileTimer > 0,
            isSecondaryHit: false
          });
          if (styleGain > 0) {
            this.comboSystem.addStylePoints(styleGain);
          }
        }

        const currentMultiplier = this.comboSystem.activeMultiplier;
        const damage = computeHitDamage(
          proj.recipe.baseDamage,
          currentMultiplier,
          true,
          b.fragileTimer > 0
        );
        const points = computeHitPoints(currentMultiplier, true);

        this.applyDamageToBoss(damage, points, currentMultiplier, proj.recipe, meta, false);

        if (isFirstHitOfCast && this.boss) {
          this.comboSystem.registerMasteryAction(proj.recipe, { isValid: true });
        }

        this.scene.remove(proj.mesh);
        projectiles.splice(pi, 1);
      }
    }
  }

  updateBossProjectiles(dt) {
    const limit = this.getArenaHalfSize() + 0.5;
    const playerPos = this.player.position;

    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      bp.life -= dt;
      bp.mesh.position.addScaledVector(bp.direction, bp.speed * dt);
      bp.mesh.rotation.y += dt * 6.0;
      bp.mesh.rotation.x += dt * 4.0;

      bp.trailTimer += dt;
      if (bp.trailTimer >= 0.07) {
        bp.trailTimer = 0;
        this.comboSystem.spawnImpactParticles(bp.mesh.position, 0xa855f7, 0xa3e635, 1, 0.6);
      }

      // Colisão com o jogador
      const distPlayer = Math.hypot(
        bp.mesh.position.x - playerPos.x,
        bp.mesh.position.z - playerPos.z
      );
      if (distPlayer <= bp.radius + 0.58) {
        if (this.player.activeShieldBin && this.player.shieldHitGrace <= 0) {
          const remaining = this.player.consumeShieldCharge(1);
          this.player.invulnerableTimer = Math.max(this.player.invulnerableTimer, 0.35);
          this.sound.playComboReady(null, 3.0);
          this.comboSystem.spawnImpactParticles(bp.mesh.position, 0x00f5d4, 0xffffff, 14);
          this.hud.spawnFloatingText(
            playerPos.clone().add(new THREE.Vector3(0, 2.4, 0)),
            this.camera,
            this.viewportEl,
            `🛡 ENTULHO BLOQUEADO!${remaining > 0 ? ` (${remaining} HIT)` : ''}`,
            '#00f5d4'
          );
        } else if (this.player.invulnerableTimer <= 0) {
          this.player.invulnerableTimer = 1.0;
          this.sound.playPlayerHurt();
          this.comboSystem.addStylePoints(-140);
          this.comboSystem.spawnImpactParticles(bp.mesh.position, 0xa855f7, 0xff3b30, 14);
          this.hud.spawnFloatingText(
            playerPos.clone().add(new THREE.Vector3(0, 2.3, 0)),
            this.camera,
            this.viewportEl,
            '-12% PUREZA! (DISPARO DO COLOSSO)',
            '#ff3b30'
          );
          if (this.onPlayerHit) {
            this.onPlayerHit(12);
          }
        }
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
        continue;
      }

      const outOfBounds =
        Math.abs(bp.mesh.position.x) > limit || Math.abs(bp.mesh.position.z) > limit;
      if (bp.life <= 0 || outOfBounds) {
        this.scene.remove(bp.mesh);
        this.bossProjectiles.splice(i, 1);
      }
    }
  }

  clearBossProjectiles() {
    for (const bp of this.bossProjectiles) {
      this.scene.remove(bp.mesh);
    }
    this.bossProjectiles = [];
  }

  reset() {
    if (this.boss) {
      this.scene.remove(this.boss.group);
      this.boss = null;
    }
    this.clearBossProjectiles();
    this.hud.hideBossHUD();
  }
}
