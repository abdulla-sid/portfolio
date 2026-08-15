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
      "Built and owned backend services for a production healthcare platform used daily by 1,000+ medical staff across 8 counties, including REST APIs, Redis-backed sessions, OAuth 2.0 authentication, multi-stage compliance workflows, and Kubernetes CronJob processors for syncing data from Google Cloud Storage.",
      "Integrated Slack for operational alerts, Socket.io for real-time events, axios for service communication, and Node.js AsyncLocalStorage for request-scoped context tracking.",
      "Designed a self-reviewing multi-agent AI development harness, suited to long-horizon multi-session workflows, that encodes the team’s engineering conventions into a 14-point automated quality gate, using a plan→implement→review pipeline wired to Jira/GitHub MCPs and shifting convention compliance from reviewer memory to an enforced workflow.",
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
      "Researched and documented state-of-the-art open-source OOO RISC-V cores, including SonicBOOM and RISCY-OOO.",
      "Analyzed memory system structures and performed efficiency analysis of prefetching-replacement strategies for data-intensive workloads.",
    ],
    city: "islamabad",
    location: { lng: 72.9979, lat: 33.6461 },
  },
  {
    id: "nust",
    title: "Bachelor’s in Electrical Engineering",
    org: "National University of Sciences and Technology (NUST)",
    dates: "Nov 2021 – June 2025",
    narrative: ["Bachelor’s in Electrical Engineering."],
    city: "islamabad",
    location: { lng: 72.9918, lat: 33.6448 },
  },
];
