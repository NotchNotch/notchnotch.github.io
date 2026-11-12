import { getCollection, render } from "astro:content";
import { extensions, authorOf, storeUrl, docsNav } from "../lib/site";

// The ⌘K palette's index: one item per docs page, one per ## and ### section,
// and one per Store extension. Fetched the first time the palette opens.

const plain = (markdown: string) => markdown
  .replace(/```[\s\S]*?```/g, " ")
  .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
  .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/[`*_>|#]/g, "")
  .replace(/-{3,}/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const sectionOf = new Map(docsNav.flatMap((group) => group.items.map((item) => [item.id, group.label] as const)));

export async function GET() {
  const items: { t: string; s: string; u: string; h?: string; x: string; i?: string }[] = [];

  for (const entry of await getCollection("docs")) {
    const { headings } = await render(entry);
    const url = `/${entry.id}/`;
    const section = sectionOf.get(entry.id) ?? (entry.id.startsWith("docs/internals") ? "Contributing" : "Docs");
    // Split outside code blocks so a "## " inside a sample isn't taken for a heading.
    const body = (entry.body ?? "").replace(/```[\s\S]*?```/g, (block) => block.replace(/^#/gm, " #"));
    const parts = body.split(/^#{2,3} .*$/m);
    const sections = headings.filter((heading) => heading.depth <= 3);
    items.push({ t: entry.data.title, s: section, u: url, x: plain(parts[0]).slice(0, 400) });
    sections.forEach((heading, i) => {
      items.push({ t: entry.data.title, s: section, u: `${url}#${heading.slug}`, h: heading.text, x: plain(parts[i + 1] ?? "").slice(0, 400) });
    });
  }

  for (const entry of extensions) {
    const { manifest } = entry;
    items.push({
      t: manifest.name, s: "Store", u: storeUrl(entry), i: entry.iconDark ?? entry.icon,
      x: `${manifest.description} ${authorOf(entry)} ${(manifest.categories ?? []).join(" ")}`,
    });
  }

  return new Response(JSON.stringify(items), { headers: { "Content-Type": "application/json" } });
}
