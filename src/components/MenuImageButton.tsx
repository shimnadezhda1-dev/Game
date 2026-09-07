import { assetUrl, ASSETS } from "../utils/assets";

export type PlayMenuKind = "difficulty" | "activity" | "order" | "category";

const MENU_IMAGES: Record<PlayMenuKind, { src: string; label: string }> = {
  difficulty: { src: ASSETS.ui.difficultyMenu, label: "Уровень сложности" },
  activity: { src: ASSETS.ui.activityMenu, label: "Выбери занятие" },
  order: { src: ASSETS.ui.orderMenu, label: "Порядок изучения" },
  category: { src: ASSETS.ui.categoryMenu, label: "Категория букв" }
};

interface MenuImageButtonProps {
  kind: PlayMenuKind;
  expanded?: boolean;
  onClick?: () => void;
}

export function MenuImageButton({ kind, expanded, onClick }: MenuImageButtonProps) {
  const menu = MENU_IMAGES[kind];
  return (
    <button
      type="button"
      className="menu-image-btn"
      aria-label={menu.label}
      aria-expanded={onClick ? expanded : undefined}
      onClick={onClick}
    >
      <img src={assetUrl(menu.src)} alt="" draggable={false} />
    </button>
  );
}
