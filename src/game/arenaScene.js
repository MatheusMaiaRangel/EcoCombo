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
  createParkObstacleTextures
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
    this.obstacleMaterials = null;
    this.currentStage = 1;

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

    // 6. Construção do Chão de Praça, Mobiliário de Parque e Obstáculos 3D Diversos e Aleatórios (E1-03)
    this.buildArenaGeometry();
    this.buildParkScenery();
    this.initObstacleMaterials();
    this.randomizeObstacles({ mode: 'match' });
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
    this.currentStage = isStage2 ? 2 : 1;
    this.targetHalfSize = isStage2 ? ARENA_STAGE2_HALF_SIZE : ARENA_STAGE1_HALF_SIZE;
    this.targetCameraOffset.copy(isStage2 ? this.stage2CameraOffset : this.stage1CameraOffset);
    this.targetFollowFactor = isStage2 ? 0.56 : 0.32;

    // E1-03 — Revela os obstáculos extras do anel externo ao expandir para o Estágio 2
    for (const obs of this.obstacles) {
      const shouldBeActive = obs.stageUnlock <= this.currentStage;
      obs.active = shouldBeActive;
      obs.group.visible = shouldBeActive;
      if (immediate) {
        obs.emergeProgress = shouldBeActive ? 1 : 0;
        obs.group.scale.y = shouldBeActive ? 1 : 0.01;
      } else if (shouldBeActive && obs.emergeProgress < 0.05) {
        obs.emergeProgress = 0.02;
        obs.group.scale.y = 0.02;
      }
    }

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
   * E1-03 — Inicializa materiais Pixel Art compartilhados pelos 6 arquétipos de obstáculos do parque
   */
  initObstacleMaterials() {
    const tex = createParkObstacleTextures();
    this.obstacleMaterials = {
      brick: new THREE.MeshStandardMaterial({ map: tex.brickPlanter, roughness: 0.88, metalness: 0.04 }),
      soil: new THREE.MeshStandardMaterial({ map: tex.planterSoil, roughness: 0.92, metalness: 0.0 }),
      wood: new THREE.MeshStandardMaterial({ map: tex.woodSlats, roughness: 0.82, metalness: 0.04 }),
      roof: new THREE.MeshStandardMaterial({ map: tex.roofTiles, roughness: 0.72, metalness: 0.08 }),
      rock: new THREE.MeshStandardMaterial({ map: tex.mossyRock, roughness: 0.9, metalness: 0.05 }),
      solar: new THREE.MeshStandardMaterial({ map: tex.solarPanel, roughness: 0.35, metalness: 0.35 }),
      screen: new THREE.MeshStandardMaterial({
        map: tex.ecoScreen,
        emissive: 0x0f766e,
        emissiveIntensity: 0.35,
        roughness: 0.35,
        metalness: 0.1
      }),
      foliage: new THREE.MeshStandardMaterial({ map: tex.foliage, roughness: 0.88, metalness: 0.0 }),
      iron: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.45 }),
      stoneTrim: new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.82, metalness: 0.05 }),
      water: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3,
        roughness: 0.18,
        metalness: 0.1
      }),
      terracotta: new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.85, metalness: 0.04 }),
      binColors: [
        new THREE.MeshStandardMaterial({ color: 0xff3b30, roughness: 0.6, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: 0x007aff, roughness: 0.6, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: 0x34c759, roughness: 0.6, metalness: 0.1 }),
        new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.6, metalness: 0.1 })
      ],
      flowerColors: [
        new THREE.MeshStandardMaterial({ color: 0xfb7185, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.75 }),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.75 })
      ]
    };
  }

  /**
   * E1-03 — Constrói a malha 3D estilizada de cada um dos 6 obstáculos temáticos da praça
   */
  createObstacleMesh(kind) {
    const m = this.obstacleMaterials;
    const group = new THREE.Group();
    const animatedParts = [];

    const addPart = (geo, mat, [x, y, z], [rx, ry, rz] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      return mesh;
    };

    if (kind === 'fountain_planter') {
      // 1. Canteiro Circular de Tijolinho com Flores e Mini Chafariz
      addPart(new THREE.CylinderGeometry(1.08, 1.16, 0.56, 8), m.brick, [0, 0.28, 0]);
      addPart(new THREE.CylinderGeometry(1.14, 1.14, 0.1, 8), m.stoneTrim, [0, 0.58, 0]);
      addPart(new THREE.CylinderGeometry(0.96, 0.96, 0.08, 8), m.soil, [0, 0.61, 0]);
      // Bacia central de pedra + água cristalina
      addPart(new THREE.CylinderGeometry(0.24, 0.34, 0.68, 6), m.stoneTrim, [0, 0.95, 0]);
      addPart(new THREE.CylinderGeometry(0.62, 0.42, 0.22, 8), m.stoneTrim, [0, 1.32, 0]);
      addPart(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 8), m.water, [0, 1.42, 0]);
      const spout = addPart(new THREE.OctahedronGeometry(0.16, 0), m.water, [0, 1.66, 0]);
      animatedParts.push({ mesh: spout, baseY: 1.66, kind: 'fountain_drop' });
      // Tufos de flores ao redor
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + 0.4;
        addPart(new THREE.BoxGeometry(0.32, 0.28, 0.32), m.foliage, [Math.cos(ang) * 0.66, 0.76, Math.sin(ang) * 0.66]);
        addPart(new THREE.BoxGeometry(0.14, 0.12, 0.14), m.flowerColors[i], [Math.cos(ang) * 0.66, 0.94, Math.sin(ang) * 0.66]);
      }
      return { group, baseHalfX: 1.08, baseHalfZ: 1.08, height: 1.85, animatedParts };
    }

    if (kind === 'eco_kiosk') {
      // 2. Ecoponto Coberto de Coleta Seletiva (4 mini lixeiras CONAMA sob telhadinho de parque)
      addPart(new THREE.BoxGeometry(2.26, 0.18, 1.42), m.stoneTrim, [0, 0.09, 0]);
      // 4 mini lixeiras CONAMA alinhadas
      const binXs = [-0.72, -0.24, 0.24, 0.72];
      binXs.forEach((bx, idx) => {
        addPart(new THREE.BoxGeometry(0.38, 0.92, 0.72), m.binColors[idx], [bx, 0.64, 0.02]);
        addPart(new THREE.BoxGeometry(0.42, 0.12, 0.78), m.iron, [bx, 1.12, 0.02]);
        addPart(new THREE.BoxGeometry(0.24, 0.18, 0.06), m.iron, [bx, 0.88, 0.38]);
      });
      // Postes de madeira + telhado inclinado azul-petróleo
      [[-1.02, -0.58], [1.02, -0.58], [-1.02, 0.58], [1.02, 0.58]].forEach(([px, pz]) => {
        addPart(new THREE.BoxGeometry(0.12, 1.82, 0.12), m.wood, [px, 1.08, pz]);
      });
      addPart(new THREE.BoxGeometry(2.44, 0.18, 1.68), m.roof, [0, 2.04, 0], [0.16, 0, 0]);
      return { group, baseHalfX: 1.16, baseHalfZ: 0.76, height: 2.25, animatedParts };
    }

    if (kind === 'park_bench_cluster') {
      // 3. Banco de Praça 3D em Madeira e Ferro + Vaso Florido de Terracota ao lado
      // Pés de ferro e assento/encosto de madeira ripada
      addPart(new THREE.BoxGeometry(1.56, 0.14, 0.64), m.wood, [-0.28, 0.52, 0.06]);
      addPart(new THREE.BoxGeometry(1.56, 0.54, 0.12), m.wood, [-0.28, 0.88, -0.26], [-0.18, 0, 0]);
      [[-0.92, 0.25], [-0.92, -0.2], [0.36, 0.25], [0.36, -0.2]].forEach(([lx, lz]) => {
        addPart(new THREE.BoxGeometry(0.1, 0.5, 0.1), m.iron, [lx, 0.25, lz]);
      });
      addPart(new THREE.BoxGeometry(0.1, 0.26, 0.64), m.iron, [-1.04, 0.66, 0.04]);
      addPart(new THREE.BoxGeometry(0.1, 0.26, 0.64), m.iron, [0.46, 0.66, 0.04]);
      // Vaso grande de terracota com arbusto florido ao lado do banco
      addPart(new THREE.CylinderGeometry(0.38, 0.28, 0.58, 6), m.terracotta, [0.88, 0.29, 0]);
      addPart(new THREE.DodecahedronGeometry(0.46, 0), m.foliage, [0.88, 0.88, 0]);
      addPart(new THREE.BoxGeometry(0.14, 0.14, 0.14), m.flowerColors[0], [0.76, 1.24, 0.18]);
      addPart(new THREE.BoxGeometry(0.14, 0.14, 0.14), m.flowerColors[1], [1.02, 1.18, -0.12]);
      return { group, baseHalfX: 1.22, baseHalfZ: 0.62, height: 1.45, animatedParts };
    }

    if (kind === 'boulder_bush') {
      // 4. Conjunto Orgânico de Rochas Musgosas + Arbusto Florido + Placa de Madeira Ecológica
      addPart(new THREE.DodecahedronGeometry(0.86, 0), m.rock, [-0.12, 0.58, 0.04], [0.2, 0.5, 0.1]);
      addPart(new THREE.DodecahedronGeometry(0.58, 0), m.rock, [0.54, 0.42, -0.24], [0.4, 1.1, 0.2]);
      addPart(new THREE.DodecahedronGeometry(0.52, 0), m.foliage, [-0.46, 0.52, -0.44]);
      addPart(new THREE.DodecahedronGeometry(0.42, 0), m.foliage, [0.42, 0.92, 0.24]);
      addPart(new THREE.BoxGeometry(0.16, 0.16, 0.16), m.flowerColors[3], [-0.46, 0.98, -0.42]);
      // Plaquinha rústica de parque
      addPart(new THREE.BoxGeometry(0.1, 1.05, 0.1), m.wood, [0.52, 0.52, 0.52]);
      addPart(new THREE.BoxGeometry(0.62, 0.36, 0.08), m.wood, [0.52, 1.08, 0.52], [0, -0.35, 0]);
      addPart(new THREE.BoxGeometry(0.44, 0.2, 0.09), m.screen, [0.52, 1.08, 0.52], [0, -0.35, 0]);
      return { group, baseHalfX: 0.96, baseHalfZ: 0.92, height: 1.5, animatedParts };
    }

    if (kind === 'compost_garden') {
      // 5. Horta / Composteira Comunitária de Madeira com Mudas Verdes
      addPart(new THREE.BoxGeometry(1.78, 0.78, 1.32), m.wood, [0, 0.39, 0]);
      addPart(new THREE.BoxGeometry(1.62, 0.1, 1.16), m.soil, [0, 0.8, 0]);
      // Cantoneiras de ferro escuro
      [[-0.88, -0.64], [0.88, -0.64], [-0.88, 0.64], [0.88, 0.64]].forEach(([cx, cz]) => {
        addPart(new THREE.BoxGeometry(0.12, 0.84, 0.12), m.iron, [cx, 0.42, cz]);
      });
      // 3 mudas crescendo com botões coloridos
      [[-0.48, -0.12, 0], [0.04, 0.16, 1], [0.52, -0.08, 2]].forEach(([sx, sz, ci]) => {
        addPart(new THREE.BoxGeometry(0.12, 0.48, 0.12), m.wood, [sx, 1.02, sz]);
        addPart(new THREE.DodecahedronGeometry(0.32, 0), m.foliage, [sx, 1.34, sz]);
        addPart(new THREE.BoxGeometry(0.13, 0.13, 0.13), m.flowerColors[ci], [sx, 1.62, sz]);
      });
      return { group, baseHalfX: 0.94, baseHalfZ: 0.72, height: 1.72, animatedParts };
    }

    // 6. Totem Solar Ecológico da Praça (painel fotovoltaico inclinado + visor verde-água)
    addPart(new THREE.BoxGeometry(1.44, 0.24, 1.44), m.stoneTrim, [0, 0.12, 0]);
    addPart(new THREE.BoxGeometry(1.08, 1.32, 0.76), m.wood, [0, 0.9, 0]);
    addPart(new THREE.BoxGeometry(0.84, 0.84, 0.8), m.screen, [0, 0.96, 0]);
    // Hastes metálicas + telhado de painel solar inclinado
    addPart(new THREE.BoxGeometry(0.12, 0.56, 0.12), m.iron, [-0.36, 1.72, 0]);
    addPart(new THREE.BoxGeometry(0.12, 0.56, 0.12), m.iron, [0.36, 1.72, 0]);
    addPart(new THREE.BoxGeometry(1.66, 0.12, 1.24), m.solar, [0, 2.04, 0], [0.3, 0, 0]);
    return { group, baseHalfX: 0.82, baseHalfZ: 0.82, height: 2.25, animatedParts };
  }

  /**
   * E1-03 — Limpa os obstáculos atuais e sorteia um layout diverso e aleatório para cada partida
   * - Estágio 1: 5 a 6 obstáculos variados com distância segura do spawn central e sem becos sem saída
   * - Estágio 2: +4 obstáculos aleatórios no anel externo que emergem ao expandir a praça
   */
  randomizeObstacles({ mode = 'match' } = {}) {
    for (const obs of this.obstacles) {
      this.scene.remove(obs.group);
      obs.group.traverse((child) => {
        if (child.isMesh && child.geometry) {
          child.geometry.dispose();
        }
      });
    }
    this.obstacles = [];

    const allKinds = [
      'fountain_planter',
      'eco_kiosk',
      'park_bench_cluster',
      'boulder_bush',
      'compost_garden',
      'solar_totem'
    ];

    const shuffle = (arr) => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const placeObstacle = (kind, x, z, rotSteps, stageUnlock) => {
      const built = this.createObstacleMesh(kind);
      const isRotated90 = rotSteps % 2 === 1;
      const halfX = isRotated90 ? built.baseHalfZ : built.baseHalfX;
      const halfZ = isRotated90 ? built.baseHalfX : built.baseHalfZ;

      built.group.position.set(x, 0, z);
      built.group.rotation.y = rotSteps * (Math.PI / 2);

      const isActive = stageUnlock <= this.currentStage;
      built.group.visible = isActive;
      built.group.scale.y = isActive ? 1 : 0.01;
      this.scene.add(built.group);

      this.obstacles.push({
        id: `${kind}-${this.obstacles.length + 1}`,
        kind,
        group: built.group,
        x,
        z,
        halfX,
        halfZ,
        height: built.height,
        stageUnlock,
        active: isActive,
        emergeProgress: isActive ? 1 : 0,
        animatedParts: built.animatedParts
      });
    };

    if (mode === 'tutorial') {
      // No Tutorial (E4-07), posiciona 3 obstáculos variados afastados da rota guiada central
      const tutKinds = shuffle(allKinds).slice(0, 3);
      const tutSpots = [
        [-8.2, 7.6, 0],
        [8.2, 7.6, 1],
        [-8.4, -7.8, 0]
      ];
      tutSpots.forEach(([x, z, rot], idx) => {
        placeObstacle(tutKinds[idx], x, z, rot, 1);
      });
      return;
    }

    const isPositionValid = (x, z, minCenterDist, minSpacing, halfBound) => {
      if (Math.abs(x) > halfBound || Math.abs(z) > halfBound) return false;
      if (Math.hypot(x, z) < minCenterDist) return false;
      for (const existing of this.obstacles) {
        if (Math.hypot(x - existing.x, z - existing.z) < minSpacing) {
          return false;
        }
      }
      return true;
    };

    // 1. Estágio 1: sorteia 5 ou 6 obstáculos distintos distribuídos pelos 4 quadrantes + 1-2 extras
    const stage1Kinds = shuffle(allKinds);
    const stage1Count = Math.random() < 0.5 ? 5 : 6;
    const quadrants = shuffle([
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]);

    for (let i = 0; i < stage1Count; i++) {
      const kind = stage1Kinds[i % stage1Kinds.length];
      const rotSteps = Math.floor(Math.random() * 4);
      let placed = false;

      for (let attempt = 0; attempt < 45; attempt++) {
        let rx;
        let rz;
        if (i < 4) {
          const [qx, qz] = quadrants[i];
          rx = qx * (3.6 + Math.random() * 6.4);
          rz = qz * (3.6 + Math.random() * 6.4);
        } else {
          rx = (Math.random() * 2 - 1) * 10.1;
          rz = (Math.random() * 2 - 1) * 10.1;
        }

        if (isPositionValid(rx, rz, 4.2, 4.9, 10.3)) {
          placeObstacle(kind, rx, rz, rotSteps, 1);
          placed = true;
          break;
        }
      }

      if (!placed && i < 4) {
        const [qx, qz] = quadrants[i];
        placeObstacle(kind, qx * 7.2, qz * 7.2, rotSteps, 1);
      }
    }

    // 2. Estágio 2 (01:30): sorteia 4 novos obstáculos no anel expandido da praça (emergem ao expandir!)
    const stage2Kinds = shuffle(allKinds);
    const stage2Quadrants = shuffle([
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ]);
    for (let i = 0; i < 4; i++) {
      const kind = stage2Kinds[i % stage2Kinds.length];
      const rotSteps = Math.floor(Math.random() * 4);
      const [qx, qz] = stage2Quadrants[i];

      for (let attempt = 0; attempt < 45; attempt++) {
        // Anel externo entre o limite do Estágio 1 (~13.5) e a borda do Estágio 2 (~18.2)
        const onHorizontalBand = Math.random() < 0.5;
        const rx = onHorizontalBand
          ? qx * (14.4 + Math.random() * 3.8)
          : qx * (3.5 + Math.random() * 14.5);
        const rz = onHorizontalBand
          ? qz * (3.5 + Math.random() * 14.5)
          : qz * (14.4 + Math.random() * 3.8);

        if (isPositionValid(rx, rz, 14.2, 5.6, 18.2)) {
          placeObstacle(kind, rx, rz, rotSteps, 2);
          break;
        }
      }
    }
  }

  getObstacles() {
    return this.obstacles.filter((obs) => obs.active);
  }

  /**
   * E1-03 — Resolve colisão Círculo vs AABB no plano (X, Z) contra todos os obstáculos 3D ativos da arena
   * Empurra a posição suavemente para fora e retorna a normal do bloqueio para deslize fluido
   */
  resolveCircleCollision(pos, radius = 0.55) {
    let hit = false;
    let normalX = 0;
    let normalZ = 0;
    let hitObstacle = null;

    for (const obs of this.obstacles) {
      if (!obs.active) continue;
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
   * E1-03 — Verifica se um projétil colidiu com qualquer obstáculo 3D sólido ativo da arena
   */
  findProjectileObstacleHit(pos, radius = 0.25) {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
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

    // E1-03 — Anima surgimento dos obstáculos do Estágio 2 e detalhes vivos (ex.: chafariz)
    for (const obs of this.obstacles) {
      if (obs.active && obs.emergeProgress < 1) {
        obs.emergeProgress = Math.min(1, obs.emergeProgress + dt * 2.4);
        // Ease-out suave para brotar do chão da praça expandida
        const eased = 1 - Math.pow(1 - obs.emergeProgress, 3);
        obs.group.scale.y = Math.max(0.02, eased);
      }
      if (obs.active && obs.animatedParts && obs.animatedParts.length > 0) {
        for (const part of obs.animatedParts) {
          if (part.kind === 'fountain_drop') {
            part.mesh.position.y = part.baseY + Math.sin(elapsedTime * 5.2 + obs.x) * 0.1;
            part.mesh.rotation.y = elapsedTime * 2.4;
          }
        }
      }
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
