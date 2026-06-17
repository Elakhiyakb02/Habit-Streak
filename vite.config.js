import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Deploying to GitHub Pages under a subpath? set base to "/<repo-name>/".
// For Netlify / Vercel / custom domain, leave it "/".
export default defineConfig({
  base: "/",
  plugins: [react()],
});
