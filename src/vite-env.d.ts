/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev/trialdev builds only: starting entitlement for the mock purchase provider. */
  readonly VITE_DEV_ENTITLEMENT?: string;
}
