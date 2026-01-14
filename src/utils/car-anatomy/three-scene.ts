import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { CarPart, ViewMode } from '@/types/car-anatomy';
import { CAR_PARTS as CAR_PARTS_CONFIG, ANIMATION_CONFIG } from './constants';

// 部件映射类型：将模型中的 mesh 名称映射到部件信息
interface PartMapping {
  meshNames: string[]; // 模型中对应的 mesh 名称（支持多个）
  partInfo: CarPart;
}

export class CarAnatomyScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private carParts: Map<string, THREE.Object3D> = new Map();
  private originalPositions: Map<string, THREE.Vector3> = new Map();
  private currentMode: ViewMode = 'assembled';
  private animationId: number | null = null;
  private selectedPart: THREE.Object3D | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private onPartSelect: ((part: CarPart | null) => void) | null = null;
  private onLoadProgress: ((progress: number) => void) | null = null;
  private onLoadComplete: (() => void) | null = null;
  private carGroup: THREE.Group;
  private gltfLoader: GLTFLoader;
  private isModelLoaded = false;
  private partMappings: PartMapping[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.carGroup = new THREE.Group();

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(6, 3, 6);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    // 提高像素比以增强清晰度（最高 2 倍，避免性能问题）
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 增加曝光度，提升整体亮度
    this.renderer.toneMappingExposure = 1.8;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // 创建控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 20;
    this.controls.target.set(0, 0.5, 0);

    // 初始化 GLTF 加载器
    this.gltfLoader = new GLTFLoader();

    // 配置 Draco 解压器（用于压缩模型）
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    this.init();
    this.animate();
    this.setupEventListeners();
  }

  private init(): void {
    // 设置背景颜色（稍微亮一点）
    this.scene.background = new THREE.Color(0x2a2a3e);

    // 添加环境光（大幅增加强度）
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    // 添加半球光（模拟天空和地面反射，增加强度）
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.0);
    hemiLight.position.set(0, 20, 0);
    this.scene.add(hemiLight);

    // 添加主方向光（增加强度）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096; // 提高阴影质量
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);

    // 添加补光（增加强度）
    const fillLight = new THREE.DirectionalLight(0xffffff, 1.0);
    fillLight.position.set(-5, 5, -5);
    this.scene.add(fillLight);

    // 添加背光（增加强度）
    const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
    backLight.position.set(0, 5, -10);
    this.scene.add(backLight);

    // 添加底部补光（减少底部阴暗）
    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5);
    bottomLight.position.set(0, -5, 0);
    this.scene.add(bottomLight);

    // 添加前方补光
    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 3, 10);
    this.scene.add(frontLight);

    // 添加地面
    const groundGeometry = new THREE.CircleGeometry(15, 64);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d3436,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    this.scene.add(ground);

    // 添加网格辅助线
    const gridHelper = new THREE.GridHelper(30, 60, 0x444444, 0x333333);
    gridHelper.position.y = 0;
    this.scene.add(gridHelper);

    // 添加汽车组到场景
    this.scene.add(this.carGroup);

    // 先创建简化模型，后续可以加载真实模型
    this.createSimplifiedCar();
  }

  /**
   * 加载 GLTF 模型
   * @param modelUrl 模型 URL 或路径
   * @param partMappings 部件映射配置
   */
  public loadModel(modelUrl: string, partMappings?: PartMapping[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // 清除现有模型
      this.clearCarParts();

      if (partMappings) {
        this.partMappings = partMappings;
      }

      this.gltfLoader.load(
        modelUrl,
        (gltf) => {
          const model = gltf.scene;

          // 计算模型边界盒并调整大小和位置
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          // 缩放模型使其适合场景（目标大小约 4 米长）
          const targetSize = 4;
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = targetSize / maxDim;
          model.scale.setScalar(scale);

          // 重新计算中心并调整位置
          box.setFromObject(model);
          box.getCenter(center);
          model.position.sub(center);
          model.position.y = 0;

          // 遍历模型中的所有 mesh
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;

              // 尝试匹配部件信息
              const mapping = this.findPartMapping(child.name);
              if (mapping) {
                child.userData.partInfo = mapping.partInfo;
                child.userData.partId = mapping.partInfo.id;
                this.carParts.set(mapping.partInfo.id, child);
                this.originalPositions.set(mapping.partInfo.id, child.position.clone());
              } else {
                // 未映射的部件，使用 mesh 名称作为标识
                child.userData.partId = child.name;
                child.userData.partInfo = this.createGenericPartInfo(child.name);
                this.carParts.set(child.name, child);
                this.originalPositions.set(child.name, child.position.clone());
              }
            }
          });

          this.carGroup.add(model);
          this.isModelLoaded = true;

          // 调整相机以适应模型
          this.adjustCameraToModel();

          if (this.onLoadComplete) {
            this.onLoadComplete();
          }

          console.log('模型加载完成，包含以下部件:', Array.from(this.carParts.keys()));
          resolve();
        },
        (progress) => {
          const percent = (progress.loaded / progress.total) * 100;
          if (this.onLoadProgress) {
            this.onLoadProgress(percent);
          }
        },
        (error) => {
          console.error('模型加载失败:', error);
          reject(error);
        }
      );
    });
  }

  private findPartMapping(meshName: string): PartMapping | undefined {
    const lowerName = meshName.toLowerCase();
    return this.partMappings.find((mapping) =>
      mapping.meshNames.some((name) => lowerName.includes(name.toLowerCase()))
    );
  }

  private createGenericPartInfo(meshName: string): CarPart {
    // 为未映射的部件创建通用信息
    return {
      id: meshName,
      name: this.formatMeshName(meshName),
      description: `这是汽车的 ${this.formatMeshName(meshName)} 部件。`,
      category: 'body',
      explodeOffset: this.calculateExplodeOffset(meshName),
    };
  }

  private formatMeshName(name: string): string {
    // 将 mesh 名称格式化为可读名称
    return name
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  private calculateExplodeOffset(meshName: string): { x: number; y: number; z: number } {
    // 根据名称关键字计算爆炸偏移
    const lowerName = meshName.toLowerCase();
    let x = 0,
      y = 0,
      z = 0;

    if (lowerName.includes('left') || lowerName.includes('_l_')) x = -2;
    else if (lowerName.includes('right') || lowerName.includes('_r_')) x = 2;

    if (lowerName.includes('front')) z = 2;
    else if (lowerName.includes('rear') || lowerName.includes('back')) z = -2;

    if (lowerName.includes('roof') || lowerName.includes('top')) y = 2;
    else if (lowerName.includes('wheel') || lowerName.includes('tire')) y = 0;
    else if (lowerName.includes('hood') || lowerName.includes('bonnet')) y = 1.5;
    else if (lowerName.includes('door')) x = x !== 0 ? x * 1.5 : -2;

    // 添加一些随机偏移使分解更自然
    if (x === 0 && y === 0 && z === 0) {
      const hash = meshName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      x = ((hash % 3) - 1) * 1.5;
      y = ((hash % 5) / 5) * 1.5;
      z = (((hash * 7) % 3) - 1) * 1.5;
    }

    return { x, y, z };
  }

  private adjustCameraToModel(): void {
    const box = new THREE.Box3().setFromObject(this.carGroup);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / Math.sin(fov / 2));
    cameraZ *= 1.5;

    this.camera.position.set(cameraZ * 0.7, cameraZ * 0.5, cameraZ * 0.7);
    this.controls.target.copy(center);
    this.controls.update();
  }

  private clearCarParts(): void {
    // 清除所有现有汽车部件
    while (this.carGroup.children.length > 0) {
      const child = this.carGroup.children[0];
      this.carGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }
    this.carParts.clear();
    this.originalPositions.clear();
    this.isModelLoaded = false;
  }

  private createSimplifiedCar(): void {
    // 创建简化的汽车各部件（作为默认模型）
    const partConfigs: {
      id: string;
      geometry: THREE.BufferGeometry;
      position: THREE.Vector3;
      rotation?: THREE.Euler;
      color: number;
    }[] = [
      // 车身主体
      {
        id: 'body_main',
        geometry: new THREE.BoxGeometry(1.8, 0.8, 4),
        position: new THREE.Vector3(0, 0.4, 0),
        color: 0x4a90d9,
      },
      // 车顶
      {
        id: 'roof',
        geometry: new THREE.BoxGeometry(1.6, 0.6, 2),
        position: new THREE.Vector3(0, 1, -0.2),
        color: 0x4a90d9,
      },
      // 发动机舱盖
      {
        id: 'hood',
        geometry: new THREE.BoxGeometry(1.7, 0.1, 1.2),
        position: new THREE.Vector3(0, 0.85, 1.3),
        color: 0x4a90d9,
      },
      // 前保险杠
      {
        id: 'front_bumper',
        geometry: new THREE.BoxGeometry(1.9, 0.4, 0.3),
        position: new THREE.Vector3(0, 0.2, 2.1),
        color: 0x4a90d9,
      },
      // 后保险杠
      {
        id: 'rear_bumper',
        geometry: new THREE.BoxGeometry(1.9, 0.4, 0.3),
        position: new THREE.Vector3(0, 0.2, -2.1),
        color: 0x4a90d9,
      },
      // 后备箱盖
      {
        id: 'trunk',
        geometry: new THREE.BoxGeometry(1.7, 0.1, 1),
        position: new THREE.Vector3(0, 0.85, -1.5),
        color: 0x4a90d9,
      },
      // 左车门
      {
        id: 'left_door',
        geometry: new THREE.BoxGeometry(0.08, 0.7, 1.5),
        position: new THREE.Vector3(-0.94, 0.4, 0),
        color: 0x4a90d9,
      },
      // 右车门
      {
        id: 'right_door',
        geometry: new THREE.BoxGeometry(0.08, 0.7, 1.5),
        position: new THREE.Vector3(0.94, 0.4, 0),
        color: 0x4a90d9,
      },
      // 发动机
      {
        id: 'engine',
        geometry: new THREE.BoxGeometry(1.2, 0.5, 0.8),
        position: new THREE.Vector3(0, 0.5, 1.3),
        color: 0xe74c3c,
      },
      // 变速箱
      {
        id: 'transmission',
        geometry: new THREE.BoxGeometry(0.6, 0.4, 0.6),
        position: new THREE.Vector3(0, 0.2, 0.8),
        color: 0xe74c3c,
      },
      // 散热器
      {
        id: 'radiator',
        geometry: new THREE.BoxGeometry(1.4, 0.5, 0.1),
        position: new THREE.Vector3(0, 0.5, 1.9),
        color: 0xe74c3c,
      },
      // 排气系统
      {
        id: 'exhaust',
        geometry: new THREE.CylinderGeometry(0.08, 0.08, 3, 16),
        position: new THREE.Vector3(0.5, 0.15, 0),
        rotation: new THREE.Euler(Math.PI / 2, 0, 0),
        color: 0x95a5a6,
      },
      // 前悬挂
      {
        id: 'suspension_front',
        geometry: new THREE.BoxGeometry(1.6, 0.15, 0.3),
        position: new THREE.Vector3(0, 0.15, 1.4),
        color: 0x95a5a6,
      },
      // 后悬挂
      {
        id: 'suspension_rear',
        geometry: new THREE.BoxGeometry(1.6, 0.15, 0.3),
        position: new THREE.Vector3(0, 0.15, -1.4),
        color: 0x95a5a6,
      },
      // 油箱
      {
        id: 'fuel_tank',
        geometry: new THREE.BoxGeometry(1, 0.25, 0.8),
        position: new THREE.Vector3(0, 0.2, -1),
        color: 0x95a5a6,
      },
      // 方向盘
      {
        id: 'steering_wheel',
        geometry: new THREE.TorusGeometry(0.18, 0.03, 16, 32),
        position: new THREE.Vector3(-0.4, 0.8, 0.8),
        rotation: new THREE.Euler(Math.PI / 4, 0, 0),
        color: 0x9b59b6,
      },
      // 仪表台
      {
        id: 'dashboard',
        geometry: new THREE.BoxGeometry(1.5, 0.3, 0.2),
        position: new THREE.Vector3(0, 0.7, 1.1),
        color: 0x9b59b6,
      },
      // 座椅
      {
        id: 'seats',
        geometry: new THREE.BoxGeometry(1.4, 0.6, 0.8),
        position: new THREE.Vector3(0, 0.4, 0.3),
        color: 0x9b59b6,
      },
    ];

    // 创建轮子
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 32);
    const wheelPositions = [
      { id: 'wheel_fl', position: new THREE.Vector3(-0.9, 0.35, 1.4) },
      { id: 'wheel_fr', position: new THREE.Vector3(0.9, 0.35, 1.4) },
      { id: 'wheel_rl', position: new THREE.Vector3(-0.9, 0.35, -1.4) },
      { id: 'wheel_rr', position: new THREE.Vector3(0.9, 0.35, -1.4) },
    ];

    wheelPositions.forEach(({ id, position }) => {
      partConfigs.push({
        id,
        geometry: wheelGeometry.clone(),
        position,
        rotation: new THREE.Euler(0, 0, Math.PI / 2),
        color: 0x2c3e50,
      });
    });

    // 创建所有部件
    partConfigs.forEach(({ id, geometry, position, rotation, color }) => {
      const partInfo = CAR_PARTS_CONFIG.find((p) => p.id === id);

      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.3,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      if (rotation) {
        mesh.rotation.copy(rotation);
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { partId: id, partInfo: partInfo || this.createGenericPartInfo(id) };

      this.carGroup.add(mesh);
      this.carParts.set(id, mesh);
      this.originalPositions.set(id, position.clone());
    });
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.domElement.addEventListener('click', this.onMouseClick.bind(this));
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  private onWindowResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  private onMouseClick(event: globalThis.MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster
      .intersectObjects(this.carGroup.children, true)
      .filter((i) => !i.object.userData.isGround);

    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object as THREE.Mesh;
      this.selectPart(clickedMesh);
    } else {
      this.clearSelection();
    }
  }

  private onMouseMove(event: globalThis.MouseEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster
      .intersectObjects(this.carGroup.children, true)
      .filter((i) => !i.object.userData.isGround);

    // 重置所有非选中部件的发光效果
    this.carParts.forEach((obj) => {
      if (obj !== this.selectedPart && obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissive.setHex(0x000000);
      }
    });

    // 高亮悬停的部件
    if (intersects.length > 0) {
      const hoveredMesh = intersects[0].object as THREE.Mesh;
      if (hoveredMesh !== this.selectedPart && hoveredMesh.material) {
        const mat = hoveredMesh.material as THREE.MeshStandardMaterial;
        if (mat.emissive) mat.emissive.setHex(0x222222);
      }
      this.renderer.domElement.style.cursor = 'pointer';
    } else {
      this.renderer.domElement.style.cursor = 'grab';
    }
  }

  private selectPart(mesh: THREE.Mesh): void {
    // 清除之前的选中效果
    if (this.selectedPart instanceof THREE.Mesh) {
      const mat = this.selectedPart.material as THREE.MeshStandardMaterial;
      if (mat.emissive) mat.emissive.setHex(0x000000);
    }

    this.selectedPart = mesh;
    const mat = mesh.material as THREE.MeshStandardMaterial;
    if (mat.emissive) mat.emissive.setHex(0x444444);

    // 回调
    if (this.onPartSelect) {
      this.onPartSelect(mesh.userData.partInfo || null);
    }
  }

  private clearSelection(): void {
    if (this.selectedPart instanceof THREE.Mesh) {
      const mat = this.selectedPart.material as THREE.MeshStandardMaterial;
      if (mat.emissive) mat.emissive.setHex(0x000000);
      this.selectedPart = null;
    }
    if (this.onPartSelect) {
      this.onPartSelect(null);
    }
  }

  private animate(): void {
    this.animationId = window.requestAnimationFrame(this.animate.bind(this));
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  // 公开方法
  public setViewMode(mode: ViewMode): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    const duration = ANIMATION_CONFIG.duration;
    const startTime = Date.now();

    const animateTransition = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = this.easeInOutCubic(progress);

      this.carParts.forEach((obj, id) => {
        if (!(obj instanceof THREE.Mesh)) return;

        const originalPos = this.originalPositions.get(id);
        const partInfo = obj.userData.partInfo as CarPart;

        if (originalPos && partInfo) {
          const offset = partInfo.explodeOffset || { x: 0, y: 0, z: 0 };
          const targetOffset =
            mode === 'exploded'
              ? new THREE.Vector3(offset.x, offset.y, offset.z)
              : new THREE.Vector3(0, 0, 0);

          obj.position.lerpVectors(
            mode === 'exploded' ? originalPos : originalPos.clone().add(targetOffset),
            mode === 'exploded' ? originalPos.clone().add(targetOffset) : originalPos,
            easeProgress
          );
        }
      });

      if (progress < 1) {
        window.requestAnimationFrame(animateTransition);
      }
    };

    animateTransition();
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  public setPartSelectCallback(callback: (part: CarPart | null) => void): void {
    this.onPartSelect = callback;
  }

  public setLoadProgressCallback(callback: (progress: number) => void): void {
    this.onLoadProgress = callback;
  }

  public setLoadCompleteCallback(callback: () => void): void {
    this.onLoadComplete = callback;
  }

  public highlightCategory(category: string | null): void {
    this.carParts.forEach((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      const partInfo = obj.userData.partInfo as CarPart;
      const material = obj.material as THREE.MeshStandardMaterial;

      if (category === null || partInfo?.category === category) {
        material.opacity = 1;
        material.transparent = false;
      } else {
        material.opacity = 0.2;
        material.transparent = true;
      }
    });
  }

  public resetCamera(): void {
    this.adjustCameraToModel();
  }

  public getPartsList(): CarPart[] {
    const parts: CarPart[] = [];
    this.carParts.forEach((obj) => {
      if (obj.userData.partInfo) {
        parts.push(obj.userData.partInfo);
      }
    });
    return parts;
  }

  public dispose(): void {
    if (this.animationId) {
      window.cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', this.onWindowResize.bind(this));
    this.renderer.dispose();
    this.controls.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
}
