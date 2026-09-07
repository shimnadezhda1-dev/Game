import { LetterItem } from "../types";
import { useEffect, useState } from "react";

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
  const pageSize = useLetterPageSize();
  const [page, setPage] = useState(0);
  const letterKey = letters.map((letter) => letter.id).join(",");
  const pageCount = Math.max(1, Math.ceil(letters.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = letters.slice(safePage * pageSize, safePage * pageSize + pageSize);

  useEffect(() => {
    const selectedIndex = letters.findIndex((letter) => letter.id === selectedLetterId);
    setPage(selectedIndex >= 0 ? Math.floor(selectedIndex / pageSize) : 0);
  }, [letterKey, pageSize]);

  return (
    <div className="letter-selector">
      <div className="letter-pick-grid">
        {visible.map((letter) => (
          <button
            key={letter.id}
            type="button"
            className={`home-letter-chip ${selectedLetterId === letter.id ? "is-selected" : ""}`}
            aria-selected={selectedLetterId === letter.id}
            onClick={() => onSelect(letter.id)}
          >
            {letter.upper}
          </button>
        ))}
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
    </div>
  );
}
