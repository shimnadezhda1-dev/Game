import { isEntitlement, type Entitlement } from "./entitlement";
import type { PurchaseProvider, PurchaseResult, RestoreResult } from "./PurchaseProvider";

export type MockStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export const MOCK_PURCHASE_KEY = "happy-alphabet-dev-mock-purchase-v1";
export const MOCK_OVERRIDE_KEY = "happy-alphabet-dev-entitlement-override-v1";

/**
 * Dev/test-only stand-in for store billing. Never constructed in a production build.
 * The "purchase" lives in its own dev keys, separate from game progress.
 */
export class MockPurchaseProvider implements PurchaseProvider {
  readonly kind = "mock" as const;
  private readonly defaultEntitlement: Entitlement;
  private readonly storage: MockStorage | null;
  private readonly latencyMs: number;

  constructor(options: {
    defaultEntitlement: Entitlement;
    storage: MockStorage | null;
    latencyMs?: number;
  }) {
    this.defaultEntitlement = options.defaultEntitlement;
    this.storage = options.storage;
    this.latencyMs = options.latencyMs ?? 350;
  }

  async getEntitlement(): Promise<Entitlement> {
    const override = this.read(MOCK_OVERRIDE_KEY);
    if (isEntitlement(override)) {
      return override;
    }
    return this.hasPurchase() ? "full" : this.defaultEntitlement;
  }

  async purchaseFullVersion(): Promise<PurchaseResult> {
    await this.delay();
    this.write(MOCK_PURCHASE_KEY, "purchased");
    this.remove(MOCK_OVERRIDE_KEY);
    return { status: "purchased", entitlement: "full" };
  }

  async restorePurchase(): Promise<RestoreResult> {
    await this.delay();
    if (!this.hasPurchase()) {
      return { status: "not_found" };
    }
    this.remove(MOCK_OVERRIDE_KEY);
    return { status: "restored", entitlement: "full" };
  }

  /** Dev switch: force an entitlement without touching the mock purchase record. */
  setOverride(entitlement: Entitlement | null): void {
    if (entitlement) {
      this.write(MOCK_OVERRIDE_KEY, entitlement);
    } else {
      this.remove(MOCK_OVERRIDE_KEY);
    }
  }

  /** Dev switch: forget the mock purchase and any override. */
  resetMockPurchase(): void {
    this.remove(MOCK_PURCHASE_KEY);
    this.remove(MOCK_OVERRIDE_KEY);
  }

  private hasPurchase(): boolean {
    return this.read(MOCK_PURCHASE_KEY) === "purchased";
  }

  private delay(): Promise<void> {
    return this.latencyMs > 0
      ? new Promise((resolve) => setTimeout(resolve, this.latencyMs))
      : Promise.resolve();
  }

  private read(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private write(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value);
    } catch {
      // Dev-only storage; ignore quota/private-mode failures.
    }
  }

  private remove(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch {
      // Dev-only storage; ignore quota/private-mode failures.
    }
  }
}
