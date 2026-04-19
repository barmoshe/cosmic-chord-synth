import * as THREE from "three";
import type { DrumName } from "../shared/constants";

export type DrumMesh = THREE.Mesh & {
  userData: { name: DrumName; pulse: number; col: number[] };
};

export type NebulaSprite = THREE.Sprite & { _baseOpacity: number };

export interface RippleEntry {
  mesh: THREE.Mesh;
  active: boolean;
  life: number;
  scaleMult: number;
  startOp: number;
  maxLife: number;
}

export interface ShootingStars {
  pos: Float32Array;
  vel: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  trailPos: Float32Array;
  head: Int32Array;
  len: Int32Array;
  geo: THREE.BufferGeometry;
  count: number;
  trail: number;
}

export interface ParticleBuffers {
  pos: Float32Array;
  col: Float32Array;
  vel: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  size: Float32Array;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  cursor: { i: number };
  dirty: { v: boolean };
}
