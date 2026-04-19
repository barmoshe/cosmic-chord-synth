import * as THREE from "three";
import { RIPPLE_POOL } from "../shared/constants";
import type { RippleEntry } from "./types";

export function createRipples(scene: THREE.Scene): RippleEntry[] {
  const ripples: RippleEntry[] = [];
  for (let i = 0; i < RIPPLE_POOL; i++) {
    const geo = new THREE.RingGeometry(0.5, 1.5, 64);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false; scene.add(mesh);
    ripples.push({ mesh, active: false, life: 0, scaleMult: 1, startOp: 0.6, maxLife: 60 });
  }
  return ripples;
}

export function addRipple(
  ripples: RippleEntry[],
  x: number, y: number, z: number,
  col: number[], intensity = 1,
) {
  const r = ripples.find((rr) => !rr.active);
  if (!r) return;
  r.active = true; r.life = 0; r.scaleMult = intensity; r.startOp = 0.6 * intensity; r.maxLife = 60;
  r.mesh.visible = true;
  r.mesh.position.set(x, y, z);
  r.mesh.scale.setScalar(1);
  (r.mesh.material as THREE.MeshBasicMaterial).color.setRGB(col[0], col[1], col[2]);
  (r.mesh.material as THREE.MeshBasicMaterial).opacity = r.startOp;
}

export function shockwave(ripples: RippleEntry[], col: number[], scale: number) {
  const r = ripples.find((rr) => !rr.active);
  if (!r) return;
  r.active = true; r.life = 0; r.scaleMult = scale; r.startOp = 0.85; r.maxLife = 80;
  r.mesh.visible = true;
  r.mesh.position.set(0, 0, 0);
  r.mesh.scale.setScalar(scale);
  (r.mesh.material as THREE.MeshBasicMaterial).color.setRGB(col[0], col[1], col[2]);
  (r.mesh.material as THREE.MeshBasicMaterial).opacity = r.startOp;
}

export function stepRipples(ripples: RippleEntry[]) {
  for (const r of ripples) {
    if (!r.active) continue;
    r.life++;
    r.mesh.scale.setScalar((1 + r.life * 3) * r.scaleMult);
    (r.mesh.material as THREE.MeshBasicMaterial).opacity =
      r.startOp * Math.pow(1 - r.life / r.maxLife, 2);
    if (r.life >= r.maxLife) { r.mesh.visible = false; r.active = false; }
  }
}
