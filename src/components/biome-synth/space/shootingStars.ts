import * as THREE from "three";
import type { ShootingStars } from "./types";

const SH_COUNT = 6;
const SH_TRAIL = 24;

export function makeShootingStars(): { points: THREE.Points; data: ShootingStars } {
  const pos = new Float32Array(SH_COUNT * 3);
  const vel = new Float32Array(SH_COUNT * 3);
  const life = new Float32Array(SH_COUNT);
  const maxLife = new Float32Array(SH_COUNT);
  const trailPos = new Float32Array(SH_COUNT * SH_TRAIL * 3);
  const head = new Int32Array(SH_COUNT);
  const len = new Int32Array(SH_COUNT);
  for (let i = 0; i < SH_COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 2000;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 800;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
    vel[i * 3] = (Math.random() - 0.5) * 5;
    vel[i * 3 + 1] = (Math.random() - 0.5) * 2;
    vel[i * 3 + 2] = (Math.random() - 0.5) * 5;
    life[i] = 0;
    maxLife[i] = 80 + Math.random() * 140;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(trailPos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffffff, size: 1.8, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  return {
    points,
    data: { pos, vel, life, maxLife, trailPos, head, len, geo, count: SH_COUNT, trail: SH_TRAIL },
  };
}

export function stepShootingStars(s: ShootingStars, high: number) {
  for (let i = 0; i < s.count; i++) {
    s.life[i]++;
    if (s.life[i] > s.maxLife[i]) {
      s.life[i] = 0;
      s.pos[i * 3] = (Math.random() - 0.5) * 2000;
      s.pos[i * 3 + 1] = (Math.random() - 0.5) * 800;
      s.pos[i * 3 + 2] = (Math.random() - 0.5) * 2000;
      const v = 4 + high * 8;
      s.vel[i * 3] = (Math.random() - 0.5) * v;
      s.vel[i * 3 + 1] = (Math.random() - 0.5) * v * 0.4;
      s.vel[i * 3 + 2] = (Math.random() - 0.5) * v;
      s.head[i] = 0; s.len[i] = 0;
    }
    s.pos[i * 3] += s.vel[i * 3];
    s.pos[i * 3 + 1] += s.vel[i * 3 + 1];
    s.pos[i * 3 + 2] += s.vel[i * 3 + 2];
    const h = s.head[i], base = i * s.trail * 3, idx = h * 3;
    s.trailPos[base + idx] = s.pos[i * 3];
    s.trailPos[base + idx + 1] = s.pos[i * 3 + 1];
    s.trailPos[base + idx + 2] = s.pos[i * 3 + 2];
    s.head[i] = (h + 1) % s.trail;
    if (s.len[i] < s.trail) s.len[i]++;
  }
  s.geo.attributes.position.needsUpdate = true;
}
