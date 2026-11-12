import release from "../data/release.json";
import catalog from "../data/catalog.json";

export { release, catalog };

export const repository = "https://github.com/NotchNotch/notchnotch";
export const storeRepository = "https://github.com/NotchNotch/notchnotch-extensions";

export type CatalogEntry = (typeof catalog.extensions)[number];

/** The docs sidebar, in reading order. Ids are collection ids (URL paths without slashes). */
export const docsNav: { label: string; items: { id: string; label?: string }[] }[] = [
  {
    label: "Using NotchNotch",
    items: [{ id: "docs", label: "Overview" }, { id: "docs/guide/using-notchnotch", label: "Guide" }],
  },
  {
    label: "Building extensions",
    items: [
      "getting-started", "concepts", "components", "preferences", "storage",
      "network", "connections", "native-helpers", "manifest", "publishing",
    ].map((name) => ({ id: `docs/extensions/${name}` })),
  },
  {
    label: "Contributing",
    items: [
      { id: "docs/contributing" },
      ...["architecture", "releasing", "store-catalog", "performance"].map((name) => ({ id: `docs/internals/${name}` })),
      { id: "docs/internals/decisions/0001-native-extension-platform", label: "Decisions" },
    ],
  },
  {
    label: "Project",
    items: [{ id: "changelog" }, { id: "privacy" }, { id: "security" }],
  },
];

export const url = (id: string) => `/${id}/`;

export const authorOf = (entry: CatalogEntry) => entry.handle.split("/")[0];
export const storeUrl = (entry: CatalogEntry) => `/store/${entry.handle}/`;

/** Catalog entries sorted by name. */
export const extensions = [...catalog.extensions].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
export const categories = [...new Set(extensions.flatMap((entry) => entry.manifest.categories ?? []))].sort();
