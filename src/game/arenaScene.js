import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createArenaGridTexture,
  createArenaBorderTexture
} from '../art/pixelTextures.js';
import { CONAMA_ELEMENTS, ELEMENT_ORDER } from '../constants/recipes.js';

export const ARENA_HALF_SIZE = 13.5;

/**
 * E1-01 — Cena 3D Isométrica 2.5D (HD-2D estética Until Then + Sombras no Grid + UnrealBloomPass)
 */
export class ArenaScene {
  constructor(canvas, viewportEl) {
    this.canvas = canvas;
    this.viewportEl = viewportEl;

    // 1. Cena e Neblina Atmosférica estilo Until Then
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x161422);
    this.scene.fog = new THREE.FogExp2(0x181526, 0.017);

    // 2. Câmera em Perspectiva Isométrica (E1-01)
    const width = viewportEl.clientWidth || 800;
    const height = viewportEl.clientHeight || 600;
    this.cameraOffset = new THREE.Vector3(19, 21, 19);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 150);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGLRenderer com Sombras Reais Projetadas no Piso
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // 4. Pós-Processamento com UnrealBloomPass (RN07 / E1-01)
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEnabled = true;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.52, // strength: brilho neon nos orbes, mira e projéteis
      0.38, // radius
      0.72  // threshold: apenas elementos emissivos brilham
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    // 5. Iluminação Direcional Dramática e Ambiental (Estética Until Then)
    this.setupLighting();

    // 6. Construção da Arena em Grid com Texturas Pixel Art (THREE.NearestFilter)
    this.buildArenaGeometry();

    // 7. Motes Atmosféricos Flutuantes (Poeira iluminada estilo HD-2D)
    this.setupAtmosphericMotes();

    // 8. Responsividade (Linux / Wayland / Niri / Redimensionamento de janela)
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  setupLighting() {
    // Luz hemisférica contrastando céu âmbar quente e sombra azul-ardósia urbana
    const hemiLight = new THREE.HemisphereLight(0xffd6a5, 0x242038, 0.85);
    this.scene.add(hemiLight);

    // Luz Direcional Dramática (Golden Hour / Estação Until Then) projetando sombras reais
    this.dirLight = new THREE.DirectionalLight(0xffb870, 2.35);
    this.dirLight.position.set(16, 26, 12);
    this.dirLight.castShadow = true;

    const d = 19;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 65;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    // Contraluz fria (Rim light dramática isométrica)
    const rimLight = new THREE.DirectionalLight(0x5e7ce2, 0.75);
    rimLight.position.set(-18, 12, -16);
    this.scene.add(rimLight);
  }

  buildArenaGeometry() {
    const fullSize = ARENA_HALF_SIZE * 2;

    // Piso da Arena com textura pixel art crocante (THREE.NearestFilter)
    const floorTex = createArenaGridTexture();
    const floorGeo = new THREE.PlaneGeometry(fullSize, fullSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.78,
      metalness: 0.12
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // Plano matemático invisível para o Raycaster do Mouse (E1-02)
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Muretas / Bordas delimitadas da Arena Isométrica (E1-01)
    const borderTex = createArenaBorderTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: borderTex,
      roughness: 0.6,
      metalness: 0.25
    });

    const wallThickness = 0.65;
    const wallHeight = 0.75;
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

    // 4 Totens Luminosos nos Cantos da Arena com as 4 Cores CONAMA (RN01 / RN07)
    const corners = [
      [-ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [-ARENA_HALF_SIZE, ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, ARENA_HALF_SIZE]
    ];

    this.cornerBeacons = [];
    corners.forEach(([cx, cz], idx) => {
      const elemKey = ELEMENT_ORDER[idx];
      const elem = CONAMA_ELEMENTS[elemKey];

      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(cx, 0, cz);

      const baseMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.1, 1.5, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x242638, roughness: 0.5 })
      );
      baseMesh.position.y = 0.75;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      pillarGroup.add(baseMesh);

      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.45, 0),
        new THREE.MeshStandardMaterial({
          color: elem.hexNumber,
          emissive: elem.emissiveHex,
          emissiveIntensity: 1.8,
          roughness: 0.2
        })
      );
      crystalMesh.position.y = 2.05;
      crystalMesh.castShadow = true;
      pillarGroup.add(crystalMesh);

      // Luz pontual sutil nas cores CONAMA projetando reflexo no grid
      const pointLight = new THREE.PointLight(elem.hexNumber, 1.2, 7.5);
      pointLight.position.set(0, 2.0, 0);
      pillarGroup.add(pointLight);

      this.scene.add(pillarGroup);
      this.cornerBeacons.push(crystalMesh);
    });
  }

  setupAtmosphericMotes() {
    const count = 70;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * ARENA_HALF_SIZE * 2;
      positions[i * 3 + 1] = 0.4 + Math.random() * 5.0;
      positions[i * 3 + 2] = (Math.random() - 0.5) * ARENA_HALF_SIZE * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 0.14,
      transparent: true,
      opacity: 0.55
    });
    this.motes = new THREE.Points(geo, mat);
    this.scene.add(this.motes);
  }

  setBloomEnabled(enabled) {
    this.bloomEnabled = Boolean(enabled);
    if (this.bloomPass) {
      this.bloomPass.strength = this.bloomEnabled ? 0.52 : 0.0;
    }
    return this.bloomEnabled;
  }

  update(elapsedTime, dt, playerPosition, isMenuBackdrop = false) {
    // Rotação dos cristais CONAMA nos 4 cantos
    for (const crystal of this.cornerBeacons) {
      crystal.rotation.y = elapsedTime * 1.4;
      crystal.position.y = 2.05 + Math.sin(elapsedTime * 2.5) * 0.12;
    }

    // Movimento suave das partículas de luz HD-2D
    if (this.motes) {
      this.motes.rotation.y = elapsedTime * 0.04;
    }

    if (isMenuBackdrop) {
      // No Menu Inicial, faz uma panorâmica isométrica suave ao redor do protagonista no centro
      const swayX = Math.sin(elapsedTime * 0.35) * 2.2;
      const swayZ = Math.cos(elapsedTime * 0.35) * 2.2;
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

    // Câmera isométrica acompanha suavemente o protagonista mantendo o enquadramento da arena
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
