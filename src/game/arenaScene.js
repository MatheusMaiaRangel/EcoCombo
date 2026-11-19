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
  createPixelCloudTexture
} from '../art/pixelTextures.js';
import { CONAMA_ELEMENTS, ELEMENT_ORDER } from '../constants/recipes.js';

export const ARENA_HALF_SIZE = 13.5;

/**
 * E1-01 — Cena Isométrica 2.5D com Background, Chão e Cenário 100% em 2D Pixel Art (THREE.NearestFilter)
 * e Cores Vivas de Alto Contraste (Sem Neblina Esbranquiçada)
 */
export class ArenaScene {
  constructor(canvas, viewportEl) {
    this.canvas = canvas;
    this.viewportEl = viewportEl;

    // 1. Cena com Background 2D Pixel Art e SEM neblina (evita lavar/apagar as cores!)
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

    // 3. WebGLRenderer com Sombras Reais Projetadas e Cores Puras (Sem estourar exposição!)
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

    // 4. Pós-Processamento com UnrealBloomPass seletivo (apenas projéteis muito brilhantes)
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEnabled = true;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.2,  // strength moderado para manter as cores pixel art saturadas e nítidas
      0.28, // radius
      0.92  // threshold alto: o chão e os sprites não estouram de branco
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.trees = [];
    this.flowers = [];
    this.butterflies = [];
    this.clouds = [];
    this.buntingFlags = [];
    this.cornerBeacons = [];

    // 5. Iluminação Equilibrada para destacar as texturas 2D Pixel Art com sombras reais
    this.setupLighting();

    // 6. Construção do Chão 2D Pixel Art + Cenário de Parque 2D Pixel Art
    this.buildArenaGeometry();
    this.buildCheerfulParkScenery();

    // 7. Borboletas/Pétalas Pixeladas Voando pelo Parque
    this.setupAtmosphericMotes();

    // 8. Responsividade (Linux / Wayland / Niri / Redimensionamento de janela)
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  setupLighting() {
    // Luz ambiente equilibrada para manter as cores originais das texturas pixel art
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 0.95);
    this.scene.add(hemiLight);

    // Luz Direcional Solar projetando sombras reais das árvores, protagonista e inimigos 2D
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

    // 1. Background de Gramado 2D Pixel Art ao redor da Arena (16-bit Pixel Meadow)
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

    // 2. Piso da Praça em 2D Pixel Art com cores quentes e alto contraste (THREE.NearestFilter)
    const floorTex = createArenaGridTexture();
    const floorGeo = new THREE.PlaneGeometry(fullSize, fullSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.88,
      metalness: 0.02
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // 3. Rosa dos Ventos CONAMA no Centro da Praça com contorno escuro e cores saturadas
    const outerDarkRing = new THREE.Mesh(
      new THREE.RingGeometry(1.98, 2.68, 24),
      new THREE.MeshBasicMaterial({
        color: 0x181425,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
        toneMapped: false
      })
    );
    outerDarkRing.rotation.x = -Math.PI / 2;
    outerDarkRing.position.y = 0.012;
    this.scene.add(outerDarkRing);

    const centerRingColors = [0xff1a1a, 0x0066ff, 0x00c853, 0xffb700];
    centerRingColors.forEach((col, i) => {
      const arcGeo = new THREE.RingGeometry(2.08, 2.58, 16, 1, (i * Math.PI) / 2, Math.PI / 2 - 0.08);
      const arcMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92,
        toneMapped: false
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      arcMesh.rotation.x = -Math.PI / 2;
      arcMesh.position.y = 0.016;
      this.scene.add(arcMesh);
    });

    // Plano matemático invisível para o Raycaster do Mouse (E1-02)
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 4. Muretas 2D Pixel Art com blocos CONAMA vibrantes
    const borderTex = createArenaBorderTexture();
    const wallMat = new THREE.MeshBasicMaterial({
      map: borderTex,
      toneMapped: false
    });

    const wallThickness = 0.65;
    const wallHeight = 0.78;
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

    // 5. 4 Lixeiras CONAMA em Sprite 2D Pixel Art nos Cantos da Arena (RN01 / RN07)
    const binTextures = createPixelConamaBinTextures();
    const corners = [
      [-ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, -ARENA_HALF_SIZE],
      [-ARENA_HALF_SIZE, ARENA_HALF_SIZE],
      [ARENA_HALF_SIZE, ARENA_HALF_SIZE]
    ];

    corners.forEach(([cx, cz], idx) => {
      const elemKey = ELEMENT_ORDER[idx];
      const elem = CONAMA_ELEMENTS[elemKey];

      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(cx, 0, cz);

      // Sprite 2D Pixel Art da Lixeira CONAMA
      const binSprite = new THREE.Mesh(
        new THREE.PlaneGeometry(1.9, 2.35),
        new THREE.MeshBasicMaterial({
          map: binTextures[elemKey],
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      binSprite.position.y = 1.25;
      binSprite.rotation.y = Math.PI / 4;
      binSprite.castShadow = true;
      pillarGroup.add(binSprite);

      // Cristal CONAMA girando acima da lixeira
      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.42, 0),
        new THREE.MeshBasicMaterial({
          color: elem.hexNumber,
          toneMapped: false
        })
      );
      crystalMesh.position.y = 2.75;
      pillarGroup.add(crystalMesh);

      this.scene.add(pillarGroup);
      this.cornerBeacons.push(crystalMesh);
    });
  }

  /**
   * Constrói todo o cenário do Parque ao redor da Arena usando Sprites 2D Pixel Art (Árvores, Arbustos Floridos,
   * Nuvens Pixeladas e Bandeirinhas), seguindo 100% o design 2D Pixel Art do protagonista e inimigos!
   */
  buildCheerfulParkScenery() {
    // 1. Árvores 2D Pixel Art ao redor do Gramado (Carvalho Verde, Ipê Amarelo, Sakura Rosa, Laranjeira)
    const treeTextures = createPixelTreeTextures();
    const treePositions = [
      [-17.2, -16.8], [-11.0, -17.5], [-4.0, -18.2], [4.5, -17.8], [11.5, -17.4], [17.5, -16.5],
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

    // 2. Arbustos Floridos 2D Pixel Art ao redor das Muretas
    const bushTextures = createPixelFlowerBushTextures();
    for (let i = 0; i < 32; i++) {
      const side = i % 4;
      const offset = ((Math.floor(i / 4) / 8) * 2 - 0.88) * ARENA_HALF_SIZE;
      const distOut = ARENA_HALF_SIZE + 1.45 + (i % 2) * 0.7;

      let fx = 0;
      let fz = 0;
      if (side === 0) {
        fx = offset;
        fz = -distOut;
      } else if (side === 1) {
        fx = offset;
        fz = distOut;
      } else if (side === 2) {
        fx = -distOut;
        fz = offset;
      } else {
        fx = distOut;
        fz = offset;
      }

      const bushMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.45, 1.45),
        new THREE.MeshBasicMaterial({
          map: bushTextures[i % bushTextures.length],
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      bushMesh.position.set(fx, 0.7, fz);
      bushMesh.rotation.y = Math.PI / 4;
      bushMesh.castShadow = true;

      this.scene.add(bushMesh);
      this.flowers.push({ mesh: bushMesh, phase: i * 0.5 });
    }

    // 3. Varal de Bandeirinhas Coloridas Vivas nas bordas superiores da Praça
    const flagColors = [0xff1a1a, 0xffcc00, 0x00c853, 0x0066ff, 0xff2a85, 0x00e5ff];
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x3b2313, toneMapped: false });
    const edgeOffset = ARENA_HALF_SIZE + 0.35;

    const spanCount = 14;
    for (let axis = 0; axis < 2; axis++) {
      for (let i = 0; i <= spanCount; i++) {
        const t = i / spanCount;
        const coord = -ARENA_HALF_SIZE + t * (ARENA_HALF_SIZE * 2);

        if (i % 7 === 0) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), poleMat);
          pole.position.set(
            axis === 0 ? coord : -edgeOffset,
            1.6,
            axis === 0 ? -edgeOffset : coord
          );
          pole.castShadow = true;
          this.scene.add(pole);
        }

        if (i < spanCount) {
          const midCoord = coord + ARENA_HALF_SIZE / spanCount;
          const sag = Math.sin(((i % 7) / 7) * Math.PI) * 0.35;
          const flagGeo = new THREE.ConeGeometry(0.3, 0.55, 3);
          const flagMat = new THREE.MeshBasicMaterial({
            color: flagColors[(i + axis * 2) % flagColors.length],
            toneMapped: false
          });
          const flag = new THREE.Mesh(flagGeo, flagMat);
          flag.rotation.x = Math.PI;
          flag.position.set(
            axis === 0 ? midCoord : -edgeOffset,
            2.85 - sag,
            axis === 0 ? -edgeOffset : midCoord
          );
          this.scene.add(flag);
          this.buntingFlags.push({ mesh: flag, baseY: 2.85 - sag, phase: i * 0.45 + axis });
        }
      }
    }

    // 4. Nuvens 2D Pixel Art Flutuando ao redor do Parque
    const cloudTex = createPixelCloudTexture();
    const cloudCoords = [
      [-16, 10.5, -20],
      [4, 11.5, -22],
      [-21, 10.0, 2],
      [20, 11.0, -12]
    ];
    cloudCoords.forEach(([cx, cy, cz], idx) => {
      const cloudSprite = new THREE.Mesh(
        new THREE.PlaneGeometry(5.5, 2.75),
        new THREE.MeshBasicMaterial({
          map: cloudTex,
          transparent: true,
          alphaTest: 0.45,
          side: THREE.DoubleSide,
          toneMapped: false
        })
      );
      cloudSprite.position.set(cx, cy, cz);
      cloudSprite.rotation.y = Math.PI / 4;
      this.scene.add(cloudSprite);
      this.clouds.push({ group: cloudSprite, baseX: cx, baseZ: cz, phase: idx * 1.5 });
    });
  }

  /**
   * Borboletas e Pétalas Pixeladas de Cores Vivas Voando pela Praça
   */
  setupAtmosphericMotes() {
    const butterflyColors = [0xff1a1a, 0xffcc00, 0x0066ff, 0x00e676, 0xff2a85];
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: butterflyColors[i % butterflyColors.length],
        side: THREE.DoubleSide,
        toneMapped: false
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.26), mat);
      const radius = 3.0 + Math.random() * (ARENA_HALF_SIZE - 2.0);
      const angle = Math.random() * Math.PI * 2;
      const baseY = 0.8 + Math.random() * 2.8;

      mesh.position.set(Math.cos(angle) * radius, baseY, Math.sin(angle) * radius);
      this.scene.add(mesh);
      this.butterflies.push({
        mesh,
        radius,
        angle,
        speed: 0.35 + Math.random() * 0.45,
        baseY,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  setBloomEnabled(enabled) {
    this.bloomEnabled = Boolean(enabled);
    if (this.bloomPass) {
      this.bloomPass.strength = this.bloomEnabled ? 0.2 : 0.0;
    }
    return this.bloomEnabled;
  }

  update(elapsedTime, dt, playerPosition, isMenuBackdrop = false) {
    // 1. Rotação dos cristais CONAMA nos 4 cantos
    for (const crystal of this.cornerBeacons) {
      crystal.rotation.y = elapsedTime * 1.8;
      crystal.position.y = 2.75 + Math.sin(elapsedTime * 2.8) * 0.12;
    }

    // 2. Balanço alegre das árvores e arbustos 2D Pixel Art
    for (const tree of this.trees) {
      tree.group.rotation.z = Math.sin(elapsedTime * 1.8 + tree.phase) * 0.025;
    }
    for (const flag of this.buntingFlags) {
      flag.mesh.rotation.z = Math.sin(elapsedTime * 4.0 + flag.phase) * 0.16;
    }

    // 3. Movimento suave das nuvens 2D Pixel Art
    for (const cl of this.clouds) {
      cl.group.position.x = cl.baseX + Math.sin(elapsedTime * 0.25 + cl.phase) * 1.8;
    }

    // 4. Voo das borboletas/pétalas coloridas pela praça
    for (const bf of this.butterflies) {
      bf.angle += bf.speed * dt;
      bf.mesh.position.x = Math.cos(bf.angle) * bf.radius;
      bf.mesh.position.z = Math.sin(bf.angle) * bf.radius;
      bf.mesh.position.y = bf.baseY + Math.sin(elapsedTime * 4.5 + bf.phase) * 0.35;
      bf.mesh.rotation.y = -bf.angle + Math.PI / 4;
      bf.mesh.rotation.x = Math.sin(elapsedTime * 12 + bf.phase) * 0.65;
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
