import * as THREE from "three";
import { DRUM_STARS, DRUM_ORBIT_R, type DrumName } from "../shared/constants";
import { DRUM_STAR_VERT, DRUM_STAR_FRAG } from "../shared/shaders";
import type { DrumMesh } from "./types";

export function makeDrumStars(): { group: THREE.Group; meshes: DrumMesh[] } {
  const group = new THREE.Group();
  const meshes: DrumMesh[] = [];
  for (const ds of DRUM_STARS) {
    const geo = new THREE.IcosahedronGeometry(14, 3);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 },
        uColor: { value: new THREE.Vector3(ds.color[0], ds.color[1], ds.color[2]) },
      },
      vertexShader: DRUM_STAR_VERT,
      fragmentShader: DRUM_STAR_FRAG,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const m = new THREE.Mesh(geo, mat) as unknown as DrumMesh;
    m.position.set(Math.cos(ds.angle) * DRUM_ORBIT_R, 0, Math.sin(ds.angle) * DRUM_ORBIT_R);
    m.userData = { name: ds.name, pulse: 0, col: [...ds.color] };
    group.add(m); meshes.push(m);

    const haloCanvas = document.createElement("canvas"); haloCanvas.width = 128; haloCanvas.height = 128;
    const hctx = haloCanvas.getContext("2d")!;
    const grad = hctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    const [rCol, gCol, bCol] = ds.color;
    grad.addColorStop(0, `rgba(${Math.round(rCol * 255)},${Math.round(gCol * 255)},${Math.round(bCol * 255)},0.55)`);
    grad.addColorStop(0.5, `rgba(${Math.round(rCol * 180)},${Math.round(gCol * 180)},${Math.round(bCol * 180)},0.15)`);
    grad.addColorStop(1, "transparent");
    hctx.fillStyle = grad; hctx.fillRect(0, 0, 128, 128);
    const haloSpr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(haloCanvas),
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.9,
    }));
    haloSpr.scale.setScalar(70);
    m.add(haloSpr);
  }
  return { group, meshes };
}

export function createDrumPicker(
  meshes: DrumMesh[],
  camera: THREE.Camera,
  getW: () => number,
  getH: () => number,
) {
  const ray = new THREE.Raycaster();
  return (clientX: number, clientY: number): DrumName | null => {
    const ndc = new THREE.Vector2((clientX / getW()) * 2 - 1, -(clientY / getH()) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(meshes, false);
    return hits.length ? (hits[0].object as DrumMesh).userData.name : null;
  };
}

export function updateDrumStars(meshes: DrumMesh[], t: number, dt: number) {
  const decay = Math.exp(-dt * 10);
  for (const m of meshes) {
    m.userData.pulse *= decay;
    const u = (m.material as THREE.ShaderMaterial).uniforms;
    u.uTime.value = t;
    u.uPulse.value = m.userData.pulse;
    m.scale.setScalar(1 + m.userData.pulse * 0.45);
  }
}
