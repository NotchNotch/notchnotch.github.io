// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://notchnotch.github.io",
  trailingSlash: "always",
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  markdown: {
    shikiConfig: { theme: "github-dark-default", wrap: false },
  },
});
