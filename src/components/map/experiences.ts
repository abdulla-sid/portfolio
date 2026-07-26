import type { CityId, LngLat } from "./geo";

export interface Experience {
  id: string;
  title: string;
  org: string;
  dates: string;
  city: CityId;
  location: LngLat;
}

export const EXPERIENCES: Experience[] = [
  {
    id: "carbonteq",
    title: "Software Engineer",
    org: "Carbonteq",
    dates: "2024 — present",
    city: "lahore",

    location: { lng: 74.423, lat: 31.4683 },
  },
  {
    id: "placeholder-role",
    title: "Earlier Role (placeholder)",
    org: "Some Company",
    dates: "2022 — 2024",
    city: "lahore",
    location: { lng: 74.2973, lat: 31.4622 },
  },
  {
    id: "nust",
    title: "BS Computer Science",
    org: "NUST",
    dates: "2018 — 2022",
    city: "islamabad",

    location: { lng: 72.9918, lat: 33.6448 },
  },
];
