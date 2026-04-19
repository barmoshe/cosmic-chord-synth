import * as THREE from "three";
import { isMobile, GALAXY_COUNT } from "../shared/constants";
import { GALAXY_VERT, GALAXY_FRAG } from "../shared/shaders";

const ARM_COUNT = 4;
const TWIST_FACTOR = 0.0035;
const ARM_SPREAD = 0.35;

export interface GalaxyBuild {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
}

export function makeGalaxy(PR: number): GalaxyBuild {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(GALAXY_COUNT * 3);
  const col = new Float32Array(GALAXY_COUNT * 3);
  const size = new Float32Array(GALAXY_COUNT);
  const rand = new Float32Array(GALAXY_COUNT);

  for (let i = 0; i < GALAXY_COUNT; i++) {
    const arm = i % ARM_COUNT;
    const baseAngle = (arm / ARM_COUNT) * Math.PI * 2;
    const t = Math.random();
    const radius = 15 + Math.pow(t, 0.6) * 980;
    const spiralAngle = baseAngle + radius * TWIST_FACTOR + (Math.random() - 0.5) * ARM_SPREAD * (1 + radius * 0.0008);
    const x = Math.cos(spiralAngle) * radius;
    const z = Math.sin(spiralAngle) * radius;
    const diskThickness = 12 * Math.exp(-radius * 0.003) + 3;
    const y = (Math.random() - 0.5) * diskThickness * (1 + (Math.random() < 0.02 ? 8 : 1));
    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;

    const coreInfluence = Math.exp(-radius * 0.004);
    const isGoldGiant = Math.random() < 0.03;
    const isBlueGiant = Math.random() < 0.06 && radius > 200;

    let r: number, g: number, b: number;
    if (isGoldGiant) { r = 0.99; g = 0.83 + Math.random() * 0.1; b = 0.30 + Math.random() * 0.15; }
    else if (isBlueGiant) { r = 0.5 + Math.random() * 0.2; g = 0.75 + Math.random() * 0.2; b = 1; }
    else {
      const temp = coreInfluence * 0.8 + Math.random() * 0.3;
      r = 0.55 + temp * 0.35;
      g = 0.78 + (1 - temp) * 0.18;
      b = 0.85 + (1 - temp) * 0.15;
    }

    const brightness = (0.3 + Math.random() * 0.7) * (0.5 + coreInfluence * 1.5);
    col[i * 3] = r * brightness;
    col[i * 3 + 1] = g * brightness;
    col[i * 3 + 2] = b * brightness;
    size[i] = (0.8 + Math.random() * 2.5) * (1 + coreInfluence * 3);
    rand[i] = Math.random();
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: PR },
      uBass: { value: 0 }, uTreble: { value: 0 },
      uVol: { value: 0 }, uFlash: { value: 0 },
    },
    vertexShader: GALAXY_VERT,
    fragmentShader: GALAXY_FRAG,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
  });
  return { points: new THREE.Points(geo, material), material };
}

export function addDustLanes(scene: THREE.Scene, galaxyMat: THREE.ShaderMaterial) {
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
      vertexShader: GALAXY_VERT,
      fragmentShader: GALAXY_FRAG,
      transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
    });
    scene.add(new THREE.Points(dustGeo, dustMat));
  }
}
