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
  rowLayout = false
}: HomeChoiceListProps<T>) {
  return (
    <div className="home-choice-list" role="radiogroup" aria-label={name}>
      {options.map((option) => {
        const useArt = Boolean(option.image) && !rowLayout;
        return (
          <button
            key={option.value}
            type="button"
            className={`home-choice home-choice--${option.tone} ${
              useArt ? "home-choice--art" : ""
            } ${value === option.value ? "is-selected" : ""}`}
            role="radio"
            aria-checked={value === option.value}
            aria-label={option.label}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
          >
            {useArt ? (
              <img
                className="home-choice__art"
                src={assetUrl(option.image!)}
                alt=""
                draggable={false}
              />
            ) : (
              <>
                <span className="home-choice__icon" aria-hidden="true">
                  {option.icon}
                </span>
                <span className="home-choice__label">{option.label}</span>
              </>
            )}
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
}

export function HomePanel({ kind, children }: HomePanelProps) {
  return (
    <section className="home-panel">
      <h2 className="home-panel__title">
        <MenuImageButton kind={kind} />
      </h2>
      {children}
    </section>
  );
}
