import * as THREE from "three";
import { PAL } from "../constants";

export function makeRings(): THREE.Mesh[] {
  const rings: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.RingGeometry(85 + i * 50, 86.5 + i * 50, 128);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PAL[i % PAL.length][0], PAL[i % PAL.length][1], PAL[i % PAL.length][2]),
      transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = 0.2 + i * 0.3;
    ring.rotation.y = i * 0.5;
    rings.push(ring);
  }
  return rings;
}
