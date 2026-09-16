import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/**
 * `BASE_PATH` lets the same build target different hosts:
 *   - project page  -> /qr-studio/        (default)
 *   - user page     -> BASE_PATH=/ npm run build
 *   - custom domain -> BASE_PATH=/ npm run build
 */
export default defineConfig({
  base: process.env.BASE_PATH ?? "/qr-studio/",
  plugins: [react()],
  build: {
    target: "es2022",
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split the rarely-changing vendor code so a UI tweak does not force
        // every visitor to re-download React.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (id.includes("node_modules/qrcode-generator")) return "qr";
          return undefined;
        },
      },
    },
  },
});
