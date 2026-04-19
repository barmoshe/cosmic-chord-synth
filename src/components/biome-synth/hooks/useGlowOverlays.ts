import { useEffect } from "react";
import { noteHex } from "../shared/helpers";

export function useGlowOverlays(
  touchesRef: React.MutableRefObject<Map<any, any>>,
  glowsRef: React.MutableRefObject<Map<any, any>>,
  glowContainerRef: React.MutableRefObject<HTMLDivElement | null>,
) {
  useEffect(() => {
    let raf: number;
    function loop() {
      raf = requestAnimationFrame(loop);
      const container = glowContainerRef.current; if (!container) return;
      const active = touchesRef.current;

      glowsRef.current.forEach((el: any, id: any) => {
        if (!active.has(id)) {
          el.root.style.opacity = "0";
          setTimeout(() => { try { el.root.remove(); } catch {} }, 350);
          glowsRef.current.delete(id);
        }
      });

      active.forEach((info: any, id: any) => {
        let entry = glowsRef.current.get(id);
        if (!entry) {
          const root = document.createElement("div");
          root.style.cssText = "position:fixed;pointer-events:none;z-index:12;transform:translate(-50%,-50%);transition:opacity .3s cubic-bezier(.4,0,.2,1);text-align:center;";
          const orb = document.createElement("div");
          orb.style.cssText = "width:80px;height:80px;border-radius:50%;transition:all .15s ease-out;";
          const label = document.createElement("div");
          label.style.cssText = "font-family:'Orbitron',monospace;font-size:11px;margin-top:6px;letter-spacing:.12em;font-weight:400;transition:color .15s;";
          root.appendChild(orb); root.appendChild(label); container.appendChild(root);
          entry = { root, orb, label, lastMidi: -1, lastX: -1, lastY: -1 };
          glowsRef.current.set(id, entry);
        }
        if (info.x !== entry.lastX || info.y !== entry.lastY) {
          entry.root.style.left = info.x + "px"; entry.root.style.top = info.y + "px";
          entry.lastX = info.x; entry.lastY = info.y;
        }
        if (info.midi !== entry.lastMidi) {
          const hex = noteHex(info.midi);
          entry.orb.style.background = `radial-gradient(circle, ${hex}44 0%, ${hex}11 40%, transparent 70%)`;
          entry.orb.style.boxShadow = `0 0 40px ${hex}66, 0 0 80px ${hex}22`;
          entry.label.style.color = hex;
          entry.label.style.textShadow = `0 0 12px ${hex}`;
          entry.label.textContent = info.note;
          entry.lastMidi = info.midi;
        }
        entry.root.style.opacity = "0.9";
      });
    }
    loop();
    return () => cancelAnimationFrame(raf);
  }, []);
}
