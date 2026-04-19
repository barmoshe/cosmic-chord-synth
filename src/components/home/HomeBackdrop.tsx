import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isMobile } from "@/components/biome-synth/shared/constants";

const BIOME_COLORS = [
  new THREE.Color("#6CE5FF"),
  new THREE.Color("#9A7CFF"),
  new THREE.Color("#3CC38A"),
  new THREE.Color("#2FA6FF"),
  new THREE.Color("#FF2CA8"),
  new THREE.Color("#FFD84D"),
];

export default function HomeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, W() / H(), 1, 4000);
    camera.position.z = 700;

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isMobile, alpha: true });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(PR);
    renderer.setClearColor(0x000000, 0);

    const count = isMobile ? 220 : 600;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const drift = new Float32Array(count);
    const baseR = new Float32Array(count);
    const angle = new Float32Array(count);
    const height = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const r = 200 + Math.random() * 900;
      const a = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 800;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * r;
      baseR[i] = r;
      angle[i] = a;
      height[i] = y;
      drift[i] = 0.05 + Math.random() * 0.15;

      const c = BIOME_COLORS[Math.floor(Math.random() * BIOME_COLORS.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isMobile ? 3.2 : 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geo, material);
    scene.add(points);

    let rafId = 0;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;

    const tick = () => {
      const t = performance.now() * 0.0001;
      for (let i = 0; i < count; i++) {
        angle[i] += drift[i] * 0.002;
        const r = baseR[i] + Math.sin(t * 2 + i) * 20;
        posAttr.array[i * 3] = Math.cos(angle[i]) * r;
        posAttr.array[i * 3 + 1] = height[i] + Math.sin(t * 3 + i * 0.3) * 25;
        posAttr.array[i * 3 + 2] = Math.sin(angle[i]) * r;
      }
      posAttr.needsUpdate = true;
      points.rotation.y = t * 0.3;
      camera.position.x = Math.sin(t * 0.5) * 40;
      camera.position.y = Math.cos(t * 0.4) * 30;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const handleResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
