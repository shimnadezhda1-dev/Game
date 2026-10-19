import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shimnadezhda.game",
  appName: "Весёлый алфавит",
  webDir: "dist",
  server: {
    androidScheme: "https"
  },
  plugins: {
    // Capacitor 8 core SystemBars plugin. "css" (the default) is pinned explicitly so the
    // inset scheme is documented: native code measures the real WindowInsets and exposes them
    // to the web layer as --safe-area-inset-top/right/bottom/left on <html>.
    // src/styles.css reads them through --inset-* (single source; env() is only a browser fallback).
    SystemBars: {
      insetsHandling: "css"
    }
  }
};

export default config;
