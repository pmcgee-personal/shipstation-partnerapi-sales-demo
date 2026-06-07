import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom", // Simulates a browser environment for React
    globals: true, // Allows us to use describe(), it(), expect() without importing them
    setupFiles: "./src/setupTests.js", // We will create this file next!
  },
});
