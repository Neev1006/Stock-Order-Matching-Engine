import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Cpu, Zap, Activity } from 'lucide-react';

export default function EngineVisualizer3D({ bids = [], asks = [], latestTrade }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const coreMeshRef = useRef(null);
  const bidParticlesRef = useRef([]);
  const askParticlesRef = useRef([]);
  const tradeBurstRef = useRef([]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 160;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.5, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Ambient & Point Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x0ecb81, 2, 20);
    pointLight.position.set(2, 4, 2);
    scene.add(pointLight);

    const redLight = new THREE.PointLight(0xf6465d, 2, 20);
    redLight.position.set(-2, -2, -2);
    scene.add(redLight);

    // 3. Central CLOB Core (Torus Knot + Wireframe Rings)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);
    coreMeshRef.current = coreGroup;

    // Inner Core Orb
    const coreGeo = new THREE.IcosahedronGeometry(0.8, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x1e2b3b,
      roughness: 0.2,
      metalness: 0.8,
      wireframe: true,
      emissive: 0x0f2a1e,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Outer Gyro Rings
    const ringGeo1 = new THREE.TorusGeometry(1.6, 0.02, 16, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0x0ecb81, wireframe: true, opacity: 0.7, transparent: true });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(2.0, 0.02, 16, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xf6465d, wireframe: true, opacity: 0.5, transparent: true });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    // Particle pool for Bids (Green) & Asks (Red)
    const bidGroup = new THREE.Group();
    const askGroup = new THREE.Group();
    scene.add(bidGroup);
    scene.add(askGroup);

    const sphereGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const bidMat = new THREE.MeshBasicMaterial({ color: 0x0ecb81 });
    const askMat = new THREE.MeshBasicMaterial({ color: 0xf6465d });

    // Populate bid nodes
    const bidNodes = [];
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(sphereGeo, bidMat);
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 4
      );
      bidGroup.add(mesh);
      bidNodes.push({
        mesh,
        angle: (i / 16) * Math.PI * 2,
        radius: 1.8 + Math.random() * 0.6,
        speed: 0.01 + Math.random() * 0.01,
      });
    }
    bidParticlesRef.current = bidNodes;

    // Populate ask nodes
    const askNodes = [];
    for (let i = 0; i < 16; i++) {
      const mesh = new THREE.Mesh(sphereGeo, askMat);
      mesh.position.set(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 4
      );
      askGroup.add(mesh);
      askNodes.push({
        mesh,
        angle: (i / 16) * Math.PI * 2,
        radius: 2.2 + Math.random() * 0.6,
        speed: -0.008 - Math.random() * 0.01,
      });
    }
    askParticlesRef.current = askNodes;

    // 4. Animation Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Rotate central core
      if (coreGroup) {
        coreGroup.rotation.y += 0.01;
        coreGroup.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
      }

      // Orbit bid particles
      bidNodes.forEach((node) => {
        node.angle += node.speed;
        node.mesh.position.x = Math.cos(node.angle) * node.radius;
        node.mesh.position.z = Math.sin(node.angle) * node.radius;
        node.mesh.position.y = Math.sin(elapsed * 2 + node.angle) * 0.4;
      });

      // Orbit ask particles
      askNodes.forEach((node) => {
        node.angle += node.speed;
        node.mesh.position.x = Math.cos(node.angle) * node.radius;
        node.mesh.position.z = Math.sin(node.angle) * node.radius;
        node.mesh.position.y = Math.cos(elapsed * 1.5 + node.angle) * 0.4;
      });

      // Update trade burst particles
      if (tradeBurstRef.current.length > 0) {
        for (let i = tradeBurstRef.current.length - 1; i >= 0; i--) {
          const p = tradeBurstRef.current[i];
          p.mesh.position.add(p.velocity);
          p.mesh.scale.multiplyScalar(0.94);
          p.life -= delta;
          if (p.life <= 0) {
            scene.remove(p.mesh);
            tradeBurstRef.current.splice(i, 1);
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Trigger 3D particle explosion when a trade executes
  useEffect(() => {
    if (!latestTrade || !sceneRef.current) return;

    const burstGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const burstMat = new THREE.MeshBasicMaterial({ color: 0xffdf99 });

    for (let i = 0; i < 24; i++) {
      const mesh = new THREE.Mesh(burstGeo, burstMat);
      mesh.position.set(0, 0, 0);
      sceneRef.current.add(mesh);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 0.08 + Math.random() * 0.12;

      tradeBurstRef.current.push({
        mesh,
        velocity: new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed
        ),
        life: 0.8,
      });
    }

    // Flash core scale
    if (coreMeshRef.current) {
      coreMeshRef.current.scale.set(1.25, 1.25, 1.25);
      setTimeout(() => {
        if (coreMeshRef.current) coreMeshRef.current.scale.set(1, 1, 1);
      }, 150);
    }
  }, [latestTrade]);

  return (
    <div className="bg-[#0f1c2c] border border-[#1e2638] rounded-md p-3 flex flex-col shadow-lg">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e2638]">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#45e89b]" />
          <h2 className="text-xs font-headline font-bold uppercase tracking-wider text-[#d6e3fa]">
            Matching Core 3D Telemetry
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#7e8b9f]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0ecb81] animate-pulse" />
          <span>FIFO QUEUE ENGINE</span>
        </div>
      </div>

      <div
        ref={mountRef}
        className="relative w-full h-[160px] bg-[#061424] rounded border border-[#1e2638] overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        <div className="absolute top-2 left-2 flex flex-col gap-0.5 text-[9px] font-mono text-[#7e8b9f] pointer-events-none bg-[#061424]/80 p-1.5 rounded border border-[#1e2638]">
          <span className="text-[#0ecb81]">● Bids Queue ({bids.length})</span>
          <span className="text-[#f6465d]">● Asks Queue ({asks.length})</span>
          <span className="text-[#ffdf99]">✦ Trade Burst Active</span>
        </div>
      </div>
    </div>
  );
}
