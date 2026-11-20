import * as THREE from 'three';
import {
  createProtagonistTextures,
  createReticleTexture
} from '../art/pixelTextures.js';
import { CONAMA_ELEMENTS, ELEMENT_ORDER } from '../constants/recipes.js';
import { ARENA_HALF_SIZE } from './arenaScene.js';

/**
 * Constrói uma malha 3D distinta para cada uma das 10 receitas de Objetos/Energias Recicladas (E3-01)
 */
export function buildRecipeObjectMesh(recipe, scale = 1.0) {
  const group = new THREE.Group();

  const matPrimary = new THREE.MeshStandardMaterial({
    color: recipe.colorA,
    emissive: recipe.colorA,
    emissiveIntensity: 0.45,
    roughness: 0.25,
    metalness: 0.2,
    toneMapped: false
  });

  const matSecondary = new THREE.MeshStandardMaterial({
    color: recipe.colorB,
    emissive: recipe.colorB,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.25,
    wireframe: false,
    toneMapped: false
  });

  switch (recipe.shape) {
    case 'sphere_polymer': {
      // Esfera Polimérica Ricocheteante (Plástico + Plástico)
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.36, 12, 12), matPrimary);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 8, 20), matSecondary);
      ring.rotation.x = Math.PI / 2;
      group.add(core, ring);
      break;
    }
    case 'origami_fan': {
      // Rajada de Origami Cortante (Papel + Papel — leque triplo de lâminas)
      for (let i = -1; i <= 1; i++) {
        const blade = new THREE.Mesh(
          new THREE.ConeGeometry(0.24, 0.72, 4),
          i === 0 ? matPrimary : matSecondary
        );
        blade.rotation.x = Math.PI / 2;
        blade.position.x = i * 0.28;
        blade.rotation.y = i * 0.22;
        group.add(blade);
      }
      break;
    }
    case 'crystal_lance': {
      // Lança de Cristal Refrator (Vidro + Vidro)
      const shaft = new THREE.Mesh(new THREE.ConeGeometry(0.24, 1.25, 6), matPrimary);
      shaft.rotation.x = Math.PI / 2;
      const guard = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), matSecondary);
      guard.position.z = -0.25;
      group.add(shaft, guard);
      break;
    }
    case 'heavy_alloy': {
      // Bola de Liga Pesada (Metal + Metal)
      const ball = new THREE.Mesh(new THREE.DodecahedronGeometry(0.46, 0), matPrimary);
      const spikes = new THREE.Mesh(new THREE.OctahedronGeometry(0.56, 0), matSecondary);
      group.add(ball, spikes);
      break;
    }
    case 'kinetic_capsule': {
      // Cápsula Cinética Pressurizada (Plástico + Papel)
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.7, 10), matPrimary);
      body.rotation.x = Math.PI / 2;
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.07, 8, 16), matSecondary);
      group.add(body, band);
      break;
    }
    case 'prism_beam': {
      // Feixe Prisma de Fibra Óptica (Plástico + Vidro)
      const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), matPrimary);
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.15, 8), matSecondary);
      beam.rotation.x = Math.PI / 2;
      group.add(prism, beam);
      break;
    }
    case 'em_coil': {
      // Bobina Eletromagnética (Plástico + Metal)
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.75, 10), matSecondary);
      core.rotation.x = Math.PI / 2;
      const coil1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 16), matPrimary);
      coil1.position.z = 0.18;
      const coil2 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.06, 8, 16), matPrimary);
      coil2.position.z = -0.18;
      group.add(core, coil1, coil2);
      break;
    }
    case 'glass_vortex': {
      // Vórtice de Vento Vítreo (Papel + Vidro)
      const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.07, 8, 18), matPrimary);
      ringOuter.rotation.x = Math.PI / 2;
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0), matSecondary);
      group.add(ringOuter, shard);
      break;
    }
    case 'chakram_disc': {
      // Disco Laminado Condutor (Papel + Metal)
      const disc = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 8, 20), matSecondary);
      disc.rotation.x = Math.PI / 2;
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.08, 0.2), matPrimary);
      group.add(disc, cross);
      break;
    }
    case 'solar_mirror':
    default: {
      // Espelho Solar Voltaico (Vidro + Metal)
      const sunCore = new THREE.Mesh(new THREE.IcosahedronGeometry(0.38, 0), matSecondary);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.06, 8, 20), matPrimary);
      group.add(sunCore, halo);
      break;
    }
  }

  group.scale.setScalar(scale);
  return group;
}

/**
 * E1-02 — Controlador do Protagonista 2.5D, Movimentação WASD, 4 Orbes em Órbita e Mira no Mouse (Raycaster)
 */
export class PlayerController {
  constructor(scene, camera, viewportEl, groundPlane, getArenaHalfSize = () => ARENA_HALF_SIZE) {
    this.scene = scene;
    this.camera = camera;
    this.viewportEl = viewportEl;
    this.groundPlane = groundPlane;
    this.getArenaHalfSize = getArenaHalfSize;

    this.position = new THREE.Vector3(0, 0, 0);
    this.moveSpeed = 8.4;
    this.keys = {
      KeyW: false,
      KeyA: false,
      KeyS: false,
      KeyD: false,
      ArrowUp: false,
      ArrowLeft: false,
      ArrowDown: false,
      ArrowRight: false
    };

    // Ponto mirado no plano do chão pelo Mouse (Raycaster)
    this.aimPoint = new THREE.Vector3(0, 0, 5);
    this.aimDirection = new THREE.Vector3(0, 0, 1);
    this.raycaster = new THREE.Raycaster();
    this.mouseNDC = new THREE.Vector2(0, 0);

    this.invulnerableTimer = 0;
    this.walkAnimTimer = 0;

    // E3-05 — Estado do Escudo Protetivo Seletivo (Modo R no leque do Hwei — tanka até 2 hits)
    this.activeShieldBin = null;
    this.shieldTimer = 0;
    this.shieldElapsed = 0;
    this.shieldMaxDuration = 3.0;
    this.shieldCharges = 0;
    this.shieldMaxCharges = 2;
    this.shieldHitGrace = 0;
    this.shieldCooldown = 0;
    this.shieldCooldownDuration = 3.0;

    // Grupo 3D raiz do protagonista
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.buildProtagonistSprite();
    this.buildOrbitingOrbs();
    this.buildShieldMesh();
    this.buildAimReticleAndLine();
    this.buildConjuredPreviewAnchor();
    this.bindInputEvents();
  }

  buildProtagonistSprite() {
    this.textures = createProtagonistTextures();

    // Plano 2.5D vertical com o modelo original do protagonista e cores 100% vivas (toneMapped: false)
    const geo = new THREE.PlaneGeometry(1.75, 2.65);
    this.spriteMat = new THREE.MeshBasicMaterial({
      map: this.textures[0],
      transparent: true,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      toneMapped: false,
      fog: false
    });

    this.spriteMesh = new THREE.Mesh(geo, this.spriteMat);
    this.spriteMesh.position.y = 1.32;
    this.spriteMesh.castShadow = true;
    // Orienta o plano 2.5D de frente para a câmera isométrica (45 graus)
    this.spriteMesh.rotation.y = Math.PI / 4;
    this.rootGroup.add(this.spriteMesh);

    // Halo de seleção sob os pés do protagonista
    const baseRingGeo = new THREE.RingGeometry(0.52, 0.72, 24);
    const baseRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      toneMapped: false
    });
    this.footRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    this.footRing.rotation.x = -Math.PI / 2;
    this.footRing.position.y = 0.03;
    this.rootGroup.add(this.footRing);

    // Luz pontual dinâmica do protagonista
    this.playerLight = new THREE.PointLight(0xffd166, 0.8, 5.5);
    this.playerLight.position.set(0, 1.8, 0);
    this.rootGroup.add(this.playerLight);
  }

  /**
   * RN08 / E1-02 — 4 Orbes Elementais em Órbita 3D Trigonométrica (sin/cos) nas 4 cores CONAMA super vivas
   */
  buildOrbitingOrbs() {
    this.orbitGroup = new THREE.Group();
    this.orbitGroup.position.y = 1.25;
    this.rootGroup.add(this.orbitGroup);

    this.orbs = ELEMENT_ORDER.map((elemKey, idx) => {
      const elem = CONAMA_ELEMENTS[elemKey];
      const orbGeo = new THREE.SphereGeometry(0.22, 14, 14);
      const orbMat = new THREE.MeshBasicMaterial({
        color: elem.hexNumber,
        toneMapped: false,
        fog: false
      });
      const mesh = new THREE.Mesh(orbGeo, orbMat);
      mesh.castShadow = true;

      // Anel externo branco em cada orbe (igual os orbes em órbita de @Docs/2d.webp)
      const haloGeo = new THREE.RingGeometry(0.26, 0.34, 16);
      const haloMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        toneMapped: false
      });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.y = Math.PI / 4;
      mesh.add(halo);

      this.orbitGroup.add(mesh);
      return {
        id: elemKey,
        index: idx,
        mesh,
        mat: orbMat,
        baseAngle: (idx * Math.PI) / 2
      };
    });
  }

  /**
   * E3-05 — Redoma 3D de Escudo Protetivo Seletivo (Modo R no leque da Lixeira)
   */
  buildShieldMesh() {
    this.shieldGroup = new THREE.Group();
    this.shieldGroup.position.y = 1.2;
    this.shieldGroup.visible = false;

    const domeGeo = new THREE.IcosahedronGeometry(1.38, 1);
    this.shieldDomeMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    this.shieldDome = new THREE.Mesh(domeGeo, this.shieldDomeMat);

    const auraGeo = new THREE.SphereGeometry(1.32, 16, 16);
    this.shieldAuraMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide
    });
    this.shieldAura = new THREE.Mesh(auraGeo, this.shieldAuraMat);

    const ringGeo = new THREE.RingGeometry(1.35, 1.58, 28);
    this.shieldRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.shieldFloorRing = new THREE.Mesh(ringGeo, this.shieldRingMat);
    this.shieldFloorRing.rotation.x = -Math.PI / 2;
    this.shieldFloorRing.position.y = -1.14;

    this.shieldGroup.add(this.shieldDome, this.shieldAura, this.shieldFloorRing);
    this.rootGroup.add(this.shieldGroup);
  }

  activateShield(binId, duration = 3.0, cooldown = 3.0, maxCharges = 2) {
    const elem = CONAMA_ELEMENTS[binId];
    if (!elem) return;
    this.activeShieldBin = binId;
    this.shieldTimer = duration;
    this.shieldElapsed = 0;
    this.shieldMaxDuration = duration;
    this.shieldCharges = maxCharges;
    this.shieldMaxCharges = maxCharges;
    this.shieldHitGrace = 0;
    this.shieldCooldownDuration = cooldown;
    this.shieldDomeMat.color.setHex(elem.hexNumber);
    this.shieldAuraMat.color.setHex(elem.hexNumber);
    this.shieldRingMat.color.setHex(elem.hexNumber);
    this.shieldGroup.visible = true;
  }

  isShieldInParryWindow(windowSec = 0.55) {
    return Boolean(this.activeShieldBin) && this.shieldElapsed <= windowSec;
  }

  consumeShieldCharge(amount = 1) {
    if (!this.activeShieldBin) return 0;
    this.shieldCharges = Math.max(0, this.shieldCharges - amount);
    this.shieldHitGrace = 0.25;
    if (this.shieldCharges <= 0) {
      this.clearShield(true);
      return 0;
    }
    return this.shieldCharges;
  }

  clearShield(triggerCooldown = true) {
    this.activeShieldBin = null;
    this.shieldTimer = 0;
    this.shieldElapsed = 0;
    this.shieldCharges = 0;
    this.shieldHitGrace = 0;
    this.shieldGroup.visible = false;
    if (triggerCooldown) {
      this.shieldCooldown = this.shieldCooldownDuration;
    }
  }

  /**
   * E1-02 — Retícula Isométrica e Linha Direcional de Mira com THREE.Raycaster
   */
  buildAimReticleAndLine() {
    const reticleTex = createReticleTexture();
    const reticleGeo = new THREE.PlaneGeometry(1.55, 1.55);
    const reticleMat = new THREE.MeshBasicMaterial({
      map: reticleTex,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false
    });

    this.reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    this.reticleMesh.rotation.x = -Math.PI / 2;
    this.reticleMesh.position.set(0, 0.04, 4);
    this.scene.add(this.reticleMesh);

    // Linha direcional ligando o protagonista até o ponto mirado pelo mouse
    const linePoints = [new THREE.Vector3(0, 0.12, 0), new THREE.Vector3(0, 0.12, 4)];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    this.aimLineMat = new THREE.LineDashedMaterial({
      color: 0x00f5d4,
      dashSize: 0.45,
      gapSize: 0.25,
      transparent: true,
      opacity: 0.75
    });
    this.aimLine = new THREE.Line(lineGeo, this.aimLineMat);
    this.aimLine.computeLineDistances();
    this.scene.add(this.aimLine);
  }

  /**
   * E3-01 — Âncora 3D onde o Objeto/Energia formado flutua junto ao protagonista apontando para a mira
   */
  buildConjuredPreviewAnchor() {
    this.conjuredHolder = new THREE.Group();
    this.conjuredHolder.position.set(0, 1.35, 0);
    this.rootGroup.add(this.conjuredHolder);
    this.currentConjuredMesh = null;
  }

  /**
   * Atualiza o objeto 3D conjurado visível junto ao protagonista quando 2 cores são combinadas
   */
  setConjuredRecipePreview(recipe, activeSlots = []) {
    if (this.currentConjuredMesh) {
      this.conjuredHolder.remove(this.currentConjuredMesh);
      this.currentConjuredMesh = null;
    }

    if (recipe) {
      this.currentConjuredMesh = buildRecipeObjectMesh(recipe, 0.85);
      this.conjuredHolder.add(this.currentConjuredMesh);
      this.playerLight.color.setHex(recipe.colorA);
      this.playerLight.intensity = 2.2;
      this.aimLineMat.color.setHex(recipe.colorA);
    } else if (activeSlots.length === 1) {
      const elem = CONAMA_ELEMENTS[activeSlots[0]];
      this.playerLight.color.setHex(elem.hexNumber);
      this.playerLight.intensity = 1.6;
      this.aimLineMat.color.setHex(elem.hexNumber);
    } else {
      this.playerLight.color.setHex(0xffd166);
      this.playerLight.intensity = 1.25;
      this.aimLineMat.color.setHex(0x00f5d4);
    }

    // Destaca os orbes que estão carregados nos slots atuais (RN08)
    this.orbs.forEach((orb) => {
      const countInSlots = activeSlots.filter((s) => s === orb.id).length;
      if (countInSlots > 0) {
        orb.mesh.scale.setScalar(1.42 + countInSlots * 0.15);
      } else {
        orb.mesh.scale.setScalar(1.0);
      }
    });
  }

  bindInputEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code in this.keys) {
        this.keys[e.code] = false;
      }
    });

    this.viewportEl.addEventListener('mousemove', (e) => {
      const rect = this.viewportEl.getBoundingClientRect();
      this.mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    });
  }

  update(elapsedTime, dt) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }

    if (this.shieldCooldown > 0) {
      this.shieldCooldown = Math.max(0, this.shieldCooldown - dt);
    }

    if (this.shieldHitGrace > 0) {
      this.shieldHitGrace = Math.max(0, this.shieldHitGrace - dt);
    }

    if (this.shieldTimer > 0) {
      this.shieldElapsed += dt;
      this.shieldTimer = Math.max(0, this.shieldTimer - dt);
      const inParry = this.shieldElapsed <= 0.55;
      const chargeFactor = this.shieldCharges <= 1 ? 0.65 : 1.0;
      this.shieldDome.rotation.y += dt * (inParry ? 4.2 : 1.8);
      this.shieldDome.rotation.x += dt * (inParry ? 2.2 : 0.9);
      this.shieldDomeMat.opacity = (inParry ? 0.88 : 0.54) * chargeFactor;
      this.shieldAuraMat.opacity = (inParry ? 0.28 : 0.15) * chargeFactor;
      const baseScale = this.shieldCharges <= 1 ? 0.9 : 1.0;
      const pulse = baseScale + Math.sin(elapsedTime * (inParry ? 18 : 8)) * (inParry ? 0.07 : 0.04);
      this.shieldDome.scale.setScalar(pulse);
      if (this.shieldTimer <= 0) {
        this.clearShield(true);
      }
    }

    // 1. Movimentação Isométrica em 8 Direções via WASD (E1-02)
    // Eixos alinhados à câmera isométrica (45°):
    // W = Cima na tela (-X, -Z), S = Baixo (+X, +Z), A = Esquerda (-X, +Z), D = Direita (+X, -Z)
    let inputX = 0;
    let inputY = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) inputY += 1;
    if (this.keys.KeyS || this.keys.ArrowDown) inputY -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) inputX += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) inputX -= 1;

    const isMoving = inputX !== 0 || inputY !== 0;

    if (isMoving) {
      // Converte o vetor 2D da tela para o plano isométrico (X, Z)
      const isoX = inputX - inputY;
      const isoZ = -inputX - inputY;
      const moveVec = new THREE.Vector3(isoX, 0, isoZ).normalize();

      this.position.addScaledVector(moveVec, this.moveSpeed * dt);

      // Respeita rigorosamente os limites dinâmicos da arena isométrica (Estágio 1 -> Estágio 2)
      const limit = this.getArenaHalfSize() - 0.9;
      this.position.x = THREE.MathUtils.clamp(this.position.x, -limit, limit);
      this.position.z = THREE.MathUtils.clamp(this.position.z, -limit, limit);

      // Animação dos frames de caminhada pixel art
      this.walkAnimTimer += dt * 9.5;
      const frameIdx = (Math.floor(this.walkAnimTimer) % 2) + 1;
      this.spriteMat.map = this.textures[frameIdx];
    } else {
      this.walkAnimTimer = 0;
      this.spriteMat.map = this.textures[0];
    }

    this.rootGroup.position.copy(this.position);

    // Pisca visualmente se acabou de sofrer contato de um bicho
    if (this.invulnerableTimer > 0) {
      this.spriteMesh.visible = Math.floor(elapsedTime * 18) % 2 === 0;
    } else {
      this.spriteMesh.visible = true;
    }

    // 2. Mira Isométrica via THREE.Raycaster no Plano do Chão (E1-02)
    this.raycaster.setFromCamera(this.mouseNDC, this.camera);
    const hitPoint = new THREE.Vector3();
    const intersected = this.raycaster.ray.intersectPlane(this.groundPlane, hitPoint);

    if (intersected) {
      const bound = this.getArenaHalfSize() - 0.3;
      hitPoint.x = THREE.MathUtils.clamp(hitPoint.x, -bound, bound);
      hitPoint.z = THREE.MathUtils.clamp(hitPoint.z, -bound, bound);
      this.aimPoint.copy(hitPoint);
    }

    const dir = new THREE.Vector3().subVectors(this.aimPoint, this.position);
    dir.y = 0;
    if (dir.lengthSq() > 0.001) {
      this.aimDirection.copy(dir).normalize();
    }

    // Espelha horizontalmente o sprite 2.5D do protagonista conforme o lado mirado pelo mouse
    const screenRightDot =
      this.aimDirection.x * 0.7071 - this.aimDirection.z * 0.7071;
    this.spriteMesh.scale.x = screenRightDot < -0.05 ? -1 : 1;

    // Atualiza posição e rotação da retícula no chão
    this.reticleMesh.position.set(this.aimPoint.x, 0.04, this.aimPoint.z);
    this.reticleMesh.rotation.z = elapsedTime * 1.8;

    // Atualiza linha pontilhada de mira do protagonista até a retícula
    const linePositions = this.aimLine.geometry.attributes.position.array;
    linePositions[0] = this.position.x;
    linePositions[1] = 0.14;
    linePositions[2] = this.position.z;
    linePositions[3] = this.aimPoint.x;
    linePositions[4] = 0.14;
    linePositions[5] = this.aimPoint.z;
    this.aimLine.geometry.attributes.position.needsUpdate = true;
    this.aimLine.computeLineDistances();

    // 3. Órbita Trigonométrica (sin/cos) dos 4 Orbes Elementais CONAMA (E1-02 / RN08)
    const orbitRadius = 1.38;
    const orbitSpeed = 2.4;
    this.orbs.forEach((orb) => {
      const angle = orb.baseAngle + elapsedTime * orbitSpeed;
      const ox = Math.cos(angle) * orbitRadius;
      const oz = Math.sin(angle) * orbitRadius;
      const oy = Math.sin(elapsedTime * 3.8 + orb.index * 1.5) * 0.16;
      orb.mesh.position.set(ox, oy, oz);
    });

    // 4. Posiciona e orienta o Objeto/Energia conjurado na direção da mira do Mouse (E1-02 / E3-01)
    if (this.currentConjuredMesh) {
      const holdDist = 1.15;
      this.conjuredHolder.position.set(
        this.aimDirection.x * holdDist,
        1.32 + Math.sin(elapsedTime * 5) * 0.1,
        this.aimDirection.z * holdDist
      );
      const yaw = Math.atan2(this.aimDirection.x, this.aimDirection.z);
      this.conjuredHolder.rotation.set(0, yaw, 0);
      this.currentConjuredMesh.rotation.z += dt * 3.5;
    }
  }

  clearKeys() {
    Object.keys(this.keys).forEach((k) => {
      this.keys[k] = false;
    });
  }

  /**
   * Mantém o protagonista vivo e os 4 orbes CONAMA orbitando em 3D quando o jogo está no Menu Inicial
   */
  updateIdleOrbsOnly(elapsedTime) {
    const orbitRadius = 1.45;
    const orbitSpeed = 2.4;
    this.orbs.forEach((orb) => {
      const angle = orb.baseAngle + elapsedTime * orbitSpeed;
      const ox = Math.cos(angle) * orbitRadius;
      const oz = Math.sin(angle) * orbitRadius;
      const oy = Math.sin(elapsedTime * 3.8 + orb.index * 1.5) * 0.18;
      orb.mesh.position.set(ox, oy, oz);
    });
    const frameIdx = Math.floor(elapsedTime * 3.2) % 3;
    this.spriteMat.map = this.textures[frameIdx];
    this.reticleMesh.rotation.z = elapsedTime * 1.8;
  }

  reset() {
    this.clearKeys();
    this.position.set(0, 0, 0);
    this.rootGroup.position.set(0, 0, 0);
    this.invulnerableTimer = 0;
    this.clearShield(false);
    this.shieldCooldown = 0;
    this.spriteMesh.visible = true;
  }
}
