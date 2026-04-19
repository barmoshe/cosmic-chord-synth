import * as THREE from "three";
import { FFT_BARS, PAL } from "../constants";

export function makeFftBars(): { group: THREE.Group; meshes: THREE.Mesh[] } {
  const group = new THREE.Group();
  const meshes: THREE.Mesh[] = [];
  for (let i = 0; i < FFT_BARS; i++) {
    const geo = new THREE.BoxGeometry(4, 1, 4);
    const ci = Math.floor((i / FFT_BARS) * PAL.length) % PAL.length;
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(PAL[ci][0], PAL[ci][1], PAL[ci][2]),
      transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    const ang = (i / FFT_BARS) * Math.PI * 2;
    mesh.position.set(Math.cos(ang) * 240, 0, Math.sin(ang) * 240);
    mesh.lookAt(0, 0, 0);
    group.add(mesh); meshes.push(mesh);
  }
  return { group, meshes };
}

export function updateFftBars(meshes: THREE.Mesh[], fft: Float32Array) {
  for (let i = 0; i < FFT_BARS; i++) {
    const v = fft[Math.floor((i / FFT_BARS) * 128)] || 0;
    meshes[i].scale.y = 1 + v * 100;
    (meshes[i].material as THREE.MeshBasicMaterial).opacity = 0.15 + v * 0.7;
  }
}

export function tintFftBars(meshes: THREE.Mesh[], col: number[]) {
  for (const m of meshes) {
    (m.material as THREE.MeshBasicMaterial).color.setRGB(col[0], col[1], col[2]);
  }
}
