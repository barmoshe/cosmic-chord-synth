import { useEffect } from "react";
import * as THREE from "three";
import * as Tone from "tone";
import { isMobile, SCALES, type DrumName } from "../shared/constants";
import { clamp, haptic } from "../shared/helpers";
import { makeBgStars } from "../space/bgStars";
import { makeGalaxy, addDustLanes } from "../space/galaxy";
import { makeCentralStar } from "../space/centralStar";
import { makeRings } from "../space/rings";
import { makeNebulae } from "../space/nebulae";
import { makeShootingStars, stepShootingStars } from "../space/shootingStars";
import { makeDrumStars, createDrumPicker, updateDrumStars } from "../space/drumStars";
import { createParticles, spawnParticles, stepParticles } from "../space/particles";
import { createRipples, addRipple as addRippleFn, shockwave, stepRipples } from "../space/ripples";
import { makeFftBars, updateFftBars, tintFftBars } from "../space/fftBars";
import { createPostPipeline, renderPost } from "../space/postProcess";

export function useThreeScene(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioRef: React.MutableRefObject<any>,
  analysisRef: React.MutableRefObject<any>,
  fftBuffer: React.MutableRefObject<Float32Array>,
  scaleRef: React.MutableRefObject<string>,
  engineRef: React.MutableRefObject<any>,
  flashIntensity: React.MutableRefObject<number>,
  warpState: React.MutableRefObject<any>,
  frameCount: React.MutableRefObject<number>,
  rafRef: React.MutableRefObject<number | null>,
  analyze: () => void,
) {
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const PR = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0F1B2D, 0.00008);
    const camera = new THREE.PerspectiveCamera(72, W() / H(), 1, 12000);
    camera.position.z = 650;

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(PR);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x0F1B2D);

    const galaxyBuild = makeGalaxy(PR);
    scene.add(galaxyBuild.points);
    scene.add(makeBgStars(PR, galaxyBuild.material.uniforms));
    addDustLanes(scene, galaxyBuild.material);

    const { star, starMat, halo, haloMat } = makeCentralStar();
    scene.add(star); scene.add(halo);

    const rings = makeRings();
    for (const r of rings) scene.add(r);

    const nebulae = makeNebulae();
    for (const n of nebulae) scene.add(n);

    const shooting = makeShootingStars();
    scene.add(shooting.points);

    const { group: drumGroup, meshes: drumMeshes } = makeDrumStars();
    scene.add(drumGroup);
    const pickDrumStar = createDrumPicker(drumMeshes, camera, W, H);

    const { points: particlePoints, buffers: particles } = createParticles(PR);
    scene.add(particlePoints);

    const ripples = createRipples(scene);

    const { group: fftGroup, meshes: fftMeshes } = makeFftBars();
    scene.add(fftGroup);

    const pp = createPostPipeline(W(), H());

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollZ = 0;
    const onWheel = (e: WheelEvent) => { scrollZ += e.deltaY * 0.2; };
    const onMouseMove = (e: MouseEvent) => {
      mouse.tx = (e.clientX / W() - 0.5) * 2;
      mouse.ty = -(e.clientY / H() - 0.5) * 2;
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
      pp.resize(W(), H());
    };
    window.addEventListener("resize", onResize);

    function screenToWorld(x: number, y: number) {
      const ndc = new THREE.Vector3((x / W()) * 2 - 1, -(y / H()) * 2 + 1, 0.5);
      ndc.unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      return camera.position.clone().add(dir.multiplyScalar(280));
    }

    const djFx = { spinBoost: 0, whipPhase: 0 };

    function emitParticles(x: number, y: number, z: number, col: number[], count: number, vel: number) {
      spawnParticles(particles, x, y, z, col, count, vel);
    }
    function addRipple(x: number, y: number, z: number, col: number[], intensity = 1) {
      addRippleFn(ripples, x, y, z, col, intensity);
    }
    function sectionTransition(col: number[]) {
      if (0.7 > flashIntensity.current) flashIntensity.current = 0.7;
      shockwave(ripples, col, 2.4);
      djFx.whipPhase = 0.35;
      djFx.spinBoost = Math.min(djFx.spinBoost + 0.6, 1.2);
      tintFftBars(fftMeshes, col);
    }

    const _tmpWP = new THREE.Vector3();
    function triggerDrum(name: DrumName, vel: number, auto = false, audioTime?: number) {
      const v = clamp(vel, 0, 1);
      const m = drumMeshes.find((d) => d.userData.name === name);
      if (!m) return;
      audioRef.current?.triggerDrum?.(name, v, audioTime);
      const pulseBoost = auto ? 0.5 : 1.3;
      const particleCount = auto ? 3 + Math.floor(v * 4) : 6 + Math.floor(v * 10);
      const particleVel = auto ? 0.3 + v * 0.2 : 0.6 + v * 0.4;
      const rippleIntensity = auto ? 0.4 : 1;
      const runVisuals = () => {
        m.userData.pulse = Math.max(m.userData.pulse, v * pulseBoost);
        m.getWorldPosition(_tmpWP);
        emitParticles(_tmpWP.x, _tmpWP.y, _tmpWP.z, m.userData.col, particleCount, particleVel);
        addRipple(_tmpWP.x, _tmpWP.y, _tmpWP.z, m.userData.col, rippleIntensity);
        if (name === "kick") {
          const f = (auto ? 0.07 : 0.2) * v;
          if (f > flashIntensity.current) flashIntensity.current = f;
          const boost = (auto ? 0.05 : 0.18) * v;
          const cap = auto ? 0.2 : 0.6;
          djFx.spinBoost = Math.min(djFx.spinBoost + boost, cap);
        }
      };
      if (audioTime !== undefined) Tone.Draw.schedule(runVisuals, audioTime);
      else runVisuals();
      if (!auto) haptic(name === "kick" ? 15 : 6);
    }

    engineRef.current = {
      camera, addRipple, emitParticles,
      s2w: (x: number, y: number) => { const p = screenToWorld(x, y); return [p.x, p.y, p.z]; },
      flash: (v: number) => { if (v > flashIntensity.current) flashIntensity.current = v; },
      sectionTransition, triggerDrum, pickDrumStar,
    };

    const clock = new THREE.Clock();

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      const dt = clock.getDelta();
      const t = clock.getElapsedTime();
      const a = analysisRef.current;
      const fc = frameCount.current++;

      if (fc % 6 === 0) analyze();

      mouse.x += (mouse.tx - mouse.x) * 0.035;
      mouse.y += (mouse.ty - mouse.y) * 0.035;
      const warp = warpState.current;
      let targetZ = 650 + scrollZ;
      if (warp.on) { warp.t = Math.min(warp.t + 0.02, 1); targetZ = 650 - 450 * warp.t * warp.t + scrollZ; }
      camera.position.x += (mouse.x * 120 - camera.position.x) * 0.015;
      camera.position.y += (mouse.y * 80 - camera.position.y) * 0.015;
      camera.position.z += (targetZ - camera.position.z) * 0.035;
      camera.position.z = clamp(camera.position.z, 80, 1600);
      camera.lookAt(0, 0, 0);
      djFx.spinBoost *= 0.94;
      djFx.whipPhase *= 0.9;

      drumGroup.rotation.y = t * 0.08;
      updateDrumStars(drumMeshes, t, dt);

      flashIntensity.current *= 0.92;

      galaxyBuild.points.rotation.y = t * (0.015 + a.mid * 0.025 + djFx.spinBoost * 0.35) + djFx.whipPhase;
      const gu = galaxyBuild.material.uniforms;
      gu.uTime.value = t; gu.uBass.value = a.bass; gu.uTreble.value = a.treble;
      gu.uVol.value = a.vol; gu.uFlash.value = flashIntensity.current;

      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uBass.value = a.bass;
      starMat.uniforms.uPitch.value = a.pitch;
      star.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06 + a.bass * 2.5);

      haloMat.uniforms.uTime.value = t;
      haloMat.uniforms.uBass.value = a.bass;
      halo.scale.setScalar(1 + a.bass * 2);

      for (let i = 0; i < rings.length; i++) {
        rings[i].rotation.z = t * (0.06 + i * 0.03 + a.mid * 0.25);
        (rings[i].material as THREE.MeshBasicMaterial).opacity = 0.08 + a.mid * 0.25;
      }

      for (const n of nebulae) {
        (n.material as THREE.SpriteMaterial).opacity = n._baseOpacity + a.mid * 0.05 + a.vol * 0.02;
      }

      stepShootingStars(shooting.data, a.high);
      stepParticles(particles, a.bass);
      stepRipples(ripples);

      if (fc % 3 === 0) updateFftBars(fftMeshes, fftBuffer.current);

      renderPost(renderer, scene, camera, pp, a.treble, t, SCALES[scaleRef.current]?.mood || 0.5);
    }

    frame();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      pp.renderTarget.dispose();
      pp.bloomTarget1.dispose();
      pp.bloomTarget2.dispose();
      scene.traverse((o: any) => {
        o.geometry?.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose());
          else o.material.dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
