function appendLink(rel: string, href: string): void {
  if (document.querySelector(`link[rel="${rel}"][href="${href}"]`)) return;

  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  document.head.append(link);
}

function metaContent(name: string): string | null {
  const meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  return meta?.content || null;
}

export function preloadModule(href: string): void {
  appendLink("modulepreload", href);
}

export function loadStyle(href: string): void {
  appendLink("stylesheet", href);
}

export function mapChunkHref(): string | null {
  return metaContent("map-chunk");
}

export function mapStyleHref(): string | null {
  return metaContent("map-style");
}
