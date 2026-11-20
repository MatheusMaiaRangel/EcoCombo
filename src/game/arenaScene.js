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
  createPixelParkLampTexture
} from '../art/pixelTextures.js';
import { ELEMENT_ORDER } from '../constants/recipes.js';

export const ARENA_STAGE1_HALF_SIZE = 13.5;
export const ARENA_STAGE2_HALF_SIZE = 17.5;
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
    this.stage2CameraOffset = new THREE.Vector3(22.2, 24.6, 22.2);
    this.cameraOffset = this.stage1CameraOffset.clone();
    this.targetCameraOffset = this.stage1CameraOffset.clone();
    this.currentFollowFactor = 0.32;
    this.targetFollowFactor = 0.32;
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 180);
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

    // 5. Iluminação Solar de Dia para o Parque 2D Pixel Art
    this.setupLighting();

    // 6. Construção do Chão de Praça (Calçadas de Pedra + 4 Canteiros de Grama) e Mobiliário de Parque
    this.buildArenaGeometry();
    this.buildParkScenery();
    this.applyArenaSize(ARENA_STAGE1_HALF_SIZE);

    // 7. Responsividade
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  getHalfSize() {
    return this.currentHalfSize;
  }

  /**
   * E2-06 — Define o tamanho alvo da praça conforme o Estágio (1 = 13.5, 2 = 17.5)
   */
  setStageSize(stage = 1, immediate = false) {
    const isStage2 = stage >= 2;
    this.targetHalfSize = isStage2 ? ARENA_STAGE2_HALF_SIZE : ARENA_STAGE1_HALF_SIZE;
    this.targetCameraOffset.copy(isStage2 ? this.stage2CameraOffset : this.stage1CameraOffset);
    this.targetFollowFactor = isStage2 ? 0.42 : 0.32;

    if (immediate) {
      this.currentHalfSize = this.targetHalfSize;
      this.cameraOffset.copy(this.targetCameraOffset);
      this.currentFollowFactor = this.targetFollowFactor;
      this.applyArenaSize(this.currentHalfSize);
    }
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.95);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffef0, 1.15);
    this.dirLight.position.set(18, 28, 14);
    this.dirLight.castShadow = true;

    const d = 25;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 85;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  buildArenaGeometry() {
    const fullSize = ARENA_STAGE1_HALF_SIZE * 2;

    // 1. Gramado Externo do Parque em 2D Pixel Art
    const grassTex = createParkGrassTexture();
    const grassGeo = new THREE.PlaneGeometry(130, 130);
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
