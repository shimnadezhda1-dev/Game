import { useEffect, useRef, useState } from "react";
import { OptionCount } from "../types";
import { DifficultySelector } from "./DifficultySelector";

interface QuickSettingsProps {
  optionCount: OptionCount;
  availableCounts: readonly OptionCount[];
  onOptionCountChange: (value: OptionCount) => void;
}

export function QuickSettings({
  optionCount,
  availableCounts,
  onOptionCountChange
}: QuickSettingsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const closeFromOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeFromKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromKeyboard);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromKeyboard);
    };
  }, [open]);

  return (
    <div className="quick-settings" ref={rootRef}>
      <button
        type="button"
        className="quick-settings__button"
        aria-label="Настройки сложности"
        aria-expanded={open}
        aria-controls="quick-settings-popover"
        onClick={() => setOpen((value) => !value)}
      >
        <span aria-hidden="true">⚙️</span>
      </button>
      {open ? (
        <div
          id="quick-settings-popover"
          className="quick-settings__popover"
          role="dialog"
          aria-label="Быстрые настройки"
        >
          <p>Сложность</p>
          <DifficultySelector
            value={optionCount}
            availableCounts={availableCounts}
            onChange={onOptionCountChange}
            compact
          />
        </div>
      ) : null}
    </div>
  );
}
