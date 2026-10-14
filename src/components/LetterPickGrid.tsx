import { LetterItem } from "../types";
import { useEffect, useState } from "react";
import { canAccessLetterFor, requestParentFlow, trackEvent, useEntitlement } from "../entitlement";
import { audioManager } from "../audio/AudioManager";
import { speakLockedFeatureHint } from "../audio/trialVoice";

interface LetterPickGridProps {
  letters: readonly LetterItem[];
  selectedLetterId: string;
  onSelect: (id: string) => void;
}

function useLetterPageSize() {
  const [pageSize, setPageSize] = useState(8);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 820px)");
    const apply = () => setPageSize(media.matches ? 6 : 8);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return pageSize;
}

export function LetterPickGrid({
  letters,
  selectedLetterId,
  onSelect
}: LetterPickGridProps) {
  const entitlement = useEntitlement();
  const pageSize = useLetterPageSize();
  const [page, setPage] = useState(0);
  const [lockedNotice, setLockedNotice] = useState(false);
  const letterKey = letters.map((letter) => letter.id).join(",");
  const pageCount = Math.max(1, Math.ceil(letters.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = letters.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    const selectedIndex = letters.findIndex((letter) => letter.id === selectedLetterId);
    setPage(selectedIndex >= 0 ? Math.floor(selectedIndex / pageSize) : 0);
  }, [letterKey, pageSize]);

  useEffect(() => {
    if (entitlement === "full") {
      setLockedNotice(false);
    }
  }, [entitlement]);

  return (
    <div className="letter-selector">
      <div className="letter-pick-grid">
        {visible.map((letter) => {
          const locked = !canAccessLetterFor(entitlement, letter);
          const selected = !locked && selectedLetterId === letter.id;
          return (
            <button
              key={letter.id}
              type="button"
              className={`home-letter-chip ${selected ? "is-selected" : ""}${locked ? " is-locked" : ""}`}
              aria-selected={selected}
              aria-label={locked ? `${letter.upper} — откроется в полной версии` : undefined}
              onClick={() => {
                if (locked) {
                  trackEvent("locked_letter_clicked", { letterId: letter.id });
                  setLockedNotice(true);
                  speakLockedFeatureHint();
                  return;
                }
                onSelect(letter.id);
              }}
            >
              {letter.upper}
              {locked ? (
                <span className="home-letter-chip__lock" aria-hidden="true">
                  🔒
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {pageCount > 1 ? (
        <div className="letter-pager" role="navigation" aria-label="Страницы букв">
          <button
            type="button"
            className="letter-pager__btn"
            aria-label="Предыдущая страница"
            disabled={safePage <= 0}
            onClick={() => setPage((value) => Math.max(0, value - 1))}
          >
            ←
          </button>
          <span className="letter-pager__status">
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="letter-pager__btn"
            aria-label="Следующая страница"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          >
            →
          </button>
        </div>
      ) : null}
      {lockedNotice ? (
        <div className="locked-letter-notice" role="alertdialog" aria-label="Буква закрыта">
          <p>Эта буква откроется в полной версии</p>
          <div className="locked-letter-notice__actions">
            <button
              type="button"
              className="locked-letter-notice__adult"
              onClick={() => {
                audioManager.stopSpeaking();
                setLockedNotice(false);
                requestParentFlow("locked_letter");
              }}
            >
              Позвать взрослого
            </button>
            <button
              type="button"
              className="locked-letter-notice__close"
              aria-label="Закрыть"
              onClick={() => setLockedNotice(false)}
            >
              ✕
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
