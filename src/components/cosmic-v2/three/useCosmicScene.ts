import { useEffect } from "react";
import * as THREE from "three";
import type { Body } from "../physics/types";
import type { ThemeDef } from "./themes";
import { THEMES } from "./themes";
import type { ThemeId } from "@/stores/v2Stores";
import { isMobile } from "@/components/cosmic-synth/constants";
import {
  BODY_VERT, BODY_FRAG,
  HALO_VERT, HALO_FRAG,
  STAR_POINT_VERT, STAR_POINT_FRAG,
  NEBULA_VERT, NEBULA_FRAG,
} from "./shaders";

interface SceneOpts {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  bodiesRef: React.MutableRefObject<Body[]>;
  themeRef: React.MutableRefObject<ThemeId>;
  reducedMotionRef: React.MutableRefObject<boolean>;
}

const BG_STAR_COUNT = isMobile ? 2200 : 4800;
const TRAIL_LENGTH = isMobile ? 80 : 140;
// Accent color pulled from the body base color, shifted toward white — gives
// the plasma shader a warm highlight without making every body look identical.
function accentFor(color: [number, number, number]): THREE.Color {
  return new THREE.Color(
    Math.min(1, color[0] * 0.6 + 0.5),
    Math.min(1, color[1] * 0.6 + 0.5),
    Math.min(1, color[2] * 0.6 + 0.5),
  );
}

// Nebula color triads per theme — kept outside the hook so hot reload can
// tune them without restarting the scene.
const NEBULA_PALETTE: Record<ThemeId, { a: [number, number, number]; b: [number, number, number]; c: [number, number, number] }> = {
  aurora: { a: [0.04, 0.09, 0.22], b: [0.08, 0.42, 0.55], c: [0.55, 0.30, 0.80] },
  ember:  { a: [0.10, 0.04, 0.06], b: [0.65, 0.20, 0.15], c: [0.95, 0.55, 0.25] },
  void:   { a: [0.02, 0.02, 0.06], b: [0.08, 0.08, 0.15], c: [0.22, 0.22, 0.40] },
  tidal:  { a: [0.02, 0.08, 0.14], b: [0.08, 0.35, 0.60], c: [0.30, 0.80, 0.95] },
};

export function useCosmicScene({ canvasRef, bodiesRef, themeRef, reducedMotionRef }: SceneOpts) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // WebGL availability — fail soft if the browser blocks GL (rare but real).
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 1);
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    resize();

    const scene = new THREE.Scene();
    const theme: ThemeDef = THEMES[themeRef.current] ?? THEMES.aurora;

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 240, 680);
    camera.lookAt(0, 0, 0);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      resize();
    };
    window.addEventListener("resize", onResize);

    /* ──────────────────────────────────────────────────────────────
       Nebula sky — inverted sphere rendered with a raymarched fbm
       shader. Sits at r=2800, depth-tested out so bodies always draw
       on top. Replaces the old flat background color.
    ─────────────────────────────────────────────────────────────── */
    const palette = NEBULA_PALETTE[themeRef.current] ?? NEBULA_PALETTE.aurora;
    const nebulaGeo = new THREE.SphereGeometry(2800, 32, 24);
    const nebulaMat = new THREE.ShaderMaterial({
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color(...palette.a) },
        uColorB: { value: new THREE.Color(...palette.b) },
        uColorC: { value: new THREE.Color(...palette.c) },
        uIntensity: { value: 1.1 },
      },
    });
    const nebula = new THREE.Mesh(nebulaGeo, nebulaMat);
    scene.add(nebula);

    /* ──────────────────────────────────────────────────────────────
       Shader-based starfield. Point sprites with twinkle + diffraction
       spikes, additive blending for an HDR-like glow on hero stars.
    ─────────────────────────────────────────────────────────────── */
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(BG_STAR_COUNT * 3);
    const bgCol = new Float32Array(BG_STAR_COUNT * 3);
    const bgSize = new Float32Array(BG_STAR_COUNT);
    const bgSeed = new Float32Array(BG_STAR_COUNT);
    for (let i = 0; i < BG_STAR_COUNT; i++) {
      const r = 1800 + Math.random() * 700;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      bgPos[i * 3 + 1] = r * Math.cos(phi);
      bgPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const b = 0.45 + Math.random() * 0.55;
      bgCol[i * 3 + 0] = theme.starTint[0] * b;
      bgCol[i * 3 + 1] = theme.starTint[1] * b;
      bgCol[i * 3 + 2] = theme.starTint[2] * b;
      // Exponential size distribution — a few hero stars, many faint ones.
      bgSize[i] = Math.pow(Math.random(), 3) * 2.6 + 0.4;
      bgSeed[i] = Math.random();
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    bgGeo.setAttribute("aSize", new THREE.BufferAttribute(bgSize, 1));
    bgGeo.setAttribute("aSeed", new THREE.BufferAttribute(bgSeed, 1));
    const bgMat = new THREE.ShaderMaterial({
      vertexShader: STAR_POINT_VERT,
      fragmentShader: STAR_POINT_FRAG,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
      },
    });
    const bgStars = new THREE.Points(bgGeo, bgMat);
    scene.add(bgStars);

    /* ──────────────────────────────────────────────────────────────
       Body + halo + trail pools keyed by body id.
    ─────────────────────────────────────────────────────────────── */
    type BodyVisual = {
      mesh: THREE.Mesh;
      halo: THREE.Mesh;
      light?: THREE.PointLight;
      bodyMat: THREE.ShaderMaterial;
      haloMat: THREE.ShaderMaterial;
      pulse: number;
    };
    const visuals = new Map<number, BodyVisual>();
    const bodyGroup = new THREE.Group();
    const haloGroup = new THREE.Group();
    scene.add(haloGroup);
    scene.add(bodyGroup);

    type TrailVisual = {
      line: THREE.Line;
      positions: Float32Array;
      alphas: Float32Array;
      head: number;
      filled: number;
      mat: THREE.LineBasicMaterial;
    };
    const trails = new Map<number, TrailVisual>();
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);

    function buildHaloMesh(b: Body): { mesh: THREE.Mesh; mat: THREE.ShaderMaterial } {
      // Halo is a quad shaded as a radial glow; scale is driven by the shader.
      const geo = new THREE.PlaneGeometry(1, 1);
      const mat = new THREE.ShaderMaterial({
        vertexShader: HALO_VERT,
        fragmentShader: HALO_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uColor: { value: accentFor(b.color) },
          uIntensity: { value: b.kind === "core" ? 1.3 : 0.7 },
          uScale: { value: b.radius * (b.kind === "core" ? 10 : 6) },
          uTime: { value: 0 },
        },
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      return { mesh, mat };
    }

    function ensureVisual(b: Body): BodyVisual {
      let v = visuals.get(b.id);
      if (v) return v;
      const geo = new THREE.SphereGeometry(b.radius, b.kind === "core" ? 48 : 24, b.kind === "core" ? 36 : 18);
      const bodyMat = new THREE.ShaderMaterial({
        vertexShader: BODY_VERT,
        fragmentShader: BODY_FRAG,
        uniforms: {
          uTime: { value: 0 },
          uPulse: { value: 0 },
          uDisplace: { value: b.kind === "core" ? 0.8 : 0.35 },
          uColor: { value: new THREE.Color(b.color[0], b.color[1], b.color[2]) },
          uAccent: { value: accentFor(b.color) },
          uRimStrength: { value: b.kind === "core" ? 1.4 : 0.9 },
        },
      });
      const mesh = new THREE.Mesh(geo, bodyMat);
      bodyGroup.add(mesh);

      const { mesh: haloMesh, mat: haloMat } = buildHaloMesh(b);
      haloGroup.add(haloMesh);

      v = { mesh, halo: haloMesh, bodyMat, haloMat, pulse: 0 };
      if (b.kind === "core") {
        v.light = new THREE.PointLight(new THREE.Color(b.color[0], b.color[1], b.color[2]), 2.4, 1400, 2);
        scene.add(v.light);
      }
      visuals.set(b.id, v);

      if (b.kind !== "core") {
        const positions = new Float32Array(TRAIL_LENGTH * 3);
        const alphas = new Float32Array(TRAIL_LENGTH);
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          positions[i * 3 + 0] = b.pos[0];
          positions[i * 3 + 1] = b.pos[1];
          positions[i * 3 + 2] = b.pos[2];
        }
        const tgeo = new THREE.BufferGeometry();
        tgeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        tgeo.setDrawRange(0, 0);
        // LineBasicMaterial with vertexColors would give gradient but costs
        // more setup. Here we fake the tail fade by offsetting opacity each
        // frame and keeping the mesh at moderate opacity; the additive blend
        // + halo sprite hides the visible line head.
        const mat = new THREE.LineBasicMaterial({
          color: new THREE.Color(b.color[0], b.color[1], b.color[2]),
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(tgeo, mat);
        line.frustumCulled = false;
        trailGroup.add(line);
        trails.set(b.id, { line, positions, alphas, head: 0, filled: 0, mat });
      }
      return v;
    }

    function disposeVisual(id: number) {
      const v = visuals.get(id);
      if (v) {
        bodyGroup.remove(v.mesh);
        haloGroup.remove(v.halo);
        v.mesh.geometry.dispose();
        v.halo.geometry.dispose();
        v.bodyMat.dispose();
        v.haloMat.dispose();
        if (v.light) scene.remove(v.light);
        visuals.delete(id);
      }
      const t = trails.get(id);
      if (t) {
        trailGroup.remove(t.line);
        t.line.geometry.dispose();
        t.mat.dispose();
        trails.delete(id);
      }
    }

    let raf: number | null = null;
    let lastT = performance.now();
    let clock = 0;

    function render(t: number) {
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      clock = t / 1000;
      const bodies = bodiesRef.current;
      const alive = new Set<number>();

      // Update nebula time so clouds drift.
      nebulaMat.uniforms.uTime.value = clock;
      bgMat.uniforms.uTime.value = clock;

      for (const b of bodies) {
        alive.add(b.id);
        const v = ensureVisual(b);
        v.mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
        v.halo.position.set(b.pos[0], b.pos[1], b.pos[2]);

        // Pulse decays exponentially so a recent note-event lights the body up
        // briefly. The audio bridge doesn't publish to the scene directly, so
        // we derive a subtle base pulse from orbital speed — faster = hotter.
        const speed = Math.hypot(b.vel[0], b.vel[1], b.vel[2]);
        const targetPulse = Math.min(0.6, speed * 0.006);
        v.pulse += (targetPulse - v.pulse) * Math.min(1, dt * 4);
        v.bodyMat.uniforms.uTime.value = clock;
        v.bodyMat.uniforms.uPulse.value = v.pulse;
        v.haloMat.uniforms.uTime.value = clock;
        // Core breathes with a slow sinusoidal on top of the speed-pulse.
        if (b.kind === "core") {
          const breathe = 0.5 + 0.5 * Math.sin(clock * 0.55);
          v.haloMat.uniforms.uIntensity.value = 1.1 + breathe * 0.6;
        } else {
          v.haloMat.uniforms.uIntensity.value = 0.6 + v.pulse * 1.2;
        }

        // Update trail ring buffer. One sample per render frame — smooth tails
        // because velocity is now capped at 140 units/s.
        const tv = trails.get(b.id);
        if (tv) {
          const i = tv.head * 3;
          tv.positions[i + 0] = b.pos[0];
          tv.positions[i + 1] = b.pos[1];
          tv.positions[i + 2] = b.pos[2];
          tv.head = (tv.head + 1) % TRAIL_LENGTH;
          tv.filled = Math.min(TRAIL_LENGTH, tv.filled + 1);
          const attr = tv.line.geometry.getAttribute("position") as THREE.BufferAttribute;
          const start = (tv.head - tv.filled + TRAIL_LENGTH) % TRAIL_LENGTH;
          for (let k = 0; k < tv.filled; k++) {
            const src = ((start + k) % TRAIL_LENGTH) * 3;
            (attr.array as Float32Array)[k * 3 + 0] = tv.positions[src + 0];
            (attr.array as Float32Array)[k * 3 + 1] = tv.positions[src + 1];
            (attr.array as Float32Array)[k * 3 + 2] = tv.positions[src + 2];
          }
          attr.needsUpdate = true;
          tv.line.geometry.setDrawRange(0, tv.filled);
        }
      }

      // Dispose visuals for bodies that no longer exist.
      for (const id of Array.from(visuals.keys())) {
        if (!alive.has(id)) disposeVisual(id);
      }

      // Slow camera orbit — gentler than v1's to stay ambient.
      if (!reducedMotionRef.current) {
        const orbitR = 720;
        const angle = clock * 0.035;
        camera.position.x = Math.cos(angle) * orbitR;
        camera.position.z = Math.sin(angle) * orbitR;
        camera.position.y = 220 + Math.sin(clock * 0.11) * 48;
        camera.lookAt(0, 0, 0);
      }

      // Nebula + starfield co-rotate very slightly to add parallax.
      bgStars.rotation.y = clock * 0.0025;
      nebula.rotation.y = clock * 0.001;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      nebulaGeo.dispose();
      nebulaMat.dispose();
      bgGeo.dispose();
      bgMat.dispose();
      for (const id of Array.from(visuals.keys())) disposeVisual(id);
      renderer.dispose();
    };
  }, [canvasRef, bodiesRef, themeRef, reducedMotionRef]);
}
