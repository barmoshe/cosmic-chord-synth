import * as THREE from "three";
import { PARTICLE_POOL } from "../constants";
import { PARTICLE_VERT, PARTICLE_FRAG } from "../shaders";
import type { ParticleBuffers } from "./types";

export function createParticles(PR: number): { points: THREE.Points; buffers: ParticleBuffers } {
  const pos = new Float32Array(PARTICLE_POOL * 3);
  const col = new Float32Array(PARTICLE_POOL * 3);
  const vel = new Float32Array(PARTICLE_POOL * 3);
  const life = new Float32Array(PARTICLE_POOL);
  const maxLife = new Float32Array(PARTICLE_POOL);
  const size = new Float32Array(PARTICLE_POOL);
  for (let i = 0; i < PARTICLE_POOL; i++) {
    pos[i * 3 + 1] = -9999;
    life[i] = 0; maxLife[i] = 1; size[i] = 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aLife", new THREE.BufferAttribute(life, 1));
  geo.setAttribute("aMaxLife", new THREE.BufferAttribute(maxLife, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixelRatio: { value: PR }, uBass: { value: 0 } },
    vertexShader: PARTICLE_VERT,
    fragmentShader: PARTICLE_FRAG,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.AdditiveBlending,
  });
  return {
    points: new THREE.Points(geo, mat),
    buffers: { pos, col, vel, life, maxLife, size, geo, mat, cursor: { i: 0 }, dirty: { v: false } },
  };
}

export function spawnParticles(
  b: ParticleBuffers,
  x: number, y: number, z: number,
  col: number[], count: number, vel: number,
) {
  for (let i = 0; i < count; i++) {
    const idx = b.cursor.i; b.cursor.i = (b.cursor.i + 1) % PARTICLE_POOL;
    b.pos[idx * 3] = x; b.pos[idx * 3 + 1] = y; b.pos[idx * 3 + 2] = z;
    const speed = vel * 6;
    b.vel[idx * 3] = (Math.random() - 0.5) * speed;
    b.vel[idx * 3 + 1] = (Math.random() - 0.5) * speed;
    b.vel[idx * 3 + 2] = (Math.random() - 0.5) * speed;
    b.col[idx * 3] = col[0]; b.col[idx * 3 + 1] = col[1]; b.col[idx * 3 + 2] = col[2];
    b.life[idx] = 1;
    b.maxLife[idx] = 35 + Math.random() * 45;
    b.size[idx] = 3 + Math.random() * 6;
    b.dirty.v = true;
  }
}

export function stepParticles(b: ParticleBuffers, bass: number) {
  let anyAlive = false;
  for (let i = 0; i < PARTICLE_POOL; i++) {
    if (b.life[i] > 0 && b.life[i] < b.maxLife[i]) {
      b.life[i]++;
      b.pos[i * 3] += b.vel[i * 3];
      b.pos[i * 3 + 1] += b.vel[i * 3 + 1];
      b.pos[i * 3 + 2] += b.vel[i * 3 + 2];
      b.vel[i * 3] *= 0.97; b.vel[i * 3 + 1] *= 0.97; b.vel[i * 3 + 2] *= 0.97;
      anyAlive = true;
    } else if (b.life[i] >= b.maxLife[i]) {
      b.life[i] = 0; b.pos[i * 3 + 1] = -9999;
      anyAlive = true;
    }
  }
  if (anyAlive || b.dirty.v) {
    b.geo.attributes.position.needsUpdate = true;
    b.geo.attributes.aLife.needsUpdate = true;
    if (b.dirty.v) {
      b.geo.attributes.color.needsUpdate = true;
      b.geo.attributes.aSize.needsUpdate = true;
      b.geo.attributes.aMaxLife.needsUpdate = true;
      b.dirty.v = false;
    }
    b.mat.uniforms.uBass.value = bass;
  }
}
