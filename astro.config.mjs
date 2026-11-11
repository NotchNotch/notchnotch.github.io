// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const guide = (slug, label) => (label ? { slug, label } : { slug });

export default defineConfig({
  site: "https://notchnotch.github.io",
  integrations: [
    starlight({
      title: "NotchNotch",
      description: "The notch on your Mac, put to work. Music, calendar, timers and extensions you build in React.",
      logo: { light: "./src/assets/logo.svg", dark: "./src/assets/logo-white.svg", alt: "NotchNotch" },
      favicon: "/favicon.svg",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/NotchNotch/notchnotch" },
      ],
      customCss: ["./src/styles/site.css"],
      lastUpdated: false,
      sidebar: [
        { label: "Using NotchNotch", items: [guide("docs/guide/using-notchnotch", "Guide"), { label: "Store", link: "/store/" }] },
        {
          label: "Building extensions",
          items: [
            guide("docs/extensions/getting-started"), guide("docs/extensions/concepts"), guide("docs/extensions/components"),
            guide("docs/extensions/preferences"), guide("docs/extensions/storage"), guide("docs/extensions/network"),
            guide("docs/extensions/connections"), guide("docs/extensions/native-helpers"), guide("docs/extensions/manifest"),
            guide("docs/extensions/publishing"),
          ],
        },
        {
          label: "Contributing",
          collapsed: true,
          items: [
            guide("docs/contributing"), guide("docs/internals/architecture"), guide("docs/internals/releasing"),
            guide("docs/internals/store-catalog"), guide("docs/internals/performance"),
            { label: "Decisions", items: [{ autogenerate: { directory: "docs/internals/decisions" } }] },
          ],
        },
        { label: "Project", items: [guide("changelog"), guide("privacy"), guide("security")] },
      ],
    }),
  ],
});
