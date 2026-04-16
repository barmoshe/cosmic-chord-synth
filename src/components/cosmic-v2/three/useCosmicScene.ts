import { useEffect } from "react";
import * as THREE from "three";
import type { Body } from "../physics/types";
import type { ThemeDef } from "./themes";
import { THEMES } from "./themes";
import type { ThemeId } from "@/stores/v2Stores";
import { isMobile } from "@/components/cosmic-synth/constants";

interface SceneOpts {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  bodiesRef: React.MutableRefObject<Body[]>;
  themeRef: React.MutableRefObject<ThemeId>;
  reducedMotionRef: React.MutableRefObject<boolean>;
  onCanvasPoint?: (clientX: number, clientY: number) => [number, number, number] | null;
}

const BG_STAR_COUNT = isMobile ? 1500 : 3500;
const TRAIL_LENGTH = 60;

export function useCosmicScene({ canvasRef, bodiesRef, themeRef, reducedMotionRef }: SceneOpts) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isMobile,
      alpha: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    resize();

    const scene = new THREE.Scene();
    const theme: ThemeDef = THEMES[themeRef.current] ?? THEMES.aurora;
    scene.background = new THREE.Color(theme.background[0], theme.background[1], theme.background[2]);
    scene.fog = new THREE.FogExp2(scene.background.getHex(), theme.fog);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.set(0, 240, 680);
    camera.lookAt(0, 0, 0);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      resize();
    };
    window.addEventListener("resize", onResize);

    // Background stars
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(BG_STAR_COUNT * 3);
    const bgCol = new Float32Array(BG_STAR_COUNT * 3);
    for (let i = 0; i < BG_STAR_COUNT; i++) {
      const r = 2000 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      bgPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      bgPos[i * 3 + 1] = r * Math.cos(phi);
      bgPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
      const b = 0.5 + Math.random() * 0.5;
      bgCol[i * 3 + 0] = theme.starTint[0] * b;
      bgCol[i * 3 + 1] = theme.starTint[1] * b;
      bgCol[i * 3 + 2] = theme.starTint[2] * b;
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    const bgMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const bgStars = new THREE.Points(bgGeo, bgMat);
    scene.add(bgStars);

    // Body meshes — we keep a pool keyed by body id
    type BodyVisual = { mesh: THREE.Mesh; light?: THREE.PointLight };
    const visuals = new Map<number, BodyVisual>();
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // Orbit trails — one line per non-core body
    type TrailVisual = {
      line: THREE.Line;
      positions: Float32Array;
      head: number;
      filled: number;
    };
    const trails = new Map<number, TrailVisual>();
    const trailGroup = new THREE.Group();
    scene.add(trailGroup);

    function ensureVisual(b: Body): BodyVisual {
      let v = visuals.get(b.id);
      if (v) return v;
      const geo = new THREE.SphereGeometry(b.radius, b.kind === "core" ? 32 : 16, b.kind === "core" ? 24 : 12);
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(b.color[0], b.color[1], b.color[2]),
        transparent: true,
        opacity: b.kind === "core" ? 0.95 : 0.9,
      });
      const mesh = new THREE.Mesh(geo, mat);
      bodyGroup.add(mesh);
      v = { mesh };
      if (b.kind === "core") {
        v.light = new THREE.PointLight(new THREE.Color(b.color[0], b.color[1], b.color[2]), 1.2, 900, 2);
        scene.add(v.light);
      }
      visuals.set(b.id, v);

      // Init trail for non-core bodies
      if (b.kind !== "core") {
        const positions = new Float32Array(TRAIL_LENGTH * 3);
        for (let i = 0; i < TRAIL_LENGTH; i++) {
          positions[i * 3 + 0] = b.pos[0];
          positions[i * 3 + 1] = b.pos[1];
          positions[i * 3 + 2] = b.pos[2];
        }
        const tgeo = new THREE.BufferGeometry();
        tgeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        tgeo.setDrawRange(0, 0);
        const tmat = new THREE.LineBasicMaterial({
          color: new THREE.Color(b.color[0], b.color[1], b.color[2]),
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        });
        const line = new THREE.Line(tgeo, tmat);
        trailGroup.add(line);
        trails.set(b.id, { line, positions, head: 0, filled: 0 });
      }
      return v;
    }

    function disposeVisual(id: number) {
      const v = visuals.get(id);
      if (v) {
        bodyGroup.remove(v.mesh);
        v.mesh.geometry.dispose();
        (v.mesh.material as THREE.Material).dispose();
        if (v.light) scene.remove(v.light);
        visuals.delete(id);
      }
      const t = trails.get(id);
      if (t) {
        trailGroup.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
        trails.delete(id);
      }
    }

    let raf: number | null = null;
    let clock = 0;

    function render(t: number) {
      clock = t / 1000;
      const bodies = bodiesRef.current;
      const alive = new Set<number>();

      for (const b of bodies) {
        alive.add(b.id);
        const v = ensureVisual(b);
        v.mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);

        // Pulse core with age — subtle breathing
        if (b.kind === "core") {
          const pulse = 1 + Math.sin(clock * 0.5) * 0.04;
          v.mesh.scale.setScalar(pulse);
        }

        // Update trail
        const tv = trails.get(b.id);
        if (tv) {
          const i = tv.head * 3;
          tv.positions[i + 0] = b.pos[0];
          tv.positions[i + 1] = b.pos[1];
          tv.positions[i + 2] = b.pos[2];
          tv.head = (tv.head + 1) % TRAIL_LENGTH;
          tv.filled = Math.min(TRAIL_LENGTH, tv.filled + 1);
          // Rebuild ordered position buffer (cheap for small TRAIL_LENGTH)
          const attr = tv.line.geometry.getAttribute("position") as THREE.BufferAttribute;
          const start = (tv.head - tv.filled + TRAIL_LENGTH) % TRAIL_LENGTH;
          for (let k = 0; k < tv.filled; k++) {
            const src = ((start + k) % TRAIL_LENGTH) * 3;
            attr.array[k * 3 + 0] = tv.positions[src + 0];
            attr.array[k * 3 + 1] = tv.positions[src + 1];
            attr.array[k * 3 + 2] = tv.positions[src + 2];
          }
          attr.needsUpdate = true;
          tv.line.geometry.setDrawRange(0, tv.filled);
        }
      }

      // Dispose visuals for bodies that no longer exist
      for (const id of Array.from(visuals.keys())) {
        if (!alive.has(id)) disposeVisual(id);
      }

      // Slow camera orbit unless reduced motion
      if (!reducedMotionRef.current) {
        const orbitR = 720;
        const angle = clock * 0.04;
        camera.position.x = Math.cos(angle) * orbitR;
        camera.position.z = Math.sin(angle) * orbitR;
        camera.position.y = 240 + Math.sin(clock * 0.12) * 40;
        camera.lookAt(0, 0, 0);
      }

      // Keep background stars gently co-rotating to hide camera drift
      bgStars.rotation.y = clock * 0.002;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    }
    raf = requestAnimationFrame(render);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      bgGeo.dispose();
      bgMat.dispose();
      for (const id of Array.from(visuals.keys())) disposeVisual(id);
      renderer.dispose();
    };
  }, [canvasRef, bodiesRef, themeRef, reducedMotionRef]);
}
