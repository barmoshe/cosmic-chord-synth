export type CosmicTheme = "space" | "jungle";

interface ThemeChooserProps {
  theme: CosmicTheme;
  onChange: (t: CosmicTheme) => void;
}

const OPTIONS: { value: CosmicTheme; label: string; hint: string }[] = [
  { value: "space",  label: "SPACE",  hint: "Cosmic galaxy" },
  { value: "jungle", label: "JUNGLE", hint: "Canopy + monkeys" },
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
