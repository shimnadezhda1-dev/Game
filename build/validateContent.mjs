import { build } from "vite";

await build({
  mode: "validate-content",
  build: {
    write: false
  }
});

console.log("Letter content validation passed.");
