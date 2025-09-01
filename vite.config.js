import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Vite dev server on port 3000
    proxy: {
      "/api": {
        target: `http://localhost:4010`, // Proxy API calls to Fastify server on 4010
        changeOrigin: true,
      },
    },
  },
});
