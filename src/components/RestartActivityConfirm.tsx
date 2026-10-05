interface RestartActivityConfirmProps {
  onYes: () => void;
  onNo: () => void;
}

export function RestartActivityConfirm({ onYes, onNo }: RestartActivityConfirmProps) {
  return (
    <div
      className="restart-confirm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restart-confirm-title"
      onClick={onNo}
    >
      <div className="restart-confirm__card" onClick={(event) => event.stopPropagation()}>
        <p id="restart-confirm-title" className="restart-confirm__title">
          Начать это задание сначала?
        </p>
        <div className="restart-confirm__actions">
          <button type="button" className="restart-confirm__btn restart-confirm__btn--yes" onClick={onYes}>
            Да
          </button>
          <button type="button" className="restart-confirm__btn restart-confirm__btn--no" onClick={onNo}>
            Нет
          </button>
        </div>
      </div>
    </div>
  );
}
