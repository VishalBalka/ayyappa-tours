import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    // Dev proxy — rewrites /api calls to your local backend
    // In production this is NOT used; VITE_API_URL env var is used instead
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    sourcemap: false,       // never expose source maps in production
    minify: "terser",       // smaller, harder to reverse-engineer bundle
    terserOptions: {
      compress: {
        drop_console: true, // strip all console.log from production build
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        // Split vendor code for better caching
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          query:  ["@tanstack/react-query"],
        },
      },
    },
  },
});