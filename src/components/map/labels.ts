import type { CityId, LngLat } from "./geo";

export interface PlaceLabel {
  name: string;
  city: CityId;
  location: LngLat;
}

export const LABELS: PlaceLabel[] = [
  {
    name: "WALLED CITY",
    city: "lahore",
    location: { lng: 74.3107, lat: 31.582 },
  },
  { name: "GULBERG", city: "lahore", location: { lng: 74.3436, lat: 31.5204 } },
  {
    name: "MODEL TOWN",
    city: "lahore",
    location: { lng: 74.3239, lat: 31.4811 },
  },
  {
    name: "JOHAR TOWN",
    city: "lahore",
    location: { lng: 74.2973, lat: 31.4622 },
  },
  { name: "DHA", city: "lahore", location: { lng: 74.4108, lat: 31.4697 } },
  { name: "NUST", city: "islamabad", location: { lng: 72.9918, lat: 33.6448 } },
  {
    name: "BLUE AREA",
    city: "islamabad",
    location: { lng: 73.0551, lat: 33.7167 },
  },
  {
    name: "FAISAL MOSQUE",
    city: "islamabad",
    location: { lng: 73.0372, lat: 33.7295 },
  },
  {
    name: "SADDAR",
    city: "islamabad",
    location: { lng: 73.0479, lat: 33.5973 },
  },
];
