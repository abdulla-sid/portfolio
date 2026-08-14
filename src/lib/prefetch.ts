export function preloadModule(href: string): void {
  if (document.querySelector(`link[rel="modulepreload"][href="${href}"]`))
    return;

  const link = document.createElement("link");
  link.rel = "modulepreload";
  link.href = href;
  document.head.append(link);
}

export function mapChunkHref(): string | null {
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="map-chunk"]',
  );
  return meta?.content || null;
}
