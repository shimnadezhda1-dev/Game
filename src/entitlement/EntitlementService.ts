import {
  allowedLettersFor,
  canAccessLetterFor,
  type Entitlement,
  type LetterRef
} from "./entitlement";
import { trackEvent } from "./analytics";
import type { PurchaseProvider, PurchaseResult, RestoreResult } from "./PurchaseProvider";

type Listener = (entitlement: Entitlement) => void;

interface DevPurchaseControls {
  setOverride(entitlement: Entitlement | null): void;
  resetMockPurchase(): void;
}

function devControls(provider: PurchaseProvider): DevPurchaseControls | null {
  const candidate = provider as Partial<DevPurchaseControls>;
  return provider.kind === "mock" &&
    typeof candidate.setOverride === "function" &&
    typeof candidate.resetMockPurchase === "function"
    ? (candidate as DevPurchaseControls)
    : null;
}

export class EntitlementService {
  private current: Entitlement = "trial";
  private resolved = false;
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly provider: PurchaseProvider,
    private readonly options: { devTools: boolean }
  ) {}

  getEntitlement(): Entitlement {
    return this.current;
  }

  isFullVersion(): boolean {
    return this.current === "full";
  }

  /** Accepts a letter item or its uppercase glyph ("А", "Е", ...). */
  canAccessLetter(letter: LetterRef | string): boolean {
    return canAccessLetterFor(this.current, typeof letter === "string" ? { upper: letter } : letter);
  }

  allowedLetters<T extends LetterRef>(letters: readonly T[]): T[] {
    return allowedLettersFor(letters, this.current);
  }

  isResolved(): boolean {
    return this.resolved;
  }

  hasDevTools(): boolean {
    return this.options.devTools && devControls(this.provider) !== null;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async refresh(): Promise<Entitlement> {
    try {
      this.apply(await this.provider.getEntitlement());
    } catch {
      // Provider failure keeps the current entitlement; it never downgrades.
    }
    if (!this.resolved) {
      this.resolved = true;
      if (this.current === "trial") {
        trackEvent("trial_started");
      }
      this.emit();
    }
    return this.current;
  }

  async purchaseFullVersion(): Promise<PurchaseResult> {
    trackEvent("purchase_started", { provider: this.provider.kind });
    let result: PurchaseResult;
    try {
      result = await this.provider.purchaseFullVersion();
    } catch (error) {
      result = { status: "error", message: error instanceof Error ? error.message : "Ошибка покупки" };
    }
    if (result.status === "purchased") {
      this.apply("full");
      trackEvent("purchase_completed", { provider: this.provider.kind });
    }
    return result;
  }

  async restorePurchase(): Promise<RestoreResult> {
    let result: RestoreResult;
    try {
      result = await this.provider.restorePurchase();
    } catch (error) {
      result = { status: "error", message: error instanceof Error ? error.message : "Ошибка восстановления" };
    }
    if (result.status === "restored") {
      this.apply("full");
      trackEvent("purchase_restored", { provider: this.provider.kind });
    }
    return result;
  }

  /** Dev builds only: lets a developer flip TRIAL/FULL, including a downgrade. */
  devSetEntitlement(entitlement: Entitlement): void {
    if (!this.hasDevTools()) {
      return;
    }
    devControls(this.provider)?.setOverride(entitlement);
    this.apply(entitlement, true);
  }

  devResetMockPurchase(): void {
    if (!this.hasDevTools()) {
      return;
    }
    devControls(this.provider)?.resetMockPurchase();
    void this.provider.getEntitlement().then((next) => this.apply(next, true));
  }

  private apply(next: Entitlement, devForce = false): void {
    if (this.current === "full" && next === "trial" && !(devForce && this.hasDevTools())) {
      return;
    }
    if (this.current === next) {
      return;
    }
    this.current = next;
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.current);
    }
  }
}
