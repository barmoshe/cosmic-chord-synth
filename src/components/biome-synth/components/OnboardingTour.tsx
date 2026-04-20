import { useEffect, useState } from "react";

interface OnboardingTourProps {
  onDismiss: () => void;
}

const STEPS = [
  { title: "TAP TO PLAY",         body: "Drag anywhere to play notes. Horizontal = pitch, vertical = filter." },
  { title: "AI DJ",               body: "Press PLAY on the bottom-right panel. A generative composer takes over." },
  { title: "SWITCH BIOMES",       body: "Top-right pills retune the whole synth for each world." },
  { title: "RECORD · EQ · MIDI",  body: "Use the master bar to record, shape the mix, or connect a MIDI keyboard." },
];

/* OnboardingTour — first-run 4-step coachmark. Sets a localStorage flag so
   returning visitors skip straight to play. */
export default function OnboardingTour({ onDismiss }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
      else if (e.key === "ArrowRight") setStep((s) => Math.min(STEPS.length - 1, s + 1));
      else if (e.key === "ArrowLeft") setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDismiss]);

  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="biome-tour" role="dialog" aria-label="Onboarding tour">
      <div className="biome-tour-card">
        <div className="biome-tour-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={`biome-tour-dot${i === step ? " is-active" : ""}`} />
          ))}
        </div>
        <div className="biome-tour-title">{s.title}</div>
        <div className="biome-tour-body">{s.body}</div>
        <div className="biome-tour-actions">
          <button
            type="button"
            className="biome-tour-skip"
            onClick={onDismiss}
          >
            SKIP
          </button>
          {!isLast ? (
            <button
              type="button"
              className="biome-tour-next"
              onClick={() => setStep((s) => s + 1)}
            >
              NEXT →
            </button>
          ) : (
            <button
              type="button"
              className="biome-tour-next"
              onClick={onDismiss}
            >
              LET&apos;S GO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
