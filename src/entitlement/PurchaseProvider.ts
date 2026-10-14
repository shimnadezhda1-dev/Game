import type { Entitlement } from "./entitlement";

export type PurchaseResult =
  | { status: "purchased"; entitlement: "full" }
  | { status: "cancelled" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

export type RestoreResult =
  | { status: "restored"; entitlement: "full" }
  | { status: "not_found" }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

/**
 * Store billing goes behind this interface (Google Play / RuStore / etc.).
 * Only a provider may grant "full"; local app storage is never proof of purchase.
 */
export interface PurchaseProvider {
  readonly kind: "mock" | "unavailable";
  getEntitlement(): Promise<Entitlement>;
  purchaseFullVersion(): Promise<PurchaseResult>;
  restorePurchase(): Promise<RestoreResult>;
}

export const PURCHASE_UNAVAILABLE_MESSAGE =
  "Покупка пока недоступна в этой версии приложения.";

/** Production placeholder until a real store provider is connected: never grants FULL. */
export class UnavailablePurchaseProvider implements PurchaseProvider {
  readonly kind = "unavailable" as const;

  async getEntitlement(): Promise<Entitlement> {
    return "trial";
  }

  async purchaseFullVersion(): Promise<PurchaseResult> {
    return { status: "unavailable", message: PURCHASE_UNAVAILABLE_MESSAGE };
  }

  async restorePurchase(): Promise<RestoreResult> {
    return { status: "unavailable", message: PURCHASE_UNAVAILABLE_MESSAGE };
  }
}
