import * as THREE from "three";
import { STAR_VERT, STAR_FRAG, HALO_FRAG } from "../shared/shaders";

export interface CentralStar {
  star: THREE.Mesh;
  starMat: THREE.ShaderMaterial;
  halo: THREE.Mesh;
  haloMat: THREE.ShaderMaterial;
}

export function makeCentralStar(): CentralStar {
  const starGeo = new THREE.IcosahedronGeometry(18, 5);
  const starMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBass: { value: 0 }, uPitch: { value: 0 } },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
  });
  const star = new THREE.Mesh(starGeo, starMat);

  const haloGeo = new THREE.SphereGeometry(50, 32, 32);
  const haloMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBass: { value: 0 } },
    vertexShader: STAR_VERT.replace("p += normal", "// p += normal").replace("p += normal", "// p += normal"),
    fragmentShader: HALO_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  return { star, starMat, halo, haloMat };
}
