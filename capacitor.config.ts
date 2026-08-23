import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shimnadezhda.game",
  appName: "Весёлый алфавит",
  webDir: "dist",
  server: {
    androidScheme: "https"
  }
};

export default config;
