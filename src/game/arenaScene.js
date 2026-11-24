import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createArenaGridTexture,
  createArenaBorderTexture,
  createParkGrassTexture,
  createPixelSkyBackdropTexture,
  createPixelTreeTextures,
  createPixelFlowerBushTextures,
  createPixelConamaBinTextures,
  createPixelParkBenchTexture,
  createPixelParkLampTexture,
  createPixelStonePillarTextures,
  createPixelUrbanBinTextures
} from '../art/pixelTextures.js';
import { ELEMENT_ORDER } from '../constants/recipes.js';

export const ARENA_STAGE1_HALF_SIZE = 13.5;
export const ARENA_STAGE2_HALF_SIZE = 21.0;
export const ARENA_HALF_SIZE = ARENA_STAGE1_HALF_SIZE;

/**
 * E1-01 / E2-06 — Cena Isométrica 2.5D de Parque / Praça em 2D Pixel Art (THREE.NearestFilter)
 * Com Pátio Central de Pedra, 4 Alamedas, 4 Canteiros Gramados, Bancos de Praça, Postes e Árvores 2D
 * Suporta expansão dinâmica suave do mapa ao entrar no Estágio 2 (01:30).
 */
export class ArenaScene {
  constructor(canvas, viewportEl) {
    this.canvas = canvas;
    this.viewportEl = viewportEl;

    this.currentHalfSize = ARENA_STAGE1_HALF_SIZE;
    this.targetHalfSize = ARENA_STAGE1_HALF_SIZE;
    this.wallThickness = 0.65;
    this.wallHeight = 0.72;

    // 1. Cena com Background 2D Pixel Art e SEM neblina
    this.scene = new THREE.Scene();
    this.scene.background = createPixelSkyBackdropTexture();
    this.scene.fog = null;

    // 2. Câmera em Perspectiva Isométrica (E1-01)
    const width = viewportEl.clientWidth || 800;
    const height = viewportEl.clientHeight || 600;
    this.stage1CameraOffset = new THREE.Vector3(19, 21, 19);
    this.stage2CameraOffset = new THREE.Vector3(24.5, 27.2, 24.5);
    this.cameraOffset = this.stage1CameraOffset.clone();
    this.targetCameraOffset = this.stage1CameraOffset.clone();
    this.currentFollowFactor = 0.32;
    this.targetFollowFactor = 0.32;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 210);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGLRenderer com Sombras Reais Projetadas e Cores Fieis ao Pixel Art
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 4. Pós-Processamento com UnrealBloomPass discreto
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEnabled = true;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.18,
      0.25,
      0.92
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.walls = null;
    this.cornerBins = [];
    this.perimeterProps = [];
    this.trees = [];
    this.obstacles = [];

    // E1-04 — Estado atmosférico dinâmico ligado à Pureza Ambiental (0% a 100%)
    this.targetPurity = 100;
    this.visualPurity = 100;
    this.pollutionSurgeTimer = 0;
    this.toxicFog = new THREE.FogExp2(0x411466, 0.0001);
    this.atmosphereOverlayEl = document.getElementById('purity-atmosphere-overlay');
    this.cleanDirColor = new THREE.Color(0xfff1cc); // Quente e limpo estilo Until Then (>80%)
    this.midDirColor = new THREE.Color(0xdec7f2);
    this.criticalDirColor = new THREE.Color(0xc49af0);
    this.cleanHemiSky = new THREE.Color(0xfff8e7);
    this.midHemiSky = new THREE.Color(0xcfb8f0);
    this.criticalHemiSky = new THREE.Color(0xb48cf0);
    this.cleanHemiGround = new THREE.Color(0x86efac);
    this.midHemiGround = new THREE.Color(0x7c6e96);
    this.criticalHemiGround = new THREE.Color(0x6b518c);
    this.midFogColor = new THREE.Color(0xa78bd4);
    this.criticalFogColor = new THREE.Color(0x8858bf);
    this.deepFogColor = new THREE.Color(0x723ea8);
    this.tempColorA = new THREE.Color();
    this.tempColorB = new THREE.Color();

    // 5. Iluminação Solar de Dia para o Parque 2D Pixel Art (Reativa à Pureza — E1-04)
    this.setupLighting();

    // 6. Construção do Chão de Praça, Mobiliário de Parque e Obstáculos 3D com Colisão (E1-03)
    this.buildArenaGeometry();
    this.buildParkScenery();
    this.buildObstacles();
    this.applyArenaSize(ARENA_STAGE1_HALF_SIZE);
    this.applyPurityAtmosphere(100, 0);

    // 7. Responsividade
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  getHalfSize() {
    return this.currentHalfSize;
  }

  /**
   * E2-06 — Define o tamanho alvo da praça conforme o Estágio (1 = 13.5, 2 = 21.0)
   */
  setStageSize(stage = 1, immediate = false) {
    const isStage2 = stage >= 2;
    this.targetHalfSize = isStage2 ? ARENA_STAGE2_HALF_SIZE : ARENA_STAGE1_HALF_SIZE;
    this.targetCameraOffset.copy(isStage2 ? this.stage2CameraOffset : this.stage1CameraOffset);
    this.targetFollowFactor = isStage2 ? 0.56 : 0.32;

    if (immediate) {
      this.currentHalfSize = this.targetHalfSize;
      this.cameraOffset.copy(this.targetCameraOffset);
      this.currentFollowFactor = this.targetFollowFactor;
      this.applyArenaSize(this.currentHalfSize);
    }
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xfff8e7, 0x86efac, 0.98);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfff1cc, 1.24);
    this.dirLight.position.set(18, 28, 14);
    this.dirLight.castShadow = true;

    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 105;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  buildArenaGeometry() {
    const fullSize = ARENA_STAGE1_HALF_SIZE * 2;

    // 1. Gramado Externo do Parque em 2D Pixel Art
    const grassTex = createParkGrassTexture();
    const grassGeo = new THREE.PlaneGeometry(155, 155);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.92,
      metalness: 0.0
    });
    this.grassMesh = new THREE.Mesh(grassGeo, grassMat);
    this.grassMesh.rotation.x = -Math.PI / 2;
    this.grassMesh.position.y = -0.05;
    this.grassMesh.receiveShadow = true;
    this.scene.add(this.grassMesh);

    // 2. Chão da Praça em 2D Pixel Art (Pátio circular de pedra, 4 alamedas de calçada e 4 canteiros gramados)
    const floorTex = createArenaGridTexture();
    const floorGeo = new THREE.PlaneGeometry(fullSize, fullSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.9,
      metalness: 0.0
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Plano matemático invisível para o Raycaster do Mouse (E1-02)
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 3. Mureta de Pedra e Sebe Viva (Arbusto podado de Parque) delimitando a Praça
    this.borderTex = createArenaBorderTexture();
    const wallMat = new THREE.MeshBasicMaterial({
      map: this.borderTex,
      toneMapped: false
    });

    const wallThickness = this.wallThickness;
    const wallHeight = this.wallHeight;
    const h = ARENA_STAGE1_HALF_SIZE + wallThickness / 2;
    const horizLen = fullSize + wallThickness * 2;
    const vertLen = fullSize;

    const makeWall = (size, pos) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), wallMat);
      mesh.position.set(...pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
      return mesh;
    };

    this.walls = {
      north: makeWall([horizLen, wallHeight, wallThickness], [0, wallHeight / 2, -h]),
      south: makeWall([horizLen, wallHeight, wallThickness], [0, wallHeight / 2, h]),
      west: makeWall([wallThickness, wallHeight, vertLen], [-h, wallHeight / 2, 0]),
      east: makeWall([wallThickness, wallHeight, vertLen], [h, wallHeight / 2, 0]),
      baseHorizLen: horizLen,
      baseVertLen: vertLen
    };

    // 4. 4 Lixeiras CONAMA em Sprite 2D Pixel Art nos Cantos da Praça (sem objetos voando acima delas)
    const binTextures = createPixelConamaBinTextures();
    const cornerSigns = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ];

    cornerSigns.forEach(([sx, sz], idx) => {
      const elemKey = ELEMENT_ORDER[idx];
      const binSprite = new THREE.Mesh(
        new THREE.PlaneGeometry(1.85, 2.3),
        new THREE.MeshBasicMaterial({
          map: binTextures[elemKey],
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      binSprite.position.set(sx * ARENA_STAGE1_HALF_SIZE, 1.2, sz * ARENA_STAGE1_HALF_SIZE);
      binSprite.rotation.y = Math.PI / 4;
      binSprite.castShadow = true;
      this.scene.add(binSprite);
      this.cornerBins.push({ mesh: binSprite, sx, sz });
    });
  }

  /**
   * Mobiliário e Vegetação de Parque / Praça em 2D Pixel Art:
   * - Bancos de Praça de madeira e ferro
   * - Postes clássicos de iluminação de praça
   * - Árvores e Arbustos Floridos em 2D Pixel Art
   */
  buildParkScenery() {
    // 1. Bancos de Praça e Postes de Luz Clássicos ao redor das Alamedas da Praça
    const benchTex = createPixelParkBenchTexture();
    const lampTex = createPixelParkLampTexture();

    const benchConfigs = [
      { side: 'N', along: -6.5 },
      { side: 'N', along: 6.5 },
      { side: 'W', along: -6.5 },
      { side: 'W', along: 6.5 },
      { side: 'S', along: 6.5 },
      { side: 'E', along: -6.5 }
    ];

    benchConfigs.forEach(({ side, along }) => {
      const benchMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 1.55),
        new THREE.MeshBasicMaterial({
          map: benchTex,
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      benchMesh.rotation.y = Math.PI / 4;
      benchMesh.castShadow = true;
      this.scene.add(benchMesh);
      this.perimeterProps.push({
        mesh: benchMesh,
        side,
        along,
        outwardMargin: 1.15,
        y: 0.78
      });
    });

    const lampConfigs = [
      { side: 'N', along: -3.2 },
      { side: 'N', along: 3.2 },
      { side: 'W', along: -3.2 },
      { side: 'W', along: 3.2 },
      { side: 'S', along: 3.2 },
      { side: 'E', along: 3.2 }
    ];

    lampConfigs.forEach(({ side, along }) => {
      const lampMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 3.2),
        new THREE.MeshBasicMaterial({
          map: lampTex,
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      lampMesh.rotation.y = Math.PI / 4;
      lampMesh.castShadow = true;
      this.scene.add(lampMesh);
      this.perimeterProps.push({
        mesh: lampMesh,
        side,
        along,
        outwardMargin: 0.9,
        y: 1.6
      });
    });

    // 2. Árvores 2D Pixel Art do Parque
    const treeTextures = createPixelTreeTextures();
    const treePositions = [
      [-17.2, -16.8], [-11.0, -17.5], [-4.5, -18.2], [4.5, -17.8], [11.5, -17.4], [17.5, -16.5],
      [-17.8, -9.5], [-18.2, -2.0], [-17.4, 6.0], [-17.0, 14.5],
      [17.8, -8.5], [18.0, 1.5], [17.4, 9.5], [16.8, 16.5],
      [-8.5, 17.6], [1.5, 17.8], [10.0, 17.5]
    ];

    treePositions.forEach(([tx, tz], idx) => {
      const tex = treeTextures[idx % treeTextures.length];
      const scale = 0.92 + (idx % 3) * 0.16;

      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      const spriteMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3.8 * scale, 4.5 * scale),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      spriteMesh.position.y = 2.2 * scale;
      spriteMesh.rotation.y = Math.PI / 4;
      spriteMesh.castShadow = true;
      treeGroup.add(spriteMesh);

      this.scene.add(treeGroup);
      this.trees.push({ group: treeGroup, phase: idx * 0.7, baseX: tx, baseZ: tz });
    });

    // 3. Arbustos Floridos 2D Pixel Art nos canteiros externos da Praça
    const bushTextures = createPixelFlowerBushTextures();
    const bushConfigs = [
      { side: 'N', along: -10.0 },
      { side: 'N', along: 10.0 },
      { side: 'W', along: -10.0 },
      { side: 'W', along: 10.0 },
      { side: 'S', along: -10.0 },
      { side: 'S', along: 10.0 },
      { side: 'E', along: -10.0 },
      { side: 'E', along: 10.0 }
    ];

    bushConfigs.forEach(({ side, along }, i) => {
      const bushMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.5, 1.5),
        new THREE.MeshBasicMaterial({
          map: bushTextures[i % bushTextures.length],
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      bushMesh.rotation.y = Math.PI / 4;
      bushMesh.castShadow = true;
      this.scene.add(bushMesh);
      this.perimeterProps.push({
        mesh: bushMesh,
        side,
        along,
        outwardMargin: 1.7,
        y: 0.72
      });
    });
  }

  /**
   * E1-03 — Constrói 4 Obstáculos 3D sólidos nos 4 quadrantes da praça (2 Pilares de Pedra + 2 Lixeiras Urbanas 3D)
   * com texturas Pixel Art (NearestFilter), projeção de sombra real e caixas de colisão (AABB)
   */
  buildObstacles() {
    const pillarTex = createPixelStonePillarTextures();
    const binTex = createPixelUrbanBinTextures();

    const makeBoxMaterials = (texSet) => {
      const sideMat = new THREE.MeshStandardMaterial({
        map: texSet.side,
        roughness: 0.85,
        metalness: 0.08
      });
      const topMat = new THREE.MeshStandardMaterial({
        map: texSet.top,
        roughness: 0.8,
        metalness: 0.1
      });
      return [sideMat, sideMat, topMat, topMat, sideMat, sideMat];
    };

    const pillarMats = makeBoxMaterials(pillarTex);
    const binMats = makeBoxMaterials(binTex);
    const basePlinthMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.9,
      metalness: 0.05
    });
    const capStoneMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.8,
      metalness: 0.05
    });
    const binLidMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.65,
      metalness: 0.25
    });

    // Posicionados nos 4 canteiros/quadrantes, mantendo o pátio central e as 4 alamedas 100% livres
    const configs = [
      { id: 'pillar-nw', kind: 'pillar', baseX: -6.8, baseZ: -6.8, halfX: 0.85, halfZ: 0.85, height: 2.55 },
      { id: 'urban-bin-ne', kind: 'urban_bin', baseX: 6.8, baseZ: -6.8, halfX: 0.85, halfZ: 0.85, height: 2.05 },
      { id: 'urban-bin-sw', kind: 'urban_bin', baseX: -6.8, baseZ: 6.8, halfX: 0.85, halfZ: 0.85, height: 2.05 },
      { id: 'pillar-se', kind: 'pillar', baseX: 6.8, baseZ: 6.8, halfX: 0.85, halfZ: 0.85, height: 2.55 }
    ];

    configs.forEach((cfg) => {
      const group = new THREE.Group();
      group.position.set(cfg.baseX, 0, cfg.baseZ);

      // Base sólida de pedra no chão para ancoragem visual e leitura clara da hitbox
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(cfg.halfX * 2, 0.24, cfg.halfZ * 2),
        basePlinthMat
      );
      plinth.position.y = 0.12;
      plinth.castShadow = true;
      plinth.receiveShadow = true;
      group.add(plinth);

      if (cfg.kind === 'pillar') {
        const shaft = new THREE.Mesh(
          new THREE.BoxGeometry(1.36, 2.08, 1.36),
          pillarMats
        );
        shaft.position.y = 0.24 + 1.04;
        shaft.castShadow = true;
        shaft.receiveShadow = true;
        group.add(shaft);

        const cap = new THREE.Mesh(
          new THREE.BoxGeometry(1.62, 0.24, 1.62),
          capStoneMat
        );
        cap.position.y = 0.24 + 2.08 + 0.12;
        cap.castShadow = true;
        cap.receiveShadow = true;
        group.add(cap);
      } else {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(1.48, 1.56, 1.48),
          binMats
        );
        body.position.y = 0.24 + 0.78;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        const hood = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.26, 1.6),
          binLidMat
        );
        hood.position.y = 0.24 + 1.56 + 0.13;
        hood.castShadow = true;
        hood.receiveShadow = true;
        group.add(hood);
      }

      this.scene.add(group);
      this.obstacles.push({
        id: cfg.id,
        kind: cfg.kind,
        group,
        baseX: cfg.baseX,
        baseZ: cfg.baseZ,
        x: cfg.baseX,
        z: cfg.baseZ,
        halfX: cfg.halfX,
        halfZ: cfg.halfZ,
        height: cfg.height
      });
    });
  }

  getObstacles() {
    return this.obstacles;
  }

  /**
   * E1-03 — Resolve colisão Círculo vs AABB no plano (X, Z) contra todos os obstáculos 3D da arena
   * Empurra a posição suavemente para fora e retorna a normal do bloqueio para deslize fluido
   */
  resolveCircleCollision(pos, radius = 0.55) {
    let hit = false;
    let normalX = 0;
    let normalZ = 0;
    let hitObstacle = null;

    for (const obs of this.obstacles) {
      const minX = obs.x - obs.halfX;
      const maxX = obs.x + obs.halfX;
      const minZ = obs.z - obs.halfZ;
      const maxZ = obs.z + obs.halfZ;

      const closestX = THREE.MathUtils.clamp(pos.x, minX, maxX);
      const closestZ = THREE.MathUtils.clamp(pos.z, minZ, maxZ);

      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        hit = true;
        hitObstacle = obs;

        if (distSq > 0.00001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const push = radius - dist;
          pos.x += nx * push;
          pos.z += nz * push;
          normalX = nx;
          normalZ = nz;
        } else {
          // Centro do círculo ficou exatamente dentro do AABB — empurra pela face mais próxima
          const penLeft = Math.abs(pos.x - minX);
          const penRight = Math.abs(maxX - pos.x);
          const penTop = Math.abs(pos.z - minZ);
          const penBottom = Math.abs(maxZ - pos.z);
          const minPen = Math.min(penLeft, penRight, penTop, penBottom);

          if (minPen === penLeft) {
            pos.x = minX - radius;
            normalX = -1;
            normalZ = 0;
          } else if (minPen === penRight) {
            pos.x = maxX + radius;
            normalX = 1;
            normalZ = 0;
          } else if (minPen === penTop) {
            pos.z = minZ - radius;
            normalX = 0;
            normalZ = -1;
          } else {
            pos.z = maxZ + radius;
            normalX = 0;
            normalZ = 1;
          }
        }
      }
    }

    return { hit, normalX, normalZ, obstacle: hitObstacle };
  }

  /**
   * E1-03 — Verifica se um projétil colidiu com qualquer obstáculo 3D sólido da arena
   */
  findProjectileObstacleHit(pos, radius = 0.25) {
    for (const obs of this.obstacles) {
      if (pos.y > obs.height + 0.45) continue;
      const closestX = THREE.MathUtils.clamp(pos.x, obs.x - obs.halfX, obs.x + obs.halfX);
      const closestZ = THREE.MathUtils.clamp(pos.z, obs.z - obs.halfZ, obs.z + obs.halfZ);
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      if (dx * dx + dz * dz <= radius * radius) {
        return obs;
      }
    }
    return null;
  }

  /**
   * E1-04 — Atualiza o nível alvo de Pureza Ambiental (0 a 100) que dirige iluminação e neblina
   */
  setPurity(purity = 100, immediate = false) {
    this.targetPurity = THREE.MathUtils.clamp(Number(purity) || 0, 0, 100);
    if (immediate) {
      this.visualPurity = this.targetPurity;
      this.pollutionSurgeTimer = 0;
      this.applyPurityAtmosphere(this.visualPurity, 0);
    }
  }

  /**
   * E1-04 — Intensifica momentaneamente a neblina arroxeada quando o jogador sofre ataques com pureza < 30%
   */
  triggerPollutionSurge() {
    if (this.targetPurity < 30) {
      this.pollutionSurgeTimer = 1.15;
    }
  }

  /**
   * E1-04 — Aplica iluminação quente/limpa (>80% estilo Until Then) ou neblina densa e arroxeada (<30%)
   */
  applyPurityAtmosphere(purity, surgeFactor = 0) {
    if (!this.dirLight || !this.hemiLight) return;

    if (purity > 80) {
      // Atmosfera limpa e quente estilo Until Then
      this.dirLight.color.copy(this.cleanDirColor);
      this.dirLight.intensity = 1.24;
      this.hemiLight.color.copy(this.cleanHemiSky);
      this.hemiLight.groundColor.copy(this.cleanHemiGround);
      this.hemiLight.intensity = 0.98;
      this.scene.fog = null;

      if (this.atmosphereOverlayEl) {
        this.atmosphereOverlayEl.dataset.purityBand = 'clean';
        this.atmosphereOverlayEl.style.setProperty('--smog-opacity', '0');
      }
    } else if (purity >= 30) {
      // Transição gradual entre 80% e 30%
      const t = (80 - purity) / 50;
      this.dirLight.color.copy(this.cleanDirColor).lerp(this.midDirColor, t);
      this.dirLight.intensity = THREE.MathUtils.lerp(1.24, 1.04, t);
      this.hemiLight.color.copy(this.cleanHemiSky).lerp(this.midHemiSky, t);
      this.hemiLight.groundColor.copy(this.cleanHemiGround).lerp(this.midHemiGround, t);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.98, 0.88, t);

      this.toxicFog.color.copy(this.midFogColor).lerp(this.criticalFogColor, t);
      this.toxicFog.density = THREE.MathUtils.lerp(0.0015, 0.0085, t);
      this.scene.fog = this.toxicFog;

      if (this.atmosphereOverlayEl) {
        this.atmosphereOverlayEl.dataset.purityBand = 'warning';
        this.atmosphereOverlayEl.style.setProperty('--smog-opacity', (t * 0.28).toFixed(3));
      }
    } else {
      // Pureza crítica (< 30%): neblina mais densa e arroxeada mantendo boa visibilidade da arena
      const c = (30 - purity) / 30;
      const surge = THREE.MathUtils.clamp(surgeFactor, 0, 1);

      this.dirLight.color.copy(this.midDirColor).lerp(this.criticalDirColor, 0.45 + c * 0.55);
      this.dirLight.intensity = THREE.MathUtils.lerp(1.02, 0.88, c) - surge * 0.05;
      this.hemiLight.color.copy(this.midHemiSky).lerp(this.criticalHemiSky, 0.5 + c * 0.5);
      this.hemiLight.groundColor.copy(this.midHemiGround).lerp(this.criticalHemiGround, 0.5 + c * 0.5);
      this.hemiLight.intensity = THREE.MathUtils.lerp(0.86, 0.78, c);

      this.toxicFog.color.copy(this.criticalFogColor).lerp(this.deepFogColor, Math.min(1, c * 0.75 + surge * 0.25));
      this.toxicFog.density = 0.011 + c * 0.0065 + surge * 0.0055;
      this.scene.fog = this.toxicFog;

      if (this.atmosphereOverlayEl) {
        this.atmosphereOverlayEl.dataset.purityBand = 'critical';
        const overlayAlpha = Math.min(0.68, 0.34 + c * 0.2 + surge * 0.16);
        this.atmosphereOverlayEl.style.setProperty('--smog-opacity', overlayAlpha.toFixed(3));
      }
    }
  }

  /**
   * Reposiciona e escala proporcionalmente o chão, muretas, lixeiras, mobiliário e árvores para o tamanho atual da arena
   */
  applyArenaSize(halfSize) {
    this.currentHalfSize = halfSize;
    const ratio = halfSize / ARENA_STAGE1_HALF_SIZE;
    const fullSize = halfSize * 2;

    if (this.floorMesh) {
      this.floorMesh.scale.set(ratio, ratio, 1);
    }

    if (this.walls) {
      const h = halfSize + this.wallThickness / 2;
      const horizScale = (fullSize + this.wallThickness * 2) / this.walls.baseHorizLen;
      const vertScale = fullSize / this.walls.baseVertLen;

      this.walls.north.position.z = -h;
      this.walls.north.scale.x = horizScale;
      this.walls.south.position.z = h;
      this.walls.south.scale.x = horizScale;

      this.walls.west.position.x = -h;
      this.walls.west.scale.z = vertScale;
      this.walls.east.position.x = h;
      this.walls.east.scale.z = vertScale;
    }

    if (this.borderTex) {
      this.borderTex.repeat.set(14 * ratio, 1);
    }

    for (const bin of this.cornerBins) {
      bin.mesh.position.set(bin.sx * halfSize, 1.2, bin.sz * halfSize);
    }

    for (const prop of this.perimeterProps) {
      const dist = halfSize + prop.outwardMargin;
      const alongScaled = prop.along * ratio;
      if (prop.side === 'N') {
        prop.mesh.position.set(alongScaled, prop.y, -dist);
      } else if (prop.side === 'S') {
        prop.mesh.position.set(alongScaled, prop.y, dist);
      } else if (prop.side === 'W') {
        prop.mesh.position.set(-dist, prop.y, alongScaled);
      } else {
        prop.mesh.position.set(dist, prop.y, alongScaled);
      }
    }

    const treeFactor = (halfSize + 4.2) / (ARENA_STAGE1_HALF_SIZE + 4.2);
    for (const tree of this.trees) {
      tree.group.position.set(tree.baseX * treeFactor, 0, tree.baseZ * treeFactor);
    }

    // E1-03 — Mantém os 4 obstáculos 3D ancorados proporcionalmente nos quadrantes da praça (Estágio 1 -> 2)
    for (const obs of this.obstacles) {
      obs.x = obs.baseX * ratio;
      obs.z = obs.baseZ * ratio;
      obs.group.position.set(obs.x, 0, obs.z);
    }

    if (this.dirLight) {
      const shadowBound = halfSize + 11.5;
      this.dirLight.shadow.camera.left = -shadowBound;
      this.dirLight.shadow.camera.right = shadowBound;
      this.dirLight.shadow.camera.top = shadowBound;
      this.dirLight.shadow.camera.bottom = -shadowBound;
      this.dirLight.shadow.camera.updateProjectionMatrix();
    }
  }

  setBloomEnabled(enabled) {
    this.bloomEnabled = Boolean(enabled);
    if (this.bloomPass) {
      this.bloomPass.strength = this.bloomEnabled ? 0.18 : 0.0;
    }
    return this.bloomEnabled;
  }

  update(elapsedTime, dt, playerPosition, isMenuBackdrop = false) {
    // Interpolação suave da expansão da arena ao ativar o Estágio 2
    if (Math.abs(this.currentHalfSize - this.targetHalfSize) > 0.005) {
      const nextSize = THREE.MathUtils.lerp(
        this.currentHalfSize,
        this.targetHalfSize,
        Math.min(1, dt * 2.8)
      );
      if (Math.abs(nextSize - this.targetHalfSize) < 0.015) {
        this.applyArenaSize(this.targetHalfSize);
      } else {
        this.applyArenaSize(nextSize);
      }
    }

    this.cameraOffset.lerp(this.targetCameraOffset, Math.min(1, dt * 2.6));
    this.currentFollowFactor = THREE.MathUtils.lerp(
      this.currentFollowFactor,
      this.targetFollowFactor,
      Math.min(1, dt * 2.6)
    );

    // E1-04 — Interpolação suave da iluminação e neblina conforme o nível de Pureza Ambiental
    const purityDiff = Math.abs(this.visualPurity - this.targetPurity);
    if (purityDiff > 0.05) {
      this.visualPurity = THREE.MathUtils.lerp(
        this.visualPurity,
        this.targetPurity,
        Math.min(1, dt * 4.5)
      );
    } else {
      this.visualPurity = this.targetPurity;
    }

    if (this.pollutionSurgeTimer > 0) {
      this.pollutionSurgeTimer = Math.max(0, this.pollutionSurgeTimer - dt);
    }
    const surgeFactor = this.pollutionSurgeTimer > 0 ? this.pollutionSurgeTimer / 1.15 : 0;
    this.applyPurityAtmosphere(this.visualPurity, surgeFactor);

    // Balanço sutil das copas das árvores com a brisa do parque
    for (const tree of this.trees) {
      tree.group.rotation.z = Math.sin(elapsedTime * 1.5 + tree.phase) * 0.02;
    }

    if (isMenuBackdrop) {
      const swayX = Math.sin(elapsedTime * 0.4) * 2.6;
      const swayZ = Math.cos(elapsedTime * 0.4) * 2.6;
      this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, 0, dt * 3);
      this.cameraTarget.z = THREE.MathUtils.lerp(this.cameraTarget.z, 0, dt * 3);
      this.camera.position.set(
        this.cameraOffset.x + swayX,
        this.cameraOffset.y,
        this.cameraOffset.z + swayZ
      );
      this.camera.lookAt(this.cameraTarget);
      return;
    }

    if (playerPosition) {
      const targetX = playerPosition.x * this.currentFollowFactor;
      const targetZ = playerPosition.z * this.currentFollowFactor;

      this.cameraTarget.x = THREE.MathUtils.lerp(this.cameraTarget.x, targetX, dt * 5);
      this.cameraTarget.z = THREE.MathUtils.lerp(this.cameraTarget.z, targetZ, dt * 5);

      this.camera.position.set(
        this.cameraTarget.x + this.cameraOffset.x,
        this.cameraOffset.y,
        this.cameraTarget.z + this.cameraOffset.z
      );
      this.camera.lookAt(this.cameraTarget);
    }
  }

  render() {
    this.composer.render();
  }

  onResize() {
    const width = this.viewportEl.clientWidth;
    const height = this.viewportEl.clientHeight;
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }
}
