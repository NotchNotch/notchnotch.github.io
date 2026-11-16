// One highlight per group that slides between items: it follows the pointer
// and rests on the current item (aria-current, aria-selected, aria-pressed or
// .active). <ul data-blob="a"> means "the a elements inside are the items".
// Groups update themselves when the current item changes, so a persisted
// sidebar slides to the new page instead of jumping.

const current = '[aria-current="page"], [aria-current="true"], [aria-selected="true"], [aria-pressed="true"], .active';
const bound = new WeakSet<HTMLElement>();

function place(group: HTMLElement, target: Element | null) {
  const blob = group.querySelector<HTMLElement>(":scope > .blob")!;
  if (!target || !(target as HTMLElement).offsetParent) { blob.style.setProperty("--bo", "0"); return; }
  const outer = group.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  // Measured while an ancestor is scaled (a panel opening at 0.97), rects
  // shrink with it; divide it out so the blob fits once the scale ends.
  const scale = group.offsetWidth ? outer.width / group.offsetWidth : 1;
  const first = blob.style.getPropertyValue("--bo") !== "1";
  // Appearing from nothing: jump into place, then let later moves slide.
  if (first) group.classList.add("blob-instant");
  blob.style.setProperty("--bx", `${(rect.left - outer.left) / scale + group.scrollLeft}px`);
  blob.style.setProperty("--by", `${(rect.top - outer.top) / scale + group.scrollTop}px`);
  blob.style.setProperty("--bw", `${rect.width / scale}px`);
  blob.style.setProperty("--bh", `${rect.height / scale}px`);
  blob.style.setProperty("--bo", "1");
  if (first) requestAnimationFrame(() => requestAnimationFrame(() => group.classList.remove("blob-instant")));
}

function setup(group: HTMLElement) {
  if (bound.has(group)) { rest(group); return; }
  bound.add(group);
  const blob = document.createElement("span");
  blob.className = "blob";
  blob.setAttribute("aria-hidden", "true");
  group.prepend(blob);
  const items = () => [...group.querySelectorAll<HTMLElement>(group.dataset.blob || ":scope > *:not(.blob)")];
  const follows = group.dataset.blobFollow !== "false";
  let hovering: Element | null = null;

  if (follows) {
    group.addEventListener("pointerover", (event) => {
      const item = items().find((el) => el.contains(event.target as Node));
      if (item && item !== hovering) { hovering = item; place(group, item); }
    });
    group.addEventListener("pointerleave", () => { hovering = null; rest(group); });
  }
  new MutationObserver(() => { if (!hovering) rest(group); })
    .observe(group, { subtree: true, childList: true, attributes: true, attributeFilter:["aria-current", "aria-selected", "aria-pressed", "class", "hidden"] });
  new ResizeObserver(() => rest(group)).observe(group);
  rest(group);
}

function rest(group: HTMLElement) {
  const items = [...group.querySelectorAll<HTMLElement>(group.dataset.blob || ":scope > *:not(.blob)")];
  place(group, items.find((item) => item.matches(current) || item.querySelector(current)) ?? null);
}

export function blobs(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>("[data-blob]").forEach(setup);
}
