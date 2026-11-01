export function resolvePath(from: string, href: string): string {
  const clean = href.split("#")[0].split("?")[0];
  const out = clean.startsWith("/") ? [] : from.split("/").slice(0, -1);

  for (const seg of clean.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") out.pop();
    else out.push(seg);
  }
  return out.join("/");
}

const NAV_SCRIPT = `<script>
(function () {
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("a") : null;
    if (!a) return;
    var h = a.getAttribute("href");
    if (!h || h.charAt(0) === "#") return;
    e.preventDefault();
    if (/^(https?:|mailto:|tel:|javascript:)/i.test(h)) return;
    parent.postMessage({ type: "telos-nav", href: h }, "*");
  });
  document.addEventListener("submit", function (e) { e.preventDefault(); });
})();
</script>`;

export function buildPreviewHtml(
  files: Record<string, string>,
  current: string
): string {
  const html = files[current];
  if (html === undefined || !current.endsWith(".html")) {
    return "<p style='font-family:system-ui;padding:24px'>Select an HTML page to preview it.</p>";
  }

  let doc = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/rel=["']?stylesheet/i.test(tag)) return tag;
    const match = tag.match(/href=["']([^"']+)["']/i);
    if (!match) return tag;
    const css = files[resolvePath(current, match[1])];
    return css !== undefined ? `<style>${css}</style>` : tag;
  });

  doc = doc.replace(
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/gi,
    (tag, src: string) => {
      const js = files[resolvePath(current, src)];
      return js !== undefined
        ? `<script>${js.replace(/<\/script/gi, "<\\/script")}</script>`
        : tag;
    }
  );

  return /<\/body>/i.test(doc)
    ? doc.replace(/<\/body>/i, () => NAV_SCRIPT + "</body>")
    : doc + NAV_SCRIPT;
}