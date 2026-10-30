import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    exclude: ["**/node_modules/**", "**/.next/**"],
    // Use jsdom for browser-like environment (React components, DOM APIs)
    environment: "jsdom",
    // Setup file to extend matchers (e.g. @testing-library/jest-dom)
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // Env vars required by env.ts validation at module load time
    env: {
      JWT_SECRET: "test-secret-that-is-at-least-32-chars!!",
    },
  },
  resolve: {
    alias: {
      // Match the @/* path alias defined in tsconfig.json
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
