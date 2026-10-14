import { useState } from "react";
import {
  entitlementService,
  useEntitlement,
  type PurchaseResult,
  type RestoreResult
} from "../entitlement";

interface ParentScreenProps {
  onClose: () => void;
}

const BENEFITS = [
  "весь алфавит А–Я",
  "все четыре занятия",
  "три уровня сложности",
  "вся коллекция наград и наклеек",
  "«Моя полянка»",
  "будущие обновления этой версии"
];

function purchaseMessage(result: PurchaseResult): string {
  switch (result.status) {
    case "purchased":
      return "Полная версия открыта. Спасибо!";
    case "cancelled":
      return "Покупка отменена.";
    case "unavailable":
    case "error":
      return result.message;
  }
}

function restoreMessage(result: RestoreResult): string {
  switch (result.status) {
    case "restored":
      return "Покупка восстановлена. Полная версия открыта.";
    case "not_found":
      return "Покупка не найдена.";
    case "unavailable":
    case "error":
      return result.message;
  }
}

export function ParentScreen({ onClose }: ParentScreenProps) {
  const entitlement = useEntitlement();
  const isFull = entitlement === "full";
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const devTools = entitlementService.hasDevTools();

  async function buy() {
    if (busy) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await entitlementService.purchaseFullVersion();
    setBusy(false);
    setMessage(purchaseMessage(result));
  }

  async function restore() {
    if (busy) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await entitlementService.restorePurchase();
    setBusy(false);
    setMessage(restoreMessage(result));
  }

  return (
    <div className="parent-overlay" role="dialog" aria-modal="true" aria-label="Полная версия">
      <section className="parent-card parent-screen">
        <h2>Полная версия «Весёлого алфавита»</h2>
        <p className="parent-screen__lead">Откройте весь русский алфавит и продолжите обучение.</p>
        <ul className="parent-screen__benefits">
          {BENEFITS.map((item) => (
            <li key={item}>
              <span aria-hidden="true">✓</span> {item}
            </li>
          ))}
        </ul>
        <div className="parent-screen__price">
          <strong>599 ₽ ОДИН РАЗ</strong>
          <span>БЕЗ РЕКЛАМЫ · БЕЗ ПОДПИСКИ</span>
          <span className="parent-screen__forever">Одна покупка — полный доступ навсегда</span>
        </div>
        {isFull ? (
          <p className="parent-screen__owned">✓ Полная версия открыта</p>
        ) : (
          <button type="button" className="parent-screen__buy" disabled={busy} onClick={buy}>
            КУПИТЬ ПОЛНУЮ ВЕРСИЮ — 599 ₽
          </button>
        )}
        <button type="button" className="parent-screen__restore" disabled={busy} onClick={restore}>
          Восстановить покупку
        </button>
        {busy ? <p className="parent-screen__status">Подождите…</p> : null}
        {message ? (
          <p className="parent-screen__status" role="status">
            {message}
          </p>
        ) : null}
        {devTools ? (
          <div className="parent-screen__dev" aria-label="Только для разработки">
            <span>DEV · mock: {entitlement.toUpperCase()}</span>
            <button type="button" onClick={() => entitlementService.devSetEntitlement("trial")}>
              TRIAL
            </button>
            <button type="button" onClick={() => entitlementService.devSetEntitlement("full")}>
              FULL
            </button>
            <button type="button" onClick={() => entitlementService.devResetMockPurchase()}>
              Сбросить mock-покупку
            </button>
          </div>
        ) : null}
        <button type="button" className="parent-card__back" onClick={onClose}>
          {isFull ? "Готово" : "Назад"}
        </button>
      </section>
    </div>
  );
}
