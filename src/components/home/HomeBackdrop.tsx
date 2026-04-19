import { useEffect, useRef } from "react";
import * as THREE from "three";
import { isMobile } from "@/components/biome-synth/shared/constants";
import { GALAXY_FRAG, GALAXY_VERT } from "@/components/biome-synth/shared/shaders";
import { useHomeState } from "./HomeStateContext";

const PALETTE: THREE.Color[] = [
  new THREE.Color("#cfe9ff"), // cool white-blue (most stars)
  new THREE.Color("#cfe9ff"),
  new THREE.Color("#cfe9ff"),
  new THREE.Color("#a8d6ff"),
  new THREE.Color("#6ce5ff"), // cyan
  new THREE.Color("#9a7cff"), // periwinkle
  new THREE.Color("#3cc38a"), // teal-mint
  new THREE.Color("#ff8ad6"), // magenta-rose
  new THREE.Color("#ffd84d"), // gold spark
];

function hasWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const cv = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (cv.getContext("webgl") || cv.getContext("experimental-webgl")));
  } catch {
    return false;
  }
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function HomeBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fallbackRef = useRef<HTMLDivElement | null>(null);
  const { stage, getFFT } = useHomeState();
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const getFFTRef = useRef(getFFT);
  getFFTRef.current = getFFT;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!hasWebGL()) {
      if (fallbackRef.current) fallbackRef.current.style.opacity = "1";
      return;
    }

    const reducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const dprCap = isMobile ? 1.5 : 2;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(W(), H());
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W() / H(), 1, 5000);
    camera.position.set(0, 0, 720);
    camera.lookAt(0, 0, 0);

    const count = isMobile ? 380 : 1200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const rands = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // Spiral-ish galaxy disk: bias points to a flattened distribution with a soft core.
      const arm = Math.floor(Math.random() * 3);
      const armAngle = (arm * Math.PI * 2) / 3;
      const radius = 80 + Math.pow(Math.random(), 0.55) * 950;
      const swirl = (radius / 320) * 1.4;
      const a = armAngle + swirl + (Math.random() - 0.5) * 0.9;
      const y = (Math.random() - 0.5) * (110 + radius * 0.18);

      positions[i * 3] = Math.cos(a) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = Math.sin(a) * radius;

      const c = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      const sizeBias = Math.random() < 0.05 ? 4.2 : 1.4 + Math.random() * 1.8;
      sizes[i] = sizeBias;
      rands[i] = Math.random();
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rands, 1));

    const uniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uBass: { value: 0 },
      uTreble: { value: 0 },
      uVol: { value: 0 },
      uFlash: { value: 0 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: GALAXY_VERT,
      fragmentShader: GALAXY_FRAG,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let pointerX = 0;
    let pointerY = 0;
    let cameraX = 0;
    let cameraY = 0;
    let smoothBass = 0;
    let smoothTreble = 0;
    let smoothVol = 0;
    let smoothFlash = 0;

    const supportsPointer = !isMobile && typeof window.matchMedia === "function" && window.matchMedia("(pointer: fine)").matches;

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    if (supportsPointer) {
      window.addEventListener("pointermove", handlePointerMove, { passive: true });
    }

    const handleResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", handleResize);

    const start = performance.now();
    let rafId = 0;

    // Aggregate FFT (dB scale, ~ -100..0) into bass/mid/treble bands.
    const readFftBands = (): { bass: number; treble: number; vol: number } => {
      const buf = getFFTRef.current();
      if (!buf || buf.length === 0) return { bass: 0, treble: 0, vol: 0 };
      const n = buf.length;
      const bassEnd = Math.max(2, Math.floor(n * 0.12));
      const trebleStart = Math.floor(n * 0.55);
      let bass = 0;
      let treble = 0;
      let total = 0;
      for (let i = 0; i < n; i += 1) {
        const v = (buf[i] + 100) / 100; // -> ~0..1
        const norm = v < 0 ? 0 : v > 1 ? 1 : v;
        if (i < bassEnd) bass += norm;
        if (i >= trebleStart) treble += norm;
        total += norm;
      }
      bass /= bassEnd;
      treble /= Math.max(1, n - trebleStart);
      total /= n;
      return { bass, treble, vol: total };
    };

    const renderFrame = (time: number) => {
      const t = (time - start) * 0.001;
      uniforms.uTime.value = t;

      const isListening = stageRef.current === "listening";
      const idleBass = (Math.sin(t * 0.42) * 0.5 + 0.5) * 0.18 + 0.05;
      const idleTreble = (Math.sin(t * 0.71 + 1.3) * 0.5 + 0.5) * 0.14 + 0.04;
      const idleVol = (Math.sin(t * 0.31 + 2.1) * 0.5 + 0.5) * 0.18 + 0.06;

      let targetBass = idleBass;
      let targetTreble = idleTreble;
      let targetVol = idleVol;
      let targetFlash = 0;

      if (isListening) {
        const { bass, treble, vol } = readFftBands();
        // Audio bands tend to sit in 0.2..0.6; rescale toward shader-friendly 0..1.
        targetBass = Math.min(1, bass * 1.6);
        targetTreble = Math.min(1, treble * 2.0);
        targetVol = Math.min(1, vol * 1.4);
        // Flash on bass spikes only.
        if (targetBass > smoothBass + 0.15) {
          targetFlash = Math.min(1, targetBass * 1.1);
        }
      }

      smoothBass = lerp(smoothBass, targetBass, 0.12);
      smoothTreble = lerp(smoothTreble, targetTreble, 0.18);
      smoothVol = lerp(smoothVol, targetVol, 0.1);
      smoothFlash = lerp(smoothFlash, targetFlash, 0.25);

      uniforms.uBass.value = smoothBass;
      uniforms.uTreble.value = smoothTreble;
      uniforms.uVol.value = smoothVol;
      uniforms.uFlash.value = smoothFlash;

      // Pointer parallax — eased toward target.
      cameraX = lerp(cameraX, pointerX * 60, 0.04);
      cameraY = lerp(cameraY, -pointerY * 35, 0.04);
      camera.position.x = cameraX;
      camera.position.y = cameraY;
      camera.lookAt(0, 0, 0);

      points.rotation.y = t * 0.04;
      points.rotation.z = Math.sin(t * 0.07) * 0.05;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(renderFrame);
    };

    if (reducedMotion) {
      uniforms.uBass.value = 0.18;
      uniforms.uTreble.value = 0.12;
      uniforms.uVol.value = 0.2;
      renderer.render(scene, camera);
    } else {
      rafId = requestAnimationFrame(renderFrame);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", handleResize);
      if (supportsPointer) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-0 h-full w-full" aria-hidden="true" />
      <div
        ref={fallbackRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-0 transition-opacity duration-700 bg-[radial-gradient(ellipse_at_center,#162a55_0%,#06091c_55%,#03040d_100%)]"
      />
    </>
  );
}
