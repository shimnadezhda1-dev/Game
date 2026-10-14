import { useSyncExternalStore } from "react";
import { isEntitlement, type Entitlement } from "./entitlement";
import { EntitlementService } from "./EntitlementService";
import { MockPurchaseProvider } from "./MockPurchaseProvider";
import { UnavailablePurchaseProvider, type PurchaseProvider } from "./PurchaseProvider";

export * from "./entitlement";
export { trackEvent } from "./analytics";
export type { PurchaseResult, RestoreResult } from "./PurchaseProvider";

/**
 * Dev tools (mock purchase, VITE_DEV_ENTITLEMENT, TRIAL/FULL switch) exist only in
 * `vite` dev server and in `vite build --mode trialdev`. A regular production build
 * ignores VITE_DEV_ENTITLEMENT even if it is set.
 */
export const ENTITLEMENT_DEV_TOOLS = import.meta.env.DEV || import.meta.env.MODE === "trialdev";

function devDefaultEntitlement(): Entitlement {
  const raw = import.meta.env.VITE_DEV_ENTITLEMENT;
  return isEntitlement(raw) ? raw : "trial";
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Dev only: `?devEntitlement=trial|full|reset` switches the mock before the first render. */
function applyDevUrlSwitch(provider: MockPurchaseProvider): void {
  let value: string | null = null;
  try {
    value = new URLSearchParams(window.location.search).get("devEntitlement");
  } catch {
    return;
  }
  if (isEntitlement(value)) {
    provider.setOverride(value);
  } else if (value === "reset") {
    provider.resetMockPurchase();
  }
}

function createPurchaseProvider(): PurchaseProvider {
  if (ENTITLEMENT_DEV_TOOLS) {
    const provider = new MockPurchaseProvider({
      defaultEntitlement: devDefaultEntitlement(),
      storage: safeLocalStorage()
    });
    applyDevUrlSwitch(provider);
    return provider;
  }
  return new UnavailablePurchaseProvider();
}

export const entitlementService = new EntitlementService(createPurchaseProvider(), {
  devTools: ENTITLEMENT_DEV_TOOLS
});

void entitlementService.refresh();

export function useEntitlement(): Entitlement {
  return useSyncExternalStore(
    (listener) => entitlementService.subscribe(listener),
    () => entitlementService.getEntitlement()
  );
}

export type ParentFlowSource = "locked_letter" | "locked_feature" | "trial_complete" | "home";

type ParentFlowListener = (source: ParentFlowSource) => void;
const parentFlowListeners = new Set<ParentFlowListener>();

/** «Позвать взрослого»: always lands on the parent gate first. */
export function requestParentFlow(source: ParentFlowSource): void {
  for (const listener of parentFlowListeners) {
    listener(source);
  }
}

export function onParentFlowRequest(listener: ParentFlowListener): () => void {
  parentFlowListeners.add(listener);
  return () => {
    parentFlowListeners.delete(listener);
  };
}
