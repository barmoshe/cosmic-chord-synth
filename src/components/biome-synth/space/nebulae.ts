import * as THREE from "three";
import { isMobile } from "../shared/constants";
import type { NebulaSprite } from "./types";

const NEBULA_COLORS = [
  [0.1, 0.3, 1.0],
  [0.8, 0.1, 0.4],
  [0.2, 0.8, 0.6],
  [0.6, 0.15, 0.9],
  [1.0, 0.4, 0.1],
  [0.1, 0.6, 1.0],
  [0.9, 0.2, 0.6],
  [0.3, 1.0, 0.7],
  [0.5, 0.2, 0.8],
  [0.9, 0.6, 0.2],
  [0.15, 0.4, 0.9],
  [0.7, 0.1, 0.3],
  [0.2, 0.9, 0.9],
  [0.8, 0.3, 0.7],
];

export function makeNebulae(): NebulaSprite[] {
  const nebulae: NebulaSprite[] = [];
  const nebulaCount = isMobile ? 10 : 16;
  for (let i = 0; i < nebulaCount; i++) {
    const c = document.createElement("canvas"); c.width = 512; c.height = 512;
    const ctx = c.getContext("2d")!;
    const ci = NEBULA_COLORS[i % NEBULA_COLORS.length];
    for (let pass = 0; pass < 3; pass++) {
      const cx = 256 + (Math.random() - 0.5) * 100;
      const cy = 256 + (Math.random() - 0.5) * 100;
      const radius = 160 + Math.random() * 80;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      const alpha = pass === 0 ? 0.14 : pass === 1 ? 0.08 : 0.04;
      grad.addColorStop(0, `rgba(${Math.round(ci[0] * 255)},${Math.round(ci[1] * 255)},${Math.round(ci[2] * 255)},${alpha})`);
      grad.addColorStop(0.25, `rgba(${Math.round(ci[0] * 200)},${Math.round(ci[1] * 200)},${Math.round(ci[2] * 200)},${alpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(${Math.round(ci[0] * 140)},${Math.round(ci[1] * 140)},${Math.round(ci[2] * 140)},${alpha * 0.3})`);
      grad.addColorStop(0.8, `rgba(${Math.round(ci[0] * 80)},${Math.round(ci[1] * 80)},${Math.round(ci[2] * 80)},${alpha * 0.1})`);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 512);
    }
    const ci2 = NEBULA_COLORS[(i + 3) % NEBULA_COLORS.length];
    const grad3 = ctx.createRadialGradient(300, 200, 0, 300, 200, 180);
    grad3.addColorStop(0, `rgba(${Math.round(ci2[0] * 255)},${Math.round(ci2[1] * 255)},${Math.round(ci2[2] * 255)},0.05)`);
    grad3.addColorStop(1, "transparent");
    ctx.fillStyle = grad3; ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(c);
    const baseOp = 0.03 + Math.random() * 0.05;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: baseOp });
    const spr = new THREE.Sprite(mat) as NebulaSprite;
    const dist = 150 + Math.random() * 1000;
    const angle = Math.random() * Math.PI * 2;
    spr.scale.setScalar(300 + Math.random() * 900);
    spr.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 150, Math.sin(angle) * dist);
    spr._baseOpacity = baseOp;
    nebulae.push(spr);
  }
  return nebulae;
}
