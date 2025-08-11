import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.VITE_API_PORT || 81}`,
        changeOrigin: true,
      },
    },
    port: process.env.VITE_PORT || 80,
  },
});
