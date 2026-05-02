import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FlightLoopHandle } from "../hooks/useFlightLoop";

interface World3DProps {
  flight: FlightLoopHandle;
}

const SKY_RADIUS = 5000;
const GROUND_SIZE = 16000;
const GROUND_SEGMENTS = 64;

const skyVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = /* glsl */ `
  uniform vec3 zenith;
  uniform vec3 horizon;
  uniform vec3 groundHaze;
  uniform vec3 sunDir;
  uniform vec3 sunColor;
  uniform float sunIntensity;
  varying vec3 vWorldPosition;

  void main() {
    vec3 dir = normalize(vWorldPosition);
    float h = dir.y;
    vec3 col;
    if (h >= 0.0) {
      float k = pow(clamp(h, 0.0, 1.0), 0.55);
      col = mix(horizon, zenith, k);
    } else {
      col = mix(horizon, groundHaze, clamp(-h * 1.4, 0.0, 1.0));
    }
    float sunDot = max(dot(dir, normalize(sunDir)), 0.0);
    col += sunColor * pow(sunDot, 280.0) * sunIntensity;
    col += sunColor * 0.18 * pow(sunDot, 6.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

const World3D = ({ flight }: World3DProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const attitudeRef = useRef({ pitchRad: 0, rollRad: 0, yawRad: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile =
      typeof navigator !== "undefined" && /Mobi|Android/i.test(navigator.userAgent);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isMobile,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x9ec5d8);
    container.appendChild(renderer.domElement);
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.pointerEvents = "none";

    const scene = new THREE.Scene();

    const skyGeometry = new THREE.SphereGeometry(SKY_RADIUS, 24, 16);
    const skyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        zenith: { value: new THREE.Color(0x2a4a78) },
        horizon: { value: new THREE.Color(0xc6d8e0) },
        groundHaze: { value: new THREE.Color(0x6b5236) },
        sunDir: { value: new THREE.Vector3(0.4, 0.6, -0.7).normalize() },
        sunColor: { value: new THREE.Color(0xffe2b5) },
        sunIntensity: { value: 0.85 },
      },
      vertexShader: skyVertexShader,
      fragmentShader: skyFragmentShader,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);

    const groundGeometry = new THREE.PlaneGeometry(
      GROUND_SIZE,
      GROUND_SIZE,
      GROUND_SEGMENTS,
      GROUND_SEGMENTS,
    );
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x4d6638,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -120;
    scene.add(ground);

    const grid = new THREE.GridHelper(GROUND_SIZE, 80, 0x6e8454, 0x3a4d2c);
    grid.position.y = -119;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    scene.add(grid);

    const runwayGeometry = new THREE.PlaneGeometry(40, 1200);
    const runwayMaterial = new THREE.MeshBasicMaterial({ color: 0x222226 });
    const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
    runway.rotation.x = -Math.PI / 2;
    runway.position.set(0, -118, -200);
    scene.add(runway);

    const stripeGeometry = new THREE.PlaneGeometry(2, 1100);
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xf2e8b5 });
    const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, -117.5, -200);
    scene.add(stripe);

    const camera = new THREE.PerspectiveCamera(
      72,
      container.clientWidth / container.clientHeight,
      0.5,
      SKY_RADIUS * 1.2,
    );
    camera.position.set(0, 0, 0);
    camera.rotation.order = "YXZ";

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer!.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    const unsubscribe = flight.subscribe((t) => {
      attitudeRef.current.pitchRad = t.pitchDeg * (Math.PI / 180);
      attitudeRef.current.rollRad = t.rollDeg * (Math.PI / 180);
      attitudeRef.current.yawRad = t.headingDeg * (Math.PI / 180);
    });

    let raf = 0;
    const animate = () => {
      const a = attitudeRef.current;
      camera.rotation.y = -a.yawRad;
      camera.rotation.x = a.pitchRad;
      camera.rotation.z = -a.rollRad;
      renderer!.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
      unsubscribe();
      skyGeometry.dispose();
      skyMaterial.dispose();
      groundGeometry.dispose();
      groundMaterial.dispose();
      runwayGeometry.dispose();
      runwayMaterial.dispose();
      stripeGeometry.dispose();
      stripeMaterial.dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      renderer!.dispose();
      if (renderer!.domElement.parentNode) {
        renderer!.domElement.parentNode.removeChild(renderer!.domElement);
      }
    };
  }, [flight]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none"
      aria-hidden="true"
      style={{ background: "#9ec5d8" }}
    />
  );
};

export default World3D;
