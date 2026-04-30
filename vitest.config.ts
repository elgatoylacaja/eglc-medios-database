import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@scripts": resolve(__dirname, "./scripts"),
    },
  },
  test: {
    globals: true,
  },
});
