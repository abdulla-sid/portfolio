import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

export interface MapPalette {
  background: string;
  road: string;
}

function resolveCssToken(
  styles: CSSStyleDeclaration,
  name: string,
  seen = new Set<string>(),
): string {
  if (seen.has(name)) return "";
  seen.add(name);

  const value = styles.getPropertyValue(name).trim();
  const alias = /^var\(\s*(--[^),\s]+)\s*\)$/.exec(value);
  return alias ? resolveCssToken(styles, alias[1], seen) : value;
}

export function readMapPalette(
  root: Element = document.documentElement,
): MapPalette {
  const styles = getComputedStyle(root);
  return {
    background: resolveCssToken(styles, "--map-background"),
    road: resolveCssToken(styles, "--map-road"),
  };
}

const MAJOR = ["motorway", "motorway_link", "trunk", "trunk_link"];
const SECONDARY = ["primary", "primary_link", "secondary", "secondary_link"];

const majorFilter: ExpressionSpecification = [
  "in",
  ["get", "kind_detail"],
  ["literal", MAJOR],
];
const secondaryFilter: ExpressionSpecification = [
  "in",
  ["get", "kind_detail"],
  ["literal", SECONDARY],
];

export function createMapStyle(
  tileUrl: string,
  palette: MapPalette,
): StyleSpecification {
  return {
    version: 8,
    sources: {
      city: { type: "vector", url: tileUrl, attribution: "© OpenStreetMap" },
    },
    layers: [
      {
        id: "bg",
        type: "background",
        paint: { "background-color": palette.background },
      },
      {
        id: "roads-secondary",
        type: "line",
        source: "city",
        "source-layer": "roads",
        filter: secondaryFilter,
        paint: {
          "line-color": palette.road,
          "line-width": ["step", ["zoom"], 1, 12, 1.5, 14, 2.5],
        },
      },
      {
        id: "roads-major",
        type: "line",
        source: "city",
        "source-layer": "roads",
        filter: majorFilter,
        paint: {
          "line-color": palette.road,
          "line-width": ["step", ["zoom"], 1.5, 12, 2.5, 14, 4],
        },
      },
    ],
  };
}
