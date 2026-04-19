import * as THREE from "three";
import { PP_VERT, BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG } from "../shared/shaders";

export interface PostPipeline {
  renderTarget: THREE.WebGLRenderTarget;
  bloomTarget1: THREE.WebGLRenderTarget;
  bloomTarget2: THREE.WebGLRenderTarget;
  ppCamera: THREE.OrthographicCamera;
  brightScene: THREE.Scene;
  brightPass: THREE.ShaderMaterial;
  blurScene: THREE.Scene;
  blurPass: THREE.ShaderMaterial;
  compositeScene: THREE.Scene;
  compositePass: THREE.ShaderMaterial;
  resize: (W: number, H: number) => void;
}

export function createPostPipeline(W: number, H: number): PostPipeline {
  const renderTarget = new THREE.WebGLRenderTarget(W, H);
  const bloomW = Math.ceil(W * 0.25);
  const bloomH = Math.ceil(H * 0.25);
  const bloomTarget1 = new THREE.WebGLRenderTarget(bloomW, bloomH);
  const bloomTarget2 = new THREE.WebGLRenderTarget(bloomW, bloomH);
  const ppCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fsQuad = new THREE.PlaneGeometry(2, 2);

  const brightPass = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.4 } },
    vertexShader: PP_VERT, fragmentShader: BRIGHT_FRAG,
  });
  const brightScene = new THREE.Scene();
  brightScene.add(new THREE.Mesh(fsQuad, brightPass));

  const blurPass = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null }, uResolution: { value: new THREE.Vector2(bloomW, bloomH) } },
    vertexShader: PP_VERT, fragmentShader: BLUR_FRAG,
  });
  const blurScene = new THREE.Scene();
  blurScene.add(new THREE.Mesh(fsQuad.clone(), blurPass));

  const compositePass = new THREE.ShaderMaterial({
    uniforms: {
      tOriginal: { value: null }, tBloom: { value: null },
      uBloomStrength: { value: 0.55 }, uChromatic: { value: 0 },
      uVignette: { value: 0.35 }, uTime: { value: 0 }, uMood: { value: 0.5 },
    },
    vertexShader: PP_VERT, fragmentShader: COMPOSITE_FRAG,
  });
  const compositeScene = new THREE.Scene();
  compositeScene.add(new THREE.Mesh(fsQuad.clone(), compositePass));

  return {
    renderTarget, bloomTarget1, bloomTarget2, ppCamera,
    brightScene, brightPass, blurScene, blurPass, compositeScene, compositePass,
    resize: (w: number, h: number) => {
      renderTarget.setSize(w, h);
      const bw = Math.ceil(w * 0.25), bh = Math.ceil(h * 0.25);
      bloomTarget1.setSize(bw, bh);
      bloomTarget2.setSize(bw, bh);
      blurPass.uniforms.uResolution.value.set(bw, bh);
    },
  };
}

export function renderPost(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  pp: PostPipeline,
  treble: number, t: number, mood: number,
) {
  renderer.setRenderTarget(pp.renderTarget);
  renderer.render(scene, camera);
  pp.brightPass.uniforms.tDiffuse.value = pp.renderTarget.texture;
  renderer.setRenderTarget(pp.bloomTarget1);
  renderer.render(pp.brightScene, pp.ppCamera);
  pp.blurPass.uniforms.tDiffuse.value = pp.bloomTarget1.texture;
  renderer.setRenderTarget(pp.bloomTarget2);
  renderer.render(pp.blurScene, pp.ppCamera);
  pp.compositePass.uniforms.tOriginal.value = pp.renderTarget.texture;
  pp.compositePass.uniforms.tBloom.value = pp.bloomTarget2.texture;
  pp.compositePass.uniforms.uChromatic.value = treble * 1.5;
  pp.compositePass.uniforms.uTime.value = t;
  pp.compositePass.uniforms.uMood.value = mood;
  renderer.setRenderTarget(null);
  renderer.render(pp.compositeScene, pp.ppCamera);
}
