import * as THREE from "three";
import { isMobile } from "../shared/constants";
import { GALAXY_VERT, GALAXY_FRAG } from "../shared/shaders";

export function makeBgStars(PR: number, sharedUniforms: Record<string, THREE.IUniform>): THREE.Points {
  const count = isMobile ? 2000 : 4000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const rand = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 3000 + Math.random() * 5000;
    pos[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
    pos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
    pos[i * 3 + 2] = Math.cos(phi) * r;
    const temp = Math.random();
    if (temp < 0.1) { col[i * 3] = 0.5; col[i * 3 + 1] = 0.95; col[i * 3 + 2] = 0.85; }
    else if (temp < 0.3) { col[i * 3] = 0.95; col[i * 3 + 1] = 0.85; col[i * 3 + 2] = 0.7; }
    else if (temp < 0.7) { col[i * 3] = 0.9; col[i * 3 + 1] = 0.92; col[i * 3 + 2] = 1; }
    else { col[i * 3] = 0.7; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1; }
    const b = 0.3 + Math.random() * 0.7;
    col[i * 3] *= b; col[i * 3 + 1] *= b; col[i * 3 + 2] *= b;
    size[i] = 0.5 + Math.random() * 1.5;
    rand[i] = Math.random();
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uPixelRatio: { value: PR },
      uBass: { value: 0 }, uTreble: { value: 0 },
      uVol: { value: 0 }, uFlash: { value: 0 },
    },
    vertexShader: GALAXY_VERT,
    fragmentShader: GALAXY_FRAG,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
  });
  // Keep reference so the galaxy can share uniforms if desired (unused here).
  void sharedUniforms;
  return new THREE.Points(geo, mat);
}
