import { ReactNode } from "react";
import { MenuImageButton, PlayMenuKind } from "./MenuImageButton";
import { assetUrl } from "../utils/assets";

export type HomeChoiceTone = "blue" | "purple" | "orange" | "pink" | "green";

interface HomeChoiceListProps<T extends string> {
  name: string;
  value: T;
  options: Array<{
    value: T;
    label: string;
    tone: HomeChoiceTone;
    icon?: ReactNode;
    image?: string;
    disabled?: boolean;
    unavailableLabel?: string;
  }>;
  onChange: (value: T) => void;
  rowLayout?: boolean;
}

export function HomeChoiceList<T extends string>({
  name,
  value,
  options,
  onChange,
  rowLayout: _rowLayout = false
}: HomeChoiceListProps<T>) {
  return (
    <div className="home-choice-list" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const selected = value === option.value;
        const icon = option.icon ?? (
          option.image ? (
            <img
              className="home-choice__icon-img"
              src={assetUrl(option.image)}
              alt=""
              draggable={false}
            />
          ) : null
        );
        return (
          <button
            key={option.value}
            type="button"
            className={`home-choice home-choice--${option.tone} ${
              selected ? "is-selected" : ""
            }`}
            role="radio"
            aria-checked={selected}
            aria-label={option.label}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {selected ? (
              <span className="home-choice__check" aria-hidden="true">
                ✓
              </span>
            ) : null}
            {icon ? (
              <span className="home-choice__icon" aria-hidden="true">
                {icon}
              </span>
            ) : null}
            <span className="home-choice__label">{option.label}</span>
            {option.disabled ? (
              <small className="home-choice__soon">{option.unavailableLabel ?? "Пока нельзя"}</small>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

interface HomePanelProps {
  kind: PlayMenuKind;
  children: ReactNode;
  compact?: boolean;
}

export function HomePanel({ kind, children, compact = false }: HomePanelProps) {
  return (
    <section
      className={`home-panel home-settings-card${compact ? " home-settings-card--compact" : ""}`}
    >
      <h2 className="home-panel__title">
        <MenuImageButton kind={kind} />
      </h2>
      {children}
    </section>
  );
}
