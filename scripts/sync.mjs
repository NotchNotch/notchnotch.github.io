// Brings the site's content in from where it's maintained, before each build:
//
//   docs        docs/, PRIVACY, SECURITY and CONTRIBUTING from NotchNotch/notchnotch
//   changelog   CHANGELOG.md from the same repository
//   store       the signed Store catalog, used only if its signature verifies
//   release     the latest release's version and DMG
//
// NOTCHNOTCH_SOURCE=/path/to/notchnotch uses a local checkout instead of cloning.
import { createPublicKey, verify } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const appRepository = "NotchNotch/notchnotch";
export const storeRepository = "NotchNotch/notchnotch-extensions";
const catalogURL = `https://raw.githubusercontent.com/${storeRepository}/catalog/index.json`;

/** Source files that become pages, by their path in the app repository → site slug. */
export function pagesFor(files) {
  const pages = new Map();
  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    if (file === "docs/README.md") pages.set(file, "docs");
    else if (/^docs\/(guide|extensions|internals)\//.test(file)) pages.set(file, file.replace(/\.md$/, ""));
  }
  for (const [file, slug] of [["PRIVACY.md", "privacy"], ["SECURITY.md", "security"], ["CONTRIBUTING.md", "docs/contributing"]]) {
    if (files.includes(file)) pages.set(file, slug);
  }
  pages.set("CHANGELOG.md", "changelog");
  return pages;
}

/**
 * A Markdown file as a Starlight page: its first heading becomes the title,
 * and relative links point at the matching page, or at GitHub when the target
 * isn't on the site.
 */
export function convert(file, text, pages) {
  const heading = /^# (.+)\n+/m.exec(text);
  const title = heading ? heading[1].trim() : path.basename(file, ".md");
  let body = heading ? text.slice(0, heading.index) + text.slice(heading.index + heading[0].length) : text;
  body = body.replace(/\]\((?!https?:|mailto:|#)([^)\s]+?)(#[^)\s]*)?\)/g, (match, target, hash = "") => {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(file), target));
    const slug = pages.get(resolved);
    if (slug) return `](/${slug}/${hash})`;
    const kind = resolved.includes(".") ? "blob" : "tree";
    return `](https://github.com/${appRepository}/${kind}/main/${resolved}${hash})`;
  });
  const quote = (value) => JSON.stringify(value);
  const front = [`title: ${quote(title)}`, `editUrl: ${quote(`https://github.com/${appRepository}/edit/main/${file}`)}`];
  if (file === "CHANGELOG.md") front.push("tableOfContents: { maxHeadingLevel: 2 }");
  return `---\n${front.join("\n")}\n---\n\n${body.trimStart()}`;
}

/** Ed25519 check of the catalog with the app's raw 32-byte public key. */
export function verifies(index, signature, publicKey) {
  const der = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(publicKey.trim(), "base64")]);
  return verify(null, index, createPublicKey({ key: der, format: "der", type: "spki" }), Buffer.from(signature.trim(), "base64"));
}

async function fetchText(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}

async function source() {
  if (process.env.NOTCHNOTCH_SOURCE) return path.resolve(process.env.NOTCHNOTCH_SOURCE);
  const folder = path.join(root, ".cache", "notchnotch");
  await rm(folder, { recursive: true, force: true });
  const result = spawnSync("git", ["clone", "--quiet", "--depth", "1", `https://github.com/${appRepository}.git`, folder], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Couldn't clone the app repository");
  return folder;
}

async function listFiles(folder, base = folder) {
  const found = [];
  for (const item of await readdir(folder, { withFileTypes: true })) {
    const full = path.join(folder, item.name);
    if (item.isDirectory()) found.push(...await listFiles(full, base));
    else found.push(path.relative(base, full).split(path.sep).join("/"));
  }
  return found;
}

async function syncDocs(app) {
  const files = [...await listFiles(path.join(app, "docs"), app).then((list) => list.map((file) => file)), "PRIVACY.md", "SECURITY.md", "CONTRIBUTING.md", "CHANGELOG.md"]
    .filter((file) => existsSync(path.join(app, file)));
  const pages = pagesFor(files);
  const out = path.join(root, "src", "content", "docs");
  for (const folder of ["docs", "changelog.md", "privacy.md", "security.md"]) await rm(path.join(out, folder), { recursive: true, force: true });
  for (const [file, slug] of pages) {
    const target = path.join(out, `${slug === "docs" ? "docs/index" : slug}.md`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, convert(file, await readFile(path.join(app, file), "utf8"), pages));
  }
  return pages.size;
}

async function syncStore(app) {
  const publicKey = await readFile(path.join(app, "apps", "macos", "CatalogPublicKey"), "utf8");
  const nonce = `?t=${Date.now()}`;
  const [index, signature] = await Promise.all([
    fetch(catalogURL + nonce).then((response) => response.arrayBuffer()).then(Buffer.from),
    fetchText(catalogURL + ".sig" + nonce),
  ]);
  if (!verifies(index, signature, publicKey)) throw new Error("The Store catalog's signature doesn't verify; not publishing its pages");
  const catalog = JSON.parse(index);
  for (const entry of catalog.extensions) {
    entry.readmeText = entry.readme ? await fetchText(entry.readme).catch(() => "") : "";
  }
  await writeFile(path.join(root, "src", "data", "catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
  return catalog.extensions.length;
}

async function syncRelease() {
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  // Releases are pre-releases during the developer preview, which /releases/latest skips.
  const releases = JSON.parse(await fetchText(`https://api.github.com/repos/${appRepository}/releases?per_page=10`, { headers }));
  const release = releases.find((item) => !item.draft);
  if (!release) throw new Error("No published release");
  const dmg = release.assets.find((asset) => asset.name.endsWith(".dmg"));
  const data = { version: release.tag_name.replace(/^v/, ""), date: release.published_at, url: dmg?.browser_download_url ?? release.html_url, notes: release.html_url };
  await writeFile(path.join(root, "src", "data", "release.json"), JSON.stringify(data, null, 2) + "\n");
  return data.version;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mkdir(path.join(root, "src", "data"), { recursive: true });
  const app = await source();
  console.log(`Docs: ${await syncDocs(app)} pages`);
  console.log(`Store: ${await syncStore(app)} extensions`);
  console.log(`Release: ${await syncRelease()}`);
}
