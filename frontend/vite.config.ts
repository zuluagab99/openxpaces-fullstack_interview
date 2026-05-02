import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
    proxy: {
      "/deals":     backendUrl,
      "/analytics": backendUrl,
    },
  },
});