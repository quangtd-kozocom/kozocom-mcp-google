import { useState } from "react";
import type { Mode } from "../lib/types";

interface ModeMeta {
  value: Mode;
  name: string;
  tone: "off" | "read" | "strict";
  help: string;
}

const MODES: ModeMeta[] = [
  {
    value: "read_open",
    name: "Read-open",
    tone: "read",
    help: "Read/search open; writes and deletes require grants.",
  },
  {
    value: "strict",
    name: "Strict",
    tone: "strict",
    help: "Only granted resources are visible and usable.",
  },
  {
    value: "off",
    name: "Gate off",
    tone: "off",
    help: "Gate disabled; Google account scope is exposed.",
  },
];

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = MODES.find((m) => m.value === mode) ?? MODES[0];

  function choose(next: Mode) {
    if (next === mode) {
      setOpen(false);
      return;
    }
    if (next === "off" && !window.confirm("Turn Terra Gate off? Existing Google scope will be ungated.")) {
      return;
    }
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="mode-switcher">
      <button
        type="button"
        className="mode-pill"
        data-tone={current.tone}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="status-dot" aria-hidden="true" />
        {current.name}
      </button>
      {open && (
        <div className="mode-popover" role="radiogroup" aria-label="Permission gate mode">
          {MODES.map((m) => {
            const active = m.value === mode;
            return (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={active}
              className="mode-option"
              data-active={active}
              data-tone={m.tone}
              onClick={() => choose(m.value)}
            >
              <span className="status-dot" aria-hidden="true" />
              <strong>{m.name}</strong>
              <span className="help">{m.help}</span>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
