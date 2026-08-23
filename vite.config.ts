import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages keeps `/Game/`. Capacitor APK uses `/` via `npm run build:android`.
const capacitorBuild = process.env.CAPACITOR === "1";

export default defineConfig({
  base: capacitorBuild ? "/" : "/Game/",
  plugins: [react()]
});
