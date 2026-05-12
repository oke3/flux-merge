/* 
 * Copyright (c) 2026 Ground Zero LLC. All rights reserved.
 * Proprietary and confidential. Reverse engineering prohibited.
 */
import * as THREE from 'three';
import type { IRenderer } from './IRenderer';
import { Node } from '../core/Node';
import { GAME_CONFIG } from '../assets/constants';

export class ThreeRenderer implements IRenderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private gridHelper: THREE.GridHelper;
  private nodesMeshes: Map<Node, THREE.Mesh> = new Map();
  private ripplesMeshes: Map<any, THREE.Mesh> = new Map();
  private particlesSystem: THREE.Points | null = null;
  private particlesGeometry: THREE.BufferGeometry | null = null;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!.parentElement!;
    
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f0f1a); // Matches deepSpace background

    // 2. Camera Setup
    this.camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      1000
    );
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);

    // 3. Renderer Setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
    this.scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 100);
    pointLight.position.set(5, 5, 5);
    this.scene.add(pointLight);

    // 5. Grid Setup
    const gridSize = GAME_CONFIG.CANVAS_SIZE;
    this.gridHelper = new THREE.GridHelper(gridSize, GAME_CONFIG.GRID_SIZE, 0x4444aa, 0x222255);
    this.gridHelper.rotation.x = Math.PI / 2; // Rotate to face camera
    this.scene.add(this.gridHelper);

    window.addEventListener('resize', () => this.onWindowResize());
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public clear() {
    // WebGL renderer doesn't 'clear' like 2D canvas, 
    // it clears every frame during renderer.render()
  }

  public drawBackground(_offset: number) {
    // Background color is handled by this.scene.background
  }

  public drawGrid() {
    // Grid is already a persistent object in the scene
  }

  public drawNode(node: Node) {
    let mesh = this.nodesMeshes.get(node);

    if (!mesh) {
      // Create geometry based on level
      const geometry = this.createGeometryForLevel(node.level);
      const material = new THREE.MeshStandardMaterial({ 
        color: node.color,
        emissive: node.color,
        emissiveIntensity: 0.5,
        metalness: 0.7,
        roughness: 0.2
      });
      
      mesh = new THREE.Mesh(geometry, material);
      this.scene.add(mesh);
      this.nodesMeshes.set(node, mesh);
    }

    // Map 2D coordinates (0-600) to 3D coordinates (-300 to 300)
    const x = node.x - GAME_CONFIG.CANVAS_SIZE / 2;
    const y = -(node.y - GAME_CONFIG.CANVAS_SIZE / 2);
    
    mesh.position.set(x, y, 0);
    mesh.scale.setScalar(node.scale);
  }

  private createGeometryForLevel(level: number): THREE.BufferGeometry {
    switch(level) {
      case 1: return new THREE.SphereGeometry(GAME_CONFIG.NODE_RADIUS, 32, 32);
      case 2: return new THREE.IcosahedronGeometry(GAME_CONFIG.NODE_RADIUS, 0);
      case 3: return new THREE.BoxGeometry(GAME_CONFIG.NODE_RADIUS * 2, GAME_CONFIG.NODE_RADIUS * 2, GAME_CONFIG.NODE_RADIUS * 2);
      case 4: return new THREE.OctahedronGeometry(GAME_CONFIG.NODE_RADIUS, 0);
      case 5: return new THREE.TorusKnotGeometry(GAME_CONFIG.NODE_RADIUS * 0.7, 0.2, 100, 16);
      default: return new THREE.SphereGeometry(GAME_CONFIG.NODE_RADIUS, 32, 32);
    }
  }

  public drawRipple(ripple: any) {
    let mesh = this.ripplesMeshes.get(ripple);

    if (!mesh) {
      const geometry = new THREE.RingGeometry(0.1, 0.2, 32);
      const material = new THREE.MeshBasicMaterial({ 
        color: ripple.color, 
        transparent: true, 
        opacity: 1, 
        side: THREE.DoubleSide 
      });
      mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      this.scene.add(mesh);
      this.ripplesMeshes.set(ripple, mesh);
    }

    const x = ripple.x - GAME_CONFIG.CANVAS_SIZE / 2;
    const y = -(ripple.y - GAME_CONFIG.CANVAS_SIZE / 2);
    
    mesh.position.set(x, y, 0);
    mesh.scale.setScalar(ripple.radius / 10);
    (mesh.material as THREE.MeshBasicMaterial).opacity = ripple.opacity;

    if (ripple.isDead) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(mat => mat.dispose());
      this.ripplesMeshes.delete(ripple);
    }
  }

  public drawParticles(particles: any[]) {
    if (particles.length === 0) return;

    if (!this.particlesSystem) {
      this.particlesGeometry = new THREE.BufferGeometry();
      const material = new THREE.PointsMaterial({ 
        size: 0.2, 
        vertexColors: true, 
        transparent: true, 
        opacity: 0.8 
      });
      this.particlesSystem = new THREE.Points(this.particlesGeometry, material);
      this.scene.add(this.particlesSystem);
    }

    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);

    particles.forEach((p, i) => {
      positions[i * 3] = p.x - GAME_CONFIG.CANVAS_SIZE / 2;
      positions[i * 3 + 1] = -(p.y - GAME_CONFIG.CANVAS_SIZE / 2);
      positions[i * 3 + 1] = -(p.y - GAME_CONFIG.CANVAS_SIZE / 2);
      positions[i * 3 + 2] = 0;

      const color = new THREE.Color(p.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    this.particlesGeometry!.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particlesGeometry!.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }

  public applyShake(intensity: number) {
    if (intensity <= 0) return;
    this.camera.position.x += (Math.random() - 0.5) * intensity * 0.1;
    this.camera.position.y += (Math.random() - 0.5) * intensity * 0.1;
  }

  public resetShake() {
    this.camera.position.x = 0;
    this.camera.position.y = 0;
  }

  public render() {
    this.renderer.render(this.scene, this.camera);
  }

  public removeNodeMesh(node: Node) {
    const mesh = this.nodesMeshes.get(node);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach(mat => mat.dispose());
      this.nodesMeshes.delete(node);
    }
  }
}
