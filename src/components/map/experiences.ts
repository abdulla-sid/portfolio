import type { CityId, LngLat } from "./geo";

export interface Experience {
  id: string;
  title: string;
  org: string;
  dates: string;
  narrative: string[];
  city: CityId;
  location: LngLat;
}

export const EXPERIENCES: Experience[] = [
  {
    id: "carbonteq",
    title: "Software Engineer",
    org: "Carbonteq",
    dates: "June 2025 – Present",
    narrative: [
      "Current home base. Carbonteq hired me straight out of uni, gills to lungs, without a line of web development to my name. They threw me into backend and TypeScript with a project to cut my teeth on.",
      "I’ve grown into the shoes they gave me since. Client-facing full-stack now, mostly on First Class Healthcare. Favourite thing about it is the culture. It’s the kind of place that hands you the thing you haven’t done yet and expects you to be fine.",
    ],
    city: "lahore",
    location: { lng: 74.423, lat: 31.4683 },
  },
  {
    id: "chip-design-center",
    title: "Research Assistant",
    org: "Chip Design Center, NUST",
    dates: "June 2024 – September 2024",
    narrative: [
      "Mostly I read research papers. Four months at the Chip Design Center working out what modern out of order cores and their prefetchers actually do, SonicBOOM and RISCY-OOO among them, then designing a memory system of my own to see whether I’d understood any of it.",
      "The rest was the unglamorous half. Prefetch algorithms, benchmarks to measure them, ways to test that the measurements meant anything, and the Verilog to make it real. Sir Imran supervised that summer and the final year project after it, and he’s the reason the hardware stuck. A year later it became Prefetch V, the same problem with a deadline attached.",
    ],
    city: "islamabad",
    location: { lng: 72.9979, lat: 33.6461 },
  },
  {
    id: "nust",
    title: "Bachelor’s in Electrical Engineering",
    org: "National University of Sciences and Technology (NUST)",
    dates: "Nov 2021 – June 2025",
    narrative: [
      "My alma mater, and the best years of my life. Weeks of all nighters and last minute assignments in C2, sneaking out to Islamabad at 1am. I wouldn’t trade any of it.",
      "Four years of getting my hands dirty with low level systems and hardware. What carried over is the habit of caring about whatever sits one layer underneath the thing I’m building. That’s why the fun problems are still the ones where something is slower than it should be.",
    ],
    city: "islamabad",
    location: { lng: 72.9918, lat: 33.6448 },
  },
];
