import { useId } from "react";
import { Button } from "./ui/button";

export type ThemeTone = "graphite" | "pacific" | "moss" | "plum" | "ember";
export type ThemeMode = "light" | "dark";

const TONES: { value: ThemeTone; label: string }[] = [
  { value: "graphite", label: "Graphite" },
  { value: "pacific", label: "Pacific" },
  { value: "moss", label: "Moss" },
  { value: "plum", label: "Plum" },
  { value: "ember", label: "Ember" },
];

export function ThemeControls({
  tone,
  mode,
  onToneChange,
  onModeChange,
}: {
  tone: ThemeTone;
  mode: ThemeMode;
  onToneChange: (tone: ThemeTone) => void;
  onModeChange: (mode: ThemeMode) => void;
}) {
  const toneLabelId = useId();
  const modeLabelId = useId();

  return (
    <div className="theme-controls" aria-label="Theme controls">
      <div className="theme-mode" role="group" aria-labelledby={modeLabelId}>
        <span id={modeLabelId}>Appearance</span>
        <Button
          type="button"
          size="sm"
          variant={mode === "light" ? "default" : "outline"}
          data-active={mode === "light"}
          onClick={() => onModeChange("light")}
        >
          Light
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "dark" ? "default" : "outline"}
          data-active={mode === "dark"}
          onClick={() => onModeChange("dark")}
        >
          Dark
        </Button>
      </div>

      <div className="theme-swatches" role="radiogroup" aria-labelledby={toneLabelId}>
        <span id={toneLabelId}>Theme</span>
        {TONES.map((item) => (
          <button
            key={item.value}
            type="button"
            className="theme-swatch"
            data-tone={item.value}
            data-active={tone === item.value}
            aria-checked={tone === item.value}
            role="radio"
            onClick={() => onToneChange(item.value)}
          >
            <span aria-hidden="true" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
