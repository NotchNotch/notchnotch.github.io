import { Marked } from "marked";

const escape = (text: string) => text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** README text comes from contributors: no raw HTML, only web and relative links. */
export function renderReadme(markdown: string, base: string) {
  const safe = (href: string) => {
    try {
      const url = new URL(href, base);
      return ["https:", "http:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const marked = new Marked({
    renderer: {
      html: ({ text }) => escape(text),
      link({ href, title, tokens }) {
        const target = safe(href); const label = this.parser.parseInline(tokens);
        return target ? `<a href="${escape(target)}"${title ? ` title="${escape(title)}"` : ""} rel="nofollow noopener">${label}</a>` : label;
      },
      image({ href, text }) {
        const target = safe(href);
        return target ? `<img src="${escape(target)}" alt="${escape(text)}" loading="lazy">` : escape(text);
      },
    },
  });
  // The page already shows the name; drop a leading heading that repeats it.
  return marked.parse(markdown.replace(/^#\s+.*\n+/, "")) as string;
}
