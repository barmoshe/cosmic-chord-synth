import { useEffect } from "react";
import * as THREE from "three";
import { isMobile, GALAXY_COUNT, PARTICLE_POOL, RIPPLE_POOL, FFT_BARS, SCALES, PAL } from "./constants";
import { clamp, lerp } from "./helpers";
import { GALAXY_VERT, GALAXY_FRAG, PARTICLE_VERT, PARTICLE_FRAG, STAR_VERT, STAR_FRAG, HALO_FRAG, PP_VERT, BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG } from "./shaders";

export function useThreeScene(
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
  audioRef: React.MutableRefObject<any>,
  analysisRef: React.MutableRefObject<any>,
  fftBuffer: React.MutableRefObject<Float32Array>,
  scaleRef: React.MutableRefObject<string>,
  engineRef: React.MutableRefObject<any>,
  flashIntensity: React.MutableRefObject<number>,
  warpState: React.MutableRefObject<any>,
  gyroRef: React.MutableRefObject<any>,
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
    scene.fog = new THREE.FogExp2(0x010005, 0.00008);
    const camera = new THREE.PerspectiveCamera(72, W() / H(), 1, 12000);
    camera.position.z = 650;

    const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: !isMobile, powerPreference: "high-performance" });
    renderer.setSize(W(), H());
    renderer.setPixelRatio(PR);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.setClearColor(0x010005);

    // ── Background star field — distant fixed stars ──
    const bgStarCount = isMobile ? 2000 : 4000;
    const bgGeo = new THREE.BufferGeometry();
    const bgPos = new Float32Array(bgStarCount * 3);
    const bgCol = new Float32Array(bgStarCount * 3);
    const bgSize = new Float32Array(bgStarCount);
    const bgRand = new Float32Array(bgStarCount);
    for (let i = 0; i < bgStarCount; i++) {
      // Distribute on a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3000 + Math.random() * 5000;
      bgPos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      bgPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      bgPos[i * 3 + 2] = Math.cos(phi) * r;
      // Realistic star temperature colors
      const temp = Math.random();
      if (temp < 0.1) { bgCol[i*3]=1; bgCol[i*3+1]=0.6; bgCol[i*3+2]=0.3; } // red/orange
      else if (temp < 0.3) { bgCol[i*3]=1; bgCol[i*3+1]=0.9; bgCol[i*3+2]=0.7; } // warm white
      else if (temp < 0.7) { bgCol[i*3]=0.9; bgCol[i*3+1]=0.92; bgCol[i*3+2]=1; } // white
      else { bgCol[i*3]=0.7; bgCol[i*3+1]=0.8; bgCol[i*3+2]=1; } // blue-white
      const b = 0.3 + Math.random() * 0.7;
      bgCol[i*3] *= b; bgCol[i*3+1] *= b; bgCol[i*3+2] *= b;
      bgSize[i] = 0.5 + Math.random() * 1.5;
      bgRand[i] = Math.random();
    }
    bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPos, 3));
    bgGeo.setAttribute("color", new THREE.BufferAttribute(bgCol, 3));
    bgGeo.setAttribute("aSize", new THREE.BufferAttribute(bgSize, 1));
    bgGeo.setAttribute("aRand", new THREE.BufferAttribute(bgRand, 1));

    // ── Galaxy Stars — Realistic spiral ──
    const galaxyGeo = new THREE.BufferGeometry();
    const gPos = new Float32Array(GALAXY_COUNT * 3);
    const gCol = new Float32Array(GALAXY_COUNT * 3);
    const gSize = new Float32Array(GALAXY_COUNT);
    const gRand = new Float32Array(GALAXY_COUNT);

    const ARM_COUNT = 4;
    const TWIST_FACTOR = 0.0035;
    const ARM_SPREAD = 0.35;

    for (let i = 0; i < GALAXY_COUNT; i++) {
      const arm = i % ARM_COUNT;
      const baseAngle = (arm / ARM_COUNT) * Math.PI * 2;
      const t = Math.random();
      const radius = 15 + Math.pow(t, 0.6) * 980;

      // Logarithmic spiral with spread
      const spiralAngle = baseAngle + radius * TWIST_FACTOR + (Math.random() - 0.5) * ARM_SPREAD * (1 + radius * 0.0008);

      const x = Math.cos(spiralAngle) * radius;
      const z = Math.sin(spiralAngle) * radius;
      // Thin disk with bulge in center
      const diskThickness = 12 * Math.exp(-radius * 0.003) + 3;
      const y = (Math.random() - 0.5) * diskThickness * (1 + (Math.random() < 0.02 ? 8 : 1));

      gPos[i * 3] = x; gPos[i * 3 + 1] = y; gPos[i * 3 + 2] = z;

      // Realistic star colors — core is warm/yellow, arms are blue/white, scattered red giants
      const coreInfluence = Math.exp(-radius * 0.004);
      const isRedGiant = Math.random() < 0.03;
      const isBlueGiant = Math.random() < 0.06 && radius > 200;

      let r: number, g: number, b: number;
      if (isRedGiant) {
        r = 1; g = 0.4 + Math.random() * 0.2; b = 0.1 + Math.random() * 0.1;
      } else if (isBlueGiant) {
        r = 0.6 + Math.random() * 0.2; g = 0.7 + Math.random() * 0.2; b = 1;
      } else {
        // Mix between warm core and cool arm stars
        const temp = coreInfluence * 0.8 + Math.random() * 0.3;
        r = 0.8 + temp * 0.2;
        g = 0.7 + (1 - temp) * 0.3;
        b = 0.5 + (1 - temp) * 0.5;
      }

      const brightness = (0.3 + Math.random() * 0.7) * (0.5 + coreInfluence * 1.5);
      gCol[i * 3] = r * brightness;
      gCol[i * 3 + 1] = g * brightness;
      gCol[i * 3 + 2] = b * brightness;
      gSize[i] = (0.8 + Math.random() * 2.5) * (1 + coreInfluence * 3);
      gRand[i] = Math.random();
    }
    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(gCol, 3));
    galaxyGeo.setAttribute("aSize", new THREE.BufferAttribute(gSize, 1));
    galaxyGeo.setAttribute("aRand", new THREE.BufferAttribute(gRand, 1));
    const galaxyMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: PR }, uBass: { value: 0 }, uTreble: { value: 0 }, uVol: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    const galaxy = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxy);

    // ── Background starfield ──
    const bgMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: PR }, uBass: { value: 0 }, uTreble: { value: 0 }, uVol: { value: 0 }, uFlash: { value: 0 } },
      vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(bgGeo, bgMat));

    // ── Dust lanes (dark matter feel) ──
    for (let d = 0; d < 3; d++) {
      const dustGeo = new THREE.BufferGeometry();
      const dustCount = isMobile ? 600 : 1200;
      const dustPos = new Float32Array(dustCount * 3);
      const dustCol = new Float32Array(dustCount * 3);
      const dustSize = new Float32Array(dustCount);
      const dustRand = new Float32Array(dustCount);
      for (let i = 0; i < dustCount; i++) {
        const arm = (d + i % 2) % ARM_COUNT;
        const baseAngle = (arm / ARM_COUNT) * Math.PI * 2 + 0.15;
        const radius = 80 + Math.pow(Math.random(), 0.5) * 700;
        const angle = baseAngle + radius * TWIST_FACTOR * 0.95 + (Math.random() - 0.5) * 0.2;
        dustPos[i * 3] = Math.cos(angle) * radius;
        dustPos[i * 3 + 1] = (Math.random() - 0.5) * 6;
        dustPos[i * 3 + 2] = Math.sin(angle) * radius;
        const warmth = 0.5 + Math.random() * 0.5;
        dustCol[i * 3] = 0.15 * warmth; dustCol[i * 3 + 1] = 0.08 * warmth; dustCol[i * 3 + 2] = 0.2 * warmth;
        dustSize[i] = 6 + Math.random() * 14;
        dustRand[i] = Math.random();
      }
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      dustGeo.setAttribute("color", new THREE.BufferAttribute(dustCol, 3));
      dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dustSize, 1));
      dustGeo.setAttribute("aRand", new THREE.BufferAttribute(dustRand, 1));
      const dustMat = new THREE.ShaderMaterial({
        uniforms: galaxyMat.uniforms,
        vertexShader: GALAXY_VERT, fragmentShader: GALAXY_FRAG,
        transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Points(dustGeo, dustMat));
    }

    // ── Central Star ──
    const starGeo = new THREE.IcosahedronGeometry(18, 5);
    const starMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBass: { value: 0 }, uPitch: { value: 0 } },
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
    });
    const star = new THREE.Mesh(starGeo, starMat);
    scene.add(star);

    // ── Halo ──
    const haloGeo = new THREE.SphereGeometry(50, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uBass: { value: 0 } },
      vertexShader: STAR_VERT.replace('p += normal', '// p += normal').replace('p += normal', '// p += normal'),
      fragmentShader: HALO_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // ── Orbital Rings ──
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < 4; i++) {
      const rGeo = new THREE.RingGeometry(85 + i * 50, 86.5 + i * 50, 128);
      const rMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(PAL[i % PAL.length][0], PAL[i % PAL.length][1], PAL[i % PAL.length][2]),
        transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
      });
      const ring = new THREE.Mesh(rGeo, rMat);
      ring.rotation.x = 0.2 + i * 0.3;
      ring.rotation.y = i * 0.5;
      scene.add(ring);
      rings.push(ring);
    }

    // ── Nebulae — photorealistic multi-layer ──
    const nebulae: (THREE.Sprite & { _baseOpacity: number })[] = [];
    const nebulaColors = [
      [0.1, 0.3, 1.0],   // Deep blue emission
      [0.8, 0.1, 0.4],   // Hydrogen alpha pink
      [0.2, 0.8, 0.6],   // Oxygen teal
      [0.6, 0.15, 0.9],  // Violet
      [1.0, 0.4, 0.1],   // Warm orange
      [0.1, 0.6, 1.0],   // Bright blue
      [0.9, 0.2, 0.6],   // Magenta
      [0.3, 1.0, 0.7],   // Green emission
      [0.5, 0.2, 0.8],   // Purple
      [0.9, 0.6, 0.2],   // Gold
      [0.15, 0.4, 0.9],  // Steel blue
      [0.7, 0.1, 0.3],   // Deep red
      [0.2, 0.9, 0.9],   // Cyan
      [0.8, 0.3, 0.7],   // Orchid
    ];
    const nebulaCount = isMobile ? 10 : 16;
    for (let i = 0; i < nebulaCount; i++) {
      const c = document.createElement("canvas"); c.width = 512; c.height = 512;
      const ctx = c.getContext("2d")!;
      const ci = nebulaColors[i % nebulaColors.length];
      // Multi-pass for volumetric depth
      for (let pass = 0; pass < 3; pass++) {
        const cx = 256 + (Math.random() - 0.5) * 100;
        const cy = 256 + (Math.random() - 0.5) * 100;
        const radius = 160 + Math.random() * 80;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const alpha = pass === 0 ? 0.14 : pass === 1 ? 0.08 : 0.04;
        grad.addColorStop(0, `rgba(${Math.round(ci[0]*255)},${Math.round(ci[1]*255)},${Math.round(ci[2]*255)},${alpha})`);
        grad.addColorStop(0.25, `rgba(${Math.round(ci[0]*200)},${Math.round(ci[1]*200)},${Math.round(ci[2]*200)},${alpha*0.6})`);
        grad.addColorStop(0.5, `rgba(${Math.round(ci[0]*140)},${Math.round(ci[1]*140)},${Math.round(ci[2]*140)},${alpha*0.3})`);
        grad.addColorStop(0.8, `rgba(${Math.round(ci[0]*80)},${Math.round(ci[1]*80)},${Math.round(ci[2]*80)},${alpha*0.1})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
      }
      // Add a subtle secondary color blend
      const ci2 = nebulaColors[(i + 3) % nebulaColors.length];
      const grad3 = ctx.createRadialGradient(300, 200, 0, 300, 200, 180);
      grad3.addColorStop(0, `rgba(${Math.round(ci2[0]*255)},${Math.round(ci2[1]*255)},${Math.round(ci2[2]*255)},0.05)`);
      grad3.addColorStop(1, "transparent");
      ctx.fillStyle = grad3; ctx.fillRect(0, 0, 512, 512);

      const tex = new THREE.CanvasTexture(c);
      const baseOp = 0.03 + Math.random() * 0.05;
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: baseOp });
      const spr = new THREE.Sprite(mat) as THREE.Sprite & { _baseOpacity: number };
      const dist = 150 + Math.random() * 1000;
      const angle = Math.random() * Math.PI * 2;
      spr.scale.setScalar(300 + Math.random() * 900);
      spr.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 150, Math.sin(angle) * dist);
      spr._baseOpacity = baseOp;
      scene.add(spr); nebulae.push(spr);
    }

    // ── Shooting Stars ──
    const SH_COUNT = 6, SH_TRAIL = 24;
    const shPos = new Float32Array(SH_COUNT * 3);
    const shVel = new Float32Array(SH_COUNT * 3);
    const shLife = new Float32Array(SH_COUNT);
    const shMaxLife = new Float32Array(SH_COUNT);
    const shTrailPos = new Float32Array(SH_COUNT * SH_TRAIL * 3);
    const shHead = new Int32Array(SH_COUNT);
    const shLen = new Int32Array(SH_COUNT);
    for (let i = 0; i < SH_COUNT; i++) {
      shPos[i * 3] = (Math.random() - 0.5) * 2000; shPos[i * 3 + 1] = (Math.random() - 0.5) * 800; shPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      shVel[i * 3] = (Math.random() - 0.5) * 5; shVel[i * 3 + 1] = (Math.random() - 0.5) * 2; shVel[i * 3 + 2] = (Math.random() - 0.5) * 5;
      shLife[i] = 0; shMaxLife[i] = 80 + Math.random() * 140;
    }
    const shGeo = new THREE.BufferGeometry();
    shGeo.setAttribute("position", new THREE.BufferAttribute(shTrailPos, 3));
    const shMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.8, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    scene.add(new THREE.Points(shGeo, shMat));

    // ── Particles ──
    const pPos = new Float32Array(PARTICLE_POOL * 3);
    const pCol = new Float32Array(PARTICLE_POOL * 3);
    const pVel = new Float32Array(PARTICLE_POOL * 3);
    const pLife = new Float32Array(PARTICLE_POOL);
    const pMaxLife = new Float32Array(PARTICLE_POOL);
    const pSize = new Float32Array(PARTICLE_POOL);
    for (let i = 0; i < PARTICLE_POOL; i++) { pPos[i * 3 + 1] = -9999; pLife[i] = 0; pMaxLife[i] = 1; pSize[i] = 2; }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3));
    pGeo.setAttribute("aLife", new THREE.BufferAttribute(pLife, 1));
    pGeo.setAttribute("aMaxLife", new THREE.BufferAttribute(pMaxLife, 1));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(pSize, 1));
    const pMat = new THREE.ShaderMaterial({
      uniforms: { uPixelRatio: { value: PR }, uBass: { value: 0 } },
      vertexShader: PARTICLE_VERT, fragmentShader: PARTICLE_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(pGeo, pMat));
    let pIdx = 0, pDirty = false;

    function emitParticles(x: number, y: number, z: number, col: number[], count: number, vel: number) {
      for (let i = 0; i < count; i++) {
        const idx = pIdx; pIdx = (pIdx + 1) % PARTICLE_POOL;
        pPos[idx * 3] = x; pPos[idx * 3 + 1] = y; pPos[idx * 3 + 2] = z;
        const speed = vel * 6;
        pVel[idx * 3] = (Math.random() - 0.5) * speed;
        pVel[idx * 3 + 1] = (Math.random() - 0.5) * speed;
        pVel[idx * 3 + 2] = (Math.random() - 0.5) * speed;
        pCol[idx * 3] = col[0]; pCol[idx * 3 + 1] = col[1]; pCol[idx * 3 + 2] = col[2];
        pLife[idx] = 1; pMaxLife[idx] = 35 + Math.random() * 45; pSize[idx] = 3 + Math.random() * 6;
        pDirty = true;
      }
    }

    // ── Ripple Pool ──
    const ripples: { mesh: THREE.Mesh; active: boolean; life: number }[] = [];
    for (let i = 0; i < RIPPLE_POOL; i++) {
      const rGeo = new THREE.RingGeometry(0.5, 1.5, 64);
      const rMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false });
      const rMesh = new THREE.Mesh(rGeo, rMat);
      rMesh.visible = false; scene.add(rMesh);
      ripples.push({ mesh: rMesh, active: false, life: 0 });
    }

    function addRipple(x: number, y: number, z: number, col: number[]) {
      const r = ripples.find(r => !r.active); if (!r) return;
      r.active = true; r.life = 0; r.mesh.visible = true;
      r.mesh.position.set(x, y, z); r.mesh.scale.setScalar(1);
      (r.mesh.material as THREE.MeshBasicMaterial).color.setRGB(col[0], col[1], col[2]);
      (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6;
    }

    // ── FFT Bars (ring) ──
    const fftGroup = new THREE.Group(); scene.add(fftGroup);
    const fftMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < FFT_BARS; i++) {
      const bGeo = new THREE.BoxGeometry(4, 1, 4);
      const ci = Math.floor((i / FFT_BARS) * PAL.length) % PAL.length;
      const bMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(PAL[ci][0], PAL[ci][1], PAL[ci][2]),
        transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const mesh = new THREE.Mesh(bGeo, bMat);
      const ang = (i / FFT_BARS) * Math.PI * 2;
      mesh.position.set(Math.cos(ang) * 240, 0, Math.sin(ang) * 240);
      mesh.lookAt(0, 0, 0);
      fftGroup.add(mesh); fftMeshes.push(mesh);
    }

    // ── Post Processing ──
    const renderTarget = new THREE.WebGLRenderTarget(W(), H());
    const bloomW = () => Math.ceil(W() * 0.25);
    const bloomH = () => Math.ceil(H() * 0.25);
    const bloomTarget1 = new THREE.WebGLRenderTarget(bloomW(), bloomH());
    const bloomTarget2 = new THREE.WebGLRenderTarget(bloomW(), bloomH());
    const ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fsQuad = new THREE.PlaneGeometry(2, 2);

    const brightPass = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.4 } }, vertexShader: PP_VERT, fragmentShader: BRIGHT_FRAG });
    const brightScene = new THREE.Scene(); brightScene.add(new THREE.Mesh(fsQuad, brightPass));

    const blurPass = new THREE.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, uResolution: { value: new THREE.Vector2(bloomW(), bloomH()) } }, vertexShader: PP_VERT, fragmentShader: BLUR_FRAG });
    const blurScene = new THREE.Scene(); blurScene.add(new THREE.Mesh(fsQuad.clone(), blurPass));

    const compositePass = new THREE.ShaderMaterial({
      uniforms: { tOriginal: { value: null }, tBloom: { value: null }, uBloomStrength: { value: 0.55 }, uChromatic: { value: 0 }, uVignette: { value: 0.35 }, uTime: { value: 0 }, uMood: { value: 0.5 } },
      vertexShader: PP_VERT, fragmentShader: COMPOSITE_FRAG,
    });
    const compositeScene = new THREE.Scene(); compositeScene.add(new THREE.Mesh(fsQuad.clone(), compositePass));

    // ── Interaction state ──
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollZ = 0;
    window.addEventListener("wheel", e => { scrollZ += e.deltaY * 0.2; }, { passive: true });
    window.addEventListener("mousemove", e => { mouse.tx = (e.clientX / W() - 0.5) * 2; mouse.ty = -(e.clientY / H() - 0.5) * 2; });

    const onResize = () => {
      camera.aspect = W() / H(); camera.updateProjectionMatrix();
      renderer.setSize(W(), H()); renderTarget.setSize(W(), H());
      bloomTarget1.setSize(bloomW(), bloomH()); bloomTarget2.setSize(bloomW(), bloomH());
      blurPass.uniforms.uResolution.value.set(bloomW(), bloomH());
    };
    window.addEventListener("resize", onResize);

    function screenToWorld(x: number, y: number) {
      const ndc = new THREE.Vector3((x / W()) * 2 - 1, -(y / H()) * 2 + 1, 0.5);
      ndc.unproject(camera);
      const dir = ndc.sub(camera.position).normalize();
      return camera.position.clone().add(dir.multiplyScalar(280));
    }

    engineRef.current = {
      camera, addRipple, emitParticles,
      s2w: (x: number, y: number) => { const p = screenToWorld(x, y); return [p.x, p.y, p.z]; },
    };

    const clock = new THREE.Clock();

    function frame() {
      rafRef.current = requestAnimationFrame(frame);
      const t = clock.getElapsedTime();
      const a = analysisRef.current;
      const fc = frameCount.current++;

      // Throttle FFT analysis — every 3rd frame
      if (fc % 6 === 0) analyze();

      // Gyro input — expanded mobile mechanics
      const g = gyroRef.current;
      if (g.on) {
        // Tilt controls camera position (gamma=left/right, beta=forward/back)
        mouse.tx = clamp(g.gamma / 30, -1, 1);
        mouse.ty = clamp(-g.beta / 45 + 0.5, -1, 1);

        // Alpha (compass rotation) slowly rotates galaxy — immersive exploration
        galaxy.rotation.y += (g.alpha * 0.0001 - galaxy.rotation.y * 0.001) * 0.02;

        // Tilt controls audio — throttled to every 6th frame to avoid rampTo spam
        if (audioRef.current && fc % 6 === 0) {
          const tiltBrightness = clamp((g.beta - 20) / 60, 0, 1);
          try { audioRef.current.fi.frequency.rampTo(500 + tiltBrightness * 5000, 0.5); } catch {}
          const tiltWet = clamp(Math.abs(g.gamma) / 45, 0, 0.6);
          try { audioRef.current.rv.wet.rampTo(0.12 + tiltWet, 0.5); } catch {}
        }

        // Accelerometer: tilt intensity affects bloom and chromatic aberration
        const accelMag = Math.sqrt(g.accelX ** 2 + g.accelY ** 2) * 0.05;
        compositePass.uniforms.uChromatic.value = clamp(a.treble * 1.5 + accelMag * 0.3, 0, 3);

        // Shake decay
        g.shake *= 0.92;
        if (g.shake > 0.01) {
          // Shake adds camera vibration and bloom burst
          camera.position.x += (Math.random() - 0.5) * g.shake * 8;
          camera.position.y += (Math.random() - 0.5) * g.shake * 6;
          compositePass.uniforms.uBloomStrength.value = 0.55 + g.shake * 1.5;
        } else {
          compositePass.uniforms.uBloomStrength.value = 0.55;
        }
      }

      // Smooth camera
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

      // Flash decay
      flashIntensity.current *= 0.92;

      // Galaxy
      galaxy.rotation.y = t * (0.015 + a.mid * 0.025);
      const gu = galaxyMat.uniforms;
      gu.uTime.value = t; gu.uBass.value = a.bass; gu.uTreble.value = a.treble;
      gu.uVol.value = a.vol; gu.uFlash.value = flashIntensity.current;

      // Star
      starMat.uniforms.uTime.value = t;
      starMat.uniforms.uBass.value = a.bass;
      starMat.uniforms.uPitch.value = a.pitch;
      star.scale.setScalar(1 + Math.sin(t * 1.5) * 0.06 + a.bass * 2.5);

      // Halo
      haloMat.uniforms.uTime.value = t;
      haloMat.uniforms.uBass.value = a.bass;
      halo.scale.setScalar(1 + a.bass * 2);

      // Rings
      for (let i = 0; i < rings.length; i++) {
        rings[i].rotation.z = t * (0.06 + i * 0.03 + a.mid * 0.25);
        (rings[i].material as THREE.MeshBasicMaterial).opacity = 0.08 + a.mid * 0.25;
      }

      // Nebulae
      for (const n of nebulae) {
        (n.material as THREE.SpriteMaterial).opacity = n._baseOpacity + a.mid * 0.05 + a.vol * 0.02;
      }

      // Shooting stars
      for (let i = 0; i < SH_COUNT; i++) {
        shLife[i]++;
        if (shLife[i] > shMaxLife[i]) {
          shLife[i] = 0;
          shPos[i * 3] = (Math.random() - 0.5) * 2000;
          shPos[i * 3 + 1] = (Math.random() - 0.5) * 800;
          shPos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
          const v = 4 + a.high * 8;
          shVel[i * 3] = (Math.random() - 0.5) * v;
          shVel[i * 3 + 1] = (Math.random() - 0.5) * v * 0.4;
          shVel[i * 3 + 2] = (Math.random() - 0.5) * v;
          shHead[i] = 0; shLen[i] = 0;
        }
        shPos[i * 3] += shVel[i * 3];
        shPos[i * 3 + 1] += shVel[i * 3 + 1];
        shPos[i * 3 + 2] += shVel[i * 3 + 2];
        const h = shHead[i], base = i * SH_TRAIL * 3, idx = h * 3;
        shTrailPos[base + idx] = shPos[i * 3];
        shTrailPos[base + idx + 1] = shPos[i * 3 + 1];
        shTrailPos[base + idx + 2] = shPos[i * 3 + 2];
        shHead[i] = (h + 1) % SH_TRAIL;
        if (shLen[i] < SH_TRAIL) shLen[i]++;
      }
      shGeo.attributes.position.needsUpdate = true;

      // Particles
      let anyAlive = false;
      for (let i = 0; i < PARTICLE_POOL; i++) {
        if (pLife[i] > 0 && pLife[i] < pMaxLife[i]) {
          pLife[i]++;
          pPos[i * 3] += pVel[i * 3];
          pPos[i * 3 + 1] += pVel[i * 3 + 1];
          pPos[i * 3 + 2] += pVel[i * 3 + 2];
          pVel[i * 3] *= 0.97; pVel[i * 3 + 1] *= 0.97; pVel[i * 3 + 2] *= 0.97;
          anyAlive = true;
        } else if (pLife[i] >= pMaxLife[i]) {
          pLife[i] = 0; pPos[i * 3 + 1] = -9999; anyAlive = true;
        }
      }
      if (anyAlive || pDirty) {
        pGeo.attributes.position.needsUpdate = true;
        pGeo.attributes.aLife.needsUpdate = true;
        if (pDirty) {
          pGeo.attributes.color.needsUpdate = true;
          pGeo.attributes.aSize.needsUpdate = true;
          pGeo.attributes.aMaxLife.needsUpdate = true;
          pDirty = false;
        }
        pMat.uniforms.uBass.value = a.bass;
      }

      // Ripples
      for (const r of ripples) {
        if (!r.active) continue;
        r.life++;
        r.mesh.scale.setScalar(1 + r.life * 3);
        (r.mesh.material as THREE.MeshBasicMaterial).opacity = 0.6 * Math.pow(1 - r.life / 60, 2);
        if (r.life >= 60) { r.mesh.visible = false; r.active = false; }
      }

      // FFT bars (every 3rd frame)
      if (fc % 3 === 0) {
        for (let i = 0; i < FFT_BARS; i++) {
          const v = fftBuffer.current[Math.floor(i / FFT_BARS * 128)] || 0;
          fftMeshes[i].scale.y = 1 + v * 100;
          (fftMeshes[i].material as THREE.MeshBasicMaterial).opacity = 0.15 + v * 0.7;
        }
      }

      // Post-processing pipeline
      renderer.setRenderTarget(renderTarget); renderer.render(scene, camera);
      brightPass.uniforms.tDiffuse.value = renderTarget.texture;
      renderer.setRenderTarget(bloomTarget1); renderer.render(brightScene, ppCamera);
      blurPass.uniforms.tDiffuse.value = bloomTarget1.texture;
      renderer.setRenderTarget(bloomTarget2); renderer.render(blurScene, ppCamera);
      compositePass.uniforms.tOriginal.value = renderTarget.texture;
      compositePass.uniforms.tBloom.value = bloomTarget2.texture;
      compositePass.uniforms.uChromatic.value = a.treble * 1.5;
      compositePass.uniforms.uTime.value = t;
      compositePass.uniforms.uMood.value = SCALES[scaleRef.current]?.mood || 0.5;
      renderer.setRenderTarget(null); renderer.render(compositeScene, ppCamera);
    }

    frame();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      renderer.dispose(); renderTarget.dispose(); bloomTarget1.dispose(); bloomTarget2.dispose();
      scene.traverse((o: any) => {
        o.geometry?.dispose();
        if (o.material) { if (Array.isArray(o.material)) o.material.forEach((m: any) => m.dispose()); else o.material.dispose(); }
      });
    };
  }, []);
}
