import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  createArenaGridTexture,
  createArenaBorderTexture,
  createParkGrassTexture
} from '../art/pixelTextures.js';
import { CONAMA_ELEMENTS, ELEMENT_ORDER } from '../constants/recipes.js';

export const ARENA_HALF_SIZE = 13.5;

/**
 * E1-01 — Cena 3D Isométrica 2.5D de Dia Ensolarado (Parque Ecológico Alegre e Colorido!)
 */
export class ArenaScene {
  constructor(canvas, viewportEl) {
    this.canvas = canvas;
    this.viewportEl = viewportEl;

    // 1. Céu Azul de Dia Ensolarado e Atmosfera Alegre
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x67e8f9);
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0048);

    // 2. Câmera em Perspectiva Isométrica (E1-01)
    const width = viewportEl.clientWidth || 800;
    const height = viewportEl.clientHeight || 600;
    this.cameraOffset = new THREE.Vector3(19, 21, 19);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    this.camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 160);
    this.camera.position.copy(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);

    // 3. WebGLRenderer com Sombras Reais Projetadas no Piso Ensolarado
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
    this.renderer.toneMappingExposure = 1.15;

    // 4. Pós-Processamento com UnrealBloomPass calibrado para Dia Ensolarado (RN07 / E1-01)
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    this.bloomEnabled = true;
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.32, // strength suave para não estourar o piso claro de dia
      0.35, // radius
      0.85  // threshold: apenas orbes e magias emissivas brilham
    );
    this.composer.addPass(this.bloomPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);

    this.trees = [];
    this.flowers = [];
    this.butterflies = [];
    this.clouds = [];
    this.buntingFlags = [];

    // 5. Iluminação Solar Alegre de Dia
    this.setupLighting();

    // 6. Construção da Praça Ensolarada + Gramado Florido + Decorações Alegres
    this.buildArenaGeometry();
    this.buildCheerfulParkScenery();

    // 7. Borboletas e Pétalas Coloridas Voando pelo Parque
    this.setupAtmosphericMotes();

    // 8. Responsividade (Linux / Wayland / Niri / Redimensionamento de janela)
    this.handleResize = this.onResize.bind(this);
    window.addEventListener('resize', this.handleResize);
  }

  setupLighting() {
    // Luz hemisférica alegre de dia: Céu Azul Claro no topo + Reflexo Verde Grama na base
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x86efac, 1.35);
    this.scene.add(hemiLight);

    // Sol radiante de dia projetando sombras nítidas e suaves na praça
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 2.15);
    this.dirLight.position.set(18, 30, 14);
    this.dirLight.castShadow = true;

    const d = 23;
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

    // Luz de preenchimento celeste (deixa as sombras coloridas e alegres em vez de pretas)
    const skyFillLight = new THREE.DirectionalLight(0x7dd3fc, 0.7);
    skyFillLight.position.set(-18, 16, -15);
    this.scene.add(skyFillLight);
  }

  buildArenaGeometry() {
    const fullSize = ARENA_HALF_SIZE * 2;

    // 1. Gramado Verde Florido Gigante ao redor da Praça (Parque de Dia!)
    const grassTex = createParkGrassTexture();
    const grassGeo = new THREE.PlaneGeometry(115, 115);
    const grassMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.85,
      metalness: 0.05
    });
    this.grassMesh = new THREE.Mesh(grassGeo, grassMat);
    this.grassMesh.rotation.x = -Math.PI / 2;
    this.grassMesh.position.y = -0.05;
    this.grassMesh.receiveShadow = true;
    this.scene.add(this.grassMesh);

    // 2. Piso da Praça Ensolarada com textura pixel art alegre (THREE.NearestFilter)
    const floorTex = createArenaGridTexture();
    const floorGeo = new THREE.PlaneGeometry(fullSize, fullSize);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.72,
      metalness: 0.06
    });

    this.floorMesh = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh.rotation.x = -Math.PI / 2;
    this.floorMesh.receiveShadow = true;
    this.scene.add(this.floorMesh);

    // 3. Mosaico Solar Colorido no Centro da Praça (Rosa dos Ventos CONAMA)
    const centerRingColors = [0xff3b30, 0x007aff, 0x34c759, 0xffcc00];
    centerRingColors.forEach((col, i) => {
      const arcGeo = new THREE.RingGeometry(2.1, 2.55, 16, 1, (i * Math.PI) / 2, Math.PI / 2 - 0.08);
      const arcMat = new THREE.MeshBasicMaterial({
        color: col,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      arcMesh.rotation.x = -Math.PI / 2;
      arcMesh.position.y = 0.015;
      this.scene.add(arcMesh);
    });

    // Plano matemático invisível para o Raycaster do Mouse (E1-02)
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // 4. Muretas Coloridas do Parque Ecológico (E1-01)
    const borderTex = createArenaBorderTexture();
    const wallMat = new THREE.MeshStandardMaterial({
      map: borderTex,
      roughness: 0.45,
      metalness: 0.1
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

    // 5. 4 Totens-Lixeiras Ecológicas Coloridas nos Cantos da Praça (RN01 / RN07)
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

      // Corpo colorido da Lixeira-Totem CONAMA
      const baseMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.58, 1.55, 12),
        new THREE.MeshStandardMaterial({
          color: elem.hexNumber,
          roughness: 0.32,
          metalness: 0.1
        })
      );
      baseMesh.position.y = 0.78;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      pillarGroup.add(baseMesh);

      // Faixa branca alegre no totem
      const bandMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.73, 0.28, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
      );
      bandMesh.position.y = 1.05;
      pillarGroup.add(bandMesh);

      // Estrela / Cristal CONAMA flutuando no topo
      const crystalMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.52, 0),
        new THREE.MeshStandardMaterial({
          color: elem.hexNumber,
          emissive: elem.emissiveHex,
          emissiveIntensity: 1.4,
          roughness: 0.15
        })
      );
      crystalMesh.position.y = 2.25;
      crystalMesh.castShadow = true;
      pillarGroup.add(crystalMesh);

      this.scene.add(pillarGroup);
      this.cornerBeacons.push(crystalMesh);
    });
  }

  /**
   * Adiciona Árvores Coloridas (Ipê Amarelo, Sakura Rosa, Verde Parque), Flores 3D,
   * Varal de Bandeirinhas Festivas e Nuvens Fofinhas no céu!
   */
  buildCheerfulParkScenery() {
    // 1. Árvores Coloridas ao redor do Gramado
    const treePalette = [
      0x22c55e, // Verde Parque vibrante
      0xfacc15, // Ipê Amarelo radiante
      0xf472b6, // Cerejeira Sakura Rosa
      0x4ade80, // Verde Lima Alegre
      0xfb923c  // Laranjeira Solar
    ];

    const treePositions = [
      [-17.2, -16.8], [-11.0, -17.5], [-4.0, -18.2], [4.5, -17.8], [11.5, -17.4], [17.5, -16.5],
      [-17.8, -9.5], [-18.2, -2.0], [-17.4, 6.0], [-17.0, 14.5],
      [17.8, -8.5], [18.0, 1.5], [17.4, 9.5], [16.8, 16.5],
      [-8.5, 17.6], [1.5, 17.8], [10.0, 17.5]
    ];

    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 });

    treePositions.forEach(([tx, tz], idx) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      const scale = 0.85 + (idx % 3) * 0.2;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.8, 8), trunkMat);
      trunk.position.y = 0.9;
      trunk.castShadow = true;
      trunk.receiveShadow = true;
      treeGroup.add(trunk);

      const leafColor = treePalette[idx % treePalette.length];
      const foliageMat = new THREE.MeshStandardMaterial({
        color: leafColor,
        roughness: 0.55
      });

      const crownMain = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), foliageMat);
      crownMain.position.set(0, 2.45, 0);
      crownMain.castShadow = true;
      crownMain.receiveShadow = true;
      treeGroup.add(crownMain);

      const crownSideA = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), foliageMat);
      crownSideA.position.set(0.75, 2.0, 0.4);
      crownSideA.castShadow = true;
      treeGroup.add(crownSideA);

      const crownSideB = new THREE.Mesh(new THREE.DodecahedronGeometry(0.88, 1), foliageMat);
      crownSideB.position.set(-0.7, 2.1, -0.45);
      crownSideB.castShadow = true;
      treeGroup.add(crownSideB);

      treeGroup.scale.setScalar(scale);
      this.scene.add(treeGroup);
      this.trees.push({ group: treeGroup, phase: idx * 0.7, baseScale: scale });
    });

    // 2. Canteiros de Flores e Girassóis Coloridos ao redor das Muretas
    const flowerColors = [0xff3b30, 0xfacc15, 0xf472b6, 0x38bdf8, 0xa855f7, 0xffffff];
    const stemMat = new THREE.MeshBasicMaterial({ color: 0x16a34a });
    const centerMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    for (let i = 0; i < 36; i++) {
      const side = i % 4;
      const offset = ((Math.floor(i / 4) / 9) * 2 - 0.9) * ARENA_HALF_SIZE;
      const distOut = ARENA_HALF_SIZE + 1.35 + (i % 3) * 0.55;

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

      const flowerGroup = new THREE.Group();
      flowerGroup.position.set(fx, 0, fz);

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.55, 6), stemMat);
      stem.position.y = 0.27;
      flowerGroup.add(stem);

      const petalMat = new THREE.MeshBasicMaterial({
        color: flowerColors[i % flowerColors.length]
      });
      const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 0), petalMat);
      blossom.position.y = 0.58;
      flowerGroup.add(blossom);

      const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), centerMat);
      core.position.y = 0.68;
      flowerGroup.add(core);

      this.scene.add(flowerGroup);
      this.flowers.push({ mesh: flowerGroup, phase: i * 0.5 });
    }

    // 3. Varal de Bandeirinhas Coloridas de Festival Ecológico nas bordas superiores da Praça!
    const flagColors = [0xff3b30, 0xffcc00, 0x34c759, 0x007aff, 0xf472b6, 0x00f5d4];
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.4 });
    const edgeOffset = ARENA_HALF_SIZE + 0.35;

    // Varal ao longo da borda Norte (Z = -edgeOffset) e Oeste (X = -edgeOffset)
    const spanCount = 14;
    for (let axis = 0; axis < 2; axis++) {
      for (let i = 0; i <= spanCount; i++) {
        const t = i / spanCount;
        const coord = -ARENA_HALF_SIZE + t * (ARENA_HALF_SIZE * 2);

        // Postes a cada 7 segmentos
        if (i % 7 === 0) {
          const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 8), poleMat);
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
          const sag = Math.sin((i % 7) / 7 * Math.PI) * 0.35;
          const flagGeo = new THREE.ConeGeometry(0.28, 0.52, 3);
          const flagMat = new THREE.MeshBasicMaterial({
            color: flagColors[(i + axis * 2) % flagColors.length]
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

    // 4. Nuvens Brancas Fofinhas 3D Flutuando ao redor do Parque
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.0
    });
    const cloudCoords = [
      [-18, 11.5, -22],
      [6, 12.5, -24],
      [-23, 11.0, 4],
      [22, 12.0, -14]
    ];
    cloudCoords.forEach(([cx, cy, cz], idx) => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(cx, cy, cz);

      const p1 = new THREE.Mesh(new THREE.SphereGeometry(1.8, 10, 10), cloudMat);
      const p2 = new THREE.Mesh(new THREE.SphereGeometry(1.35, 10, 10), cloudMat);
      p2.position.set(1.4, -0.2, 0.3);
      const p3 = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 10), cloudMat);
      p3.position.set(-1.35, -0.25, -0.2);

      cloudGroup.add(p1, p2, p3);
      this.scene.add(cloudGroup);
      this.clouds.push({ group: cloudGroup, baseX: cx, baseZ: cz, phase: idx * 1.5 });
    });
  }

  /**
   * Borboletas e Pétalas Coloridas Voando pela Praça Ensolarada
   */
  setupAtmosphericMotes() {
    const butterflyColors = [0xfacc15, 0xf472b6, 0x38bdf8, 0x4ade80, 0xff6b6b];
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: butterflyColors[i % butterflyColors.length],
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.24), mat);
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
      this.bloomPass.strength = this.bloomEnabled ? 0.32 : 0.0;
    }
    return this.bloomEnabled;
  }

  update(elapsedTime, dt, playerPosition, isMenuBackdrop = false) {
    // 1. Rotação dos cristais CONAMA nos 4 cantos
    for (const crystal of this.cornerBeacons) {
      crystal.rotation.y = elapsedTime * 1.6;
      crystal.position.y = 2.25 + Math.sin(elapsedTime * 2.8) * 0.14;
    }

    // 2. Balanço alegre das árvores floridas e flores com a brisa do dia
    for (const tree of this.trees) {
      tree.group.rotation.z = Math.sin(elapsedTime * 1.8 + tree.phase) * 0.035;
    }
    for (const fl of this.flowers) {
      fl.mesh.rotation.z = Math.sin(elapsedTime * 3.2 + fl.phase) * 0.12;
    }
    for (const flag of this.buntingFlags) {
      flag.mesh.rotation.z = Math.sin(elapsedTime * 4.0 + flag.phase) * 0.18;
    }

    // 3. Movimento suave das nuvens fofinhas
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
      // No Menu Inicial, faz uma panorâmica isométrica suave mostrando o protagonista e o parque ensolarado
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
