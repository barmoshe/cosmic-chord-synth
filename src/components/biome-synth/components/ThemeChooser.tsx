export type BiomeTheme = "space" | "jungle" | "sea" | "cyberpunk";

interface ThemeChooserProps {
  theme: BiomeTheme;
  onChange: (t: BiomeTheme) => void;
}

const OPTIONS: { value: BiomeTheme; label: string; hint: string }[] = [
  { value: "space",     label: "SPACE",     hint: "Cosmic galaxy" },
  { value: "jungle",    label: "JUNGLE",    hint: "Canopy + monkeys" },
  { value: "sea",       label: "SEA",       hint: "Reef + fish + waves" },
  { value: "cyberpunk", label: "CYBERPUNK", hint: "Neon city + rain" },
];

export default function ThemeChooser({ theme, onChange }: ThemeChooserProps) {
  return (
    <div className="theme-chooser" role="radiogroup" aria-label="Theme">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={theme === o.value}
          title={o.hint}
          onTouchStart={(e) => { e.preventDefault(); onChange(o.value); }}
          onClick={() => onChange(o.value)}
          className={`theme-chooser-option${theme === o.value ? " is-active" : ""}`}
        >
          <span className="theme-chooser-dot" aria-hidden="true" />
          {o.label}
        </button>
      ))}
    </div>
  );
}
