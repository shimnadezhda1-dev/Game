import { PlayerPreference } from "../types";

interface PlayerChooserProps {
  value?: PlayerPreference | null;
  onChoose: (value: PlayerPreference) => void;
}

export const PLAYER_PREFERENCE_OPTIONS: Array<{
  value: PlayerPreference;
  label: string;
  icon: string;
}> = [
  { value: "boy", label: "Мальчик", icon: "👦" },
  { value: "girl", label: "Девочка", icon: "👧" }
];

export function playerPreferenceLabel(value: PlayerPreference | null): string {
  return PLAYER_PREFERENCE_OPTIONS.find((option) => option.value === value)?.label ?? "Кто играет";
}

export function playerPreferenceIcon(value: PlayerPreference | null): string {
  if (value === "boy") {
    return "👦";
  }
  if (value === "girl") {
    return "👧";
  }
  return "👦👧";
}

export function playerPreferenceAriaLabel(value: PlayerPreference | null): string {
  if (value === "boy") {
    return "Кто играет: Мальчик. Изменить выбор";
  }
  if (value === "girl") {
    return "Кто играет: Девочка. Изменить выбор";
  }
  return "Кто сегодня играет?";
}

export function PlayerChooser({ value = null, onChoose }: PlayerChooserProps) {
  return (
    <div className="player-chooser" role="dialog" aria-modal="true" aria-labelledby="player-chooser-title">
      <div className="player-chooser__card">
        <h1 id="player-chooser-title" className="player-chooser__title">
          Кто сегодня играет?
        </h1>
        <div className="player-chooser__choices">
          {PLAYER_PREFERENCE_OPTIONS.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={`player-chooser__btn player-chooser__btn--${option.value}${
                  selected ? " is-selected" : ""
                }`}
                aria-pressed={selected}
                onClick={() => onChoose(option.value)}
              >
                <span className="player-chooser__icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
