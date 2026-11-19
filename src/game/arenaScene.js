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

export const ARENA_HALF_SIZE = 13.5;

/**
 * E1-01 — Cena Isométrica 2.5D de Parque / Praça em 2D Pixel Art (THREE.NearestFilter)
 * Com Pátio Central de Pedra, 4 Alamedas, 4 Canteiros Gramados, Bancos de Praça, Postes e Árvores 2D
 * (Sem objetos ou partículas coloridas voando pela tela)
 */
export class ArenaScene {
  constructor(canvas, viewportEl) {
    this.canvas = canvas;
    this.viewportEl = viewportEl;

    // 1. Cena com Background 2D Pixel Art e SEM neblina
    this.scene = new THREE.Scene();
    this.scene.background = createPixelSkyBackdropTexture();
    this.scene.fog = null;

    // 2. Câmera em Perspectiva Isométrica (E1-01)
    const width = viewportEl.clientWidth || 800;
    const height = viewportEl.clientHeight || 600;
    this.cameraOffset = new THREE.Vector3(19, 21, 19);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 160);
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

    this.trees = [];

    // 5. Iluminação Solar de Dia para o Parque 2D Pixel Art
    this.setupLighting();

    // 6. Construção do Chão de Praça (Calçadas de Pedra + 4 Canteiros de Grama) e Mobiliário de Parque
    this.buildArenaGeometry();
    this.buildParkScenery();

    // 7. Responsividade
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  setupLighting() {
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.95);
    this.scene.add(hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xfffef0, 1.15);
    this.dirLight.position.set(18, 28, 14);
    this.dirLight.castShadow = true;

    const d = 24;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 75;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
  }

  buildArenaGeometry() {
    const fullSize = ARENA_HALF_SIZE * 2;

    // 1. Gramado Externo do Parque em 2D Pixel Art
    const grassTex = createParkGrassTexture();
    const grassGeo = new THREE.PlaneGeometry(115, 115);
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
    const borderTex = createArenaBorderTexture();
    const wallMat = new THREE.MeshBasicMaterial({
      map: borderTex,
      toneMapped: false
    });

    const wallThickness = 0.65;
    const wallHeight = 0.72;
    const h = ARENA_HALF_SIZE + wallThickness / 2;

    const wallConfigs = [
      { pos: [0, wallHeight / 2, -h], size: [fullSize + wallThickness * 2, wallHeight, wallThickness] },
      { pos: [0, wallHeight / 2, h], size: [fullSize + wallThickness * 2, wallHeight, wallThickness] },
      { pos: [-h, wallHeight / 2, 0], size: [wallThickness, wallHeight, fullSize] },
      { pos: [h, wallHeight / 2, 0], size: [wallThickness, wallHeight, fullSize] }
    ];

    wallConfigs.forEach((cfg) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...cfg.size), wallMat);
      mesh.position.set(...cfg.pos);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.scene.add(mesh);
    });

    // 4. 4 Lixeiras CONAMA em Sprite 2D Pixel Art nos Cantos da Praça (sem objetos voando acima delas)
    const binTextures = createPixelConamaBinTextures();
    const corners = [
      [-ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [-ARENA_HALF_SIZE, ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, ARENA_HALF_SIZE]
    ];

    corners.forEach(([cx, cz], idx) => {
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
      binSprite.position.set(cx, 1.2, cz);
      binSprite.rotation.y = Math.PI / 4;
      binSprite.castShadow = true;
      this.scene.add(binSprite);
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

    const benchPositions = [
      [-6.5, -ARENA_HALF_SIZE - 1.15],
      [6.5, -ARENA_HALF_SIZE - 1.15],
      [-ARENA_HALF_SIZE - 1.15, -6.5],
      [-ARENA_HALF_SIZE - 1.15, 6.5],
      [6.5, ARENA_HALF_SIZE + 1.15],
      [ARENA_HALF_SIZE + 1.15, -6.5]
    ];

    benchPositions.forEach(([bx, bz]) => {
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
      benchMesh.position.set(bx, 0.78, bz);
      benchMesh.rotation.y = Math.PI / 4;
      benchMesh.castShadow = true;
      this.scene.add(benchMesh);
    });

    const lampPositions = [
      [-3.2, -ARENA_HALF_SIZE - 0.9],
      [3.2, -ARENA_HALF_SIZE - 0.9],
      [-ARENA_HALF_SIZE - 0.9, -3.2],
      [-ARENA_HALF_SIZE - 0.9, 3.2],
      [3.2, ARENA_HALF_SIZE + 0.9],
      [ARENA_HALF_SIZE + 0.9, 3.2]
    ];

    lampPositions.forEach(([lx, lz]) => {
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
      lampMesh.position.set(lx, 1.6, lz);
      lampMesh.rotation.y = Math.PI / 4;
      lampMesh.castShadow = true;
      this.scene.add(lampMesh);
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
      this.trees.push({ group: treeGroup, phase: idx * 0.7 });
    });

    // 3. Arbustos Floridos 2D Pixel Art nos canteiros externos da Praça
    const bushTextures = createPixelFlowerBushTextures();
    const bushCoords = [
      [-10.0, -15.2], [10.0, -15.2],
      [-15.2, -10.0], [-15.2, 10.0],
      [-10.0, 15.2], [10.0, 15.2],
      [15.2, -10.0], [15.2, 10.0]
    ];

    bushCoords.forEach(([bx, bz], i) => {
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
      bushMesh.position.set(bx, 0.72, bz);
      bushMesh.rotation.y = Math.PI / 4;
      bushMesh.castShadow = true;
      this.scene.add(bushMesh);
    });
  }

  setBloomEnabled(enabled) {
    this.bloomEnabled = Boolean(enabled);
    if (this.bloomPass) {
      this.bloomPass.strength = this.bloomEnabled ? 0.18 : 0.0;
    }
    return this.bloomEnabled;
  }

  update(elapsedTime, dt, playerPosition, isMenuBackdrop = false) {
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
      const followFactor = 0.32;
      const targetX = playerPosition.x * followFactor;
      const targetZ = playerPosition.z * followFactor;

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
