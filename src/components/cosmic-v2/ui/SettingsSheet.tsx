import { Link } from "react-router-dom";
import { Sliders } from "lucide-react";
import { useSceneStore, useAudioUiStore, usePhysicsUiStore, type ThemeId } from "@/stores/v2Stores";
import { SCALE_ORDER, SCALES } from "@/components/cosmic-synth/constants";
import { THEMES } from "../three/themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SettingsSheetProps {
  onForceWeatherShift?: () => void;
  currentMoodLabel?: string;
}

export function SettingsSheet({ onForceWeatherShift, currentMoodLabel }: SettingsSheetProps) {
  const themeId = useSceneStore((s) => s.themeId);
  const setTheme = useSceneStore((s) => s.setTheme);
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const setReducedMotion = useSceneStore((s) => s.setReducedMotion);

  const scaleId = useAudioUiStore((s) => s.scaleId);
  const setScale = useAudioUiStore((s) => s.setScale);
  const masterVolume = useAudioUiStore((s) => s.masterVolume);
  const setMasterVolume = useAudioUiStore((s) => s.setMasterVolume);

  const touchMode = usePhysicsUiStore((s) => s.touchMode);
  const setTouchMode = usePhysicsUiStore((s) => s.setTouchMode);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="secondary"
          className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full bg-white/10 text-white backdrop-blur-lg hover:bg-white/20 border border-white/20"
          aria-label="Open settings"
        >
          <Sliders className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(90vw,380px)] border-white/10 bg-black/90 text-white backdrop-blur-xl">
        <SheetHeader>
          <SheetTitle className="text-white">Cosmic v2</SheetTitle>
          <SheetDescription className="text-white/60">
            Shape the galaxy. Physics plays the music.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {currentMoodLabel && (
            <section>
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Weather</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-lg font-medium">{currentMoodLabel}</span>
                {onForceWeatherShift && (
                  <Button size="sm" variant="outline" onClick={onForceWeatherShift} className="border-white/20 bg-transparent text-white hover:bg-white/10">
                    Shift
                  </Button>
                )}
              </div>
            </section>
          )}

          <section>
            <div className="text-xs uppercase tracking-[0.18em] text-white/50">Theme</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(Object.keys(THEMES) as ThemeId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => setTheme(id)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition",
                    themeId === id
                      ? "border-white/50 bg-white/10"
                      : "border-white/10 bg-transparent text-white/70 hover:border-white/30 hover:text-white"
                  )}
                >
                  {THEMES[id].label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs uppercase tracking-[0.18em] text-white/50">Scale</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {SCALE_ORDER.map((sid) => (
                <button
                  key={sid}
                  onClick={() => setScale(sid)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition",
                    scaleId === sid
                      ? "border-white/50 bg-white/10"
                      : "border-white/10 bg-transparent text-white/70 hover:border-white/30 hover:text-white"
                  )}
                >
                  {SCALES[sid].label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="text-xs uppercase tracking-[0.18em] text-white/50">Touch mode</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["sculpt", "spark"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTouchMode(m)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm capitalize transition",
                    touchMode === m
                      ? "border-white/50 bg-white/10"
                      : "border-white/10 bg-transparent text-white/70 hover:border-white/30 hover:text-white"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-white/50">
              {touchMode === "sculpt"
                ? "Touch bends gravity. Bodies react. Sound follows."
                : "Tap to release a spark. It strikes something and sings."}
            </p>
          </section>

          <section>
            <div className="text-xs uppercase tracking-[0.18em] text-white/50">Master volume</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="mt-3 w-full accent-white"
              aria-label="Master volume"
            />
          </section>

          <section className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-white/50">Reduced motion</div>
              <div className="text-xs text-white/40">Freezes camera orbit</div>
            </div>
            <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
          </section>

          <section className="pt-4 border-t border-white/10">
            <Link
              to="/"
              className="block w-full text-center rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
            >
              ← Back to classic
            </Link>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
