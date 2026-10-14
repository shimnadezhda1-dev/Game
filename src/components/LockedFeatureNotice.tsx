interface LockedFeatureNoticeProps {
  message: string;
  onCallAdult: () => void;
  onClose: () => void;
}

export function LockedFeatureNotice({ message, onCallAdult, onClose }: LockedFeatureNoticeProps) {
  return (
    <div className="locked-feature-overlay" onClick={onClose}>
      <div
        className="locked-letter-notice locked-feature-notice"
        role="alertdialog"
        aria-label="Откроется в полной версии"
        onClick={(event) => event.stopPropagation()}
      >
        <p>
          <span aria-hidden="true">🔒 </span>
          {message}
        </p>
        <div className="locked-letter-notice__actions">
          <button type="button" className="locked-letter-notice__adult" onClick={onCallAdult}>
            Позвать взрослого
          </button>
          <button
            type="button"
            className="locked-letter-notice__close"
            aria-label="Закрыть"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
