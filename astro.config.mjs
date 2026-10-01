import { defineConfig } from "astro/config";

// SITE_URL and BASE_PATH also support a GitHub Pages project repository.
const site = process.env.SITE_URL;
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  output: "static",
  ...(site ? { site } : {}),
  base,
  trailingSlash: "always",
  build: { format: "directory" },
  vite: {
    cacheDir:
      process.env.NODE_ENV === "production"
        ? ".astro/vite-build"
        : ".astro/vite-dev",
    server: { host: "127.0.0.1" },
  },
});
