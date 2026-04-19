import { isMobile } from "../constants";
import { rand } from "./utils";

export function buildFloor(canvas: HTMLCanvasElement, W: number, H: number, PR: number) {
  const fh = Math.floor(H * 0.18);
  canvas.width = Math.max(1, Math.floor(W * PR));
  canvas.height = Math.max(1, Math.floor(fh * PR));
  const fctx = canvas.getContext("2d")!;
  fctx.setTransform(PR, 0, 0, PR, 0, 0);
  fctx.clearRect(0, 0, W, fh);
  // sand gradient
  const g = fctx.createLinearGradient(0, 0, 0, fh);
  g.addColorStop(0, "#1a3a52");
  g.addColorStop(0.5, "#2c5470");
  g.addColorStop(1, "#0a1f2e");
  fctx.fillStyle = g;
  fctx.fillRect(0, 0, W, fh);
  // dunes
  fctx.fillStyle = "rgba(10,30,50,0.55)";
  for (let i = 0; i < 5; i++) {
    const cx = (i / 4) * W + rand(-30, 30);
    fctx.beginPath();
    fctx.ellipse(cx, fh - 6, rand(60, 110), rand(10, 18), 0, Math.PI, Math.PI * 2);
    fctx.fill();
  }
  // rocks
  const rocks = isMobile ? 4 : 8;
  for (let i = 0; i < rocks; i++) {
    const rx = rand(0, W);
    const ry = fh - rand(2, 10);
    const rw = rand(10, 26);
    fctx.fillStyle = "rgba(5,20,32,0.85)";
    fctx.beginPath();
    fctx.ellipse(rx, ry, rw, rw * 0.55, 0, Math.PI, Math.PI * 2);
    fctx.fill();
  }
}
