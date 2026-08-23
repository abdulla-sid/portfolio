import prefetchTeam from "../../assets/prefetch-v-team.jpeg";

export interface Project {
  id: string;
  title: string;
  context: string;
  dates: string;
  impact: string;
  narrative: string[];
  stack: string[];
  image?: string;
  imageAlt?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "first-class-healthcare",
    title: "First Class Healthcare",
    context: "Carbonteq",
    dates: "June 2025 – Present",
    impact: "Used daily by 1,000+ medical staff across 8 counties.",
    narrative: [
      "Healthcare software for county correctional facilities. I’ve been on the backend since September 2025 and full stack since August 2026. What I own is the unglamorous middle: how carts get stocked and balanced, how an infirmary intake gets processed, how a controlled substance count reconciles at the end of a shift.",
      "Controlled substances are the sharp edge. Hand counted, pre allocated, and they can’t ride the automatic reordering everything else uses. Getting it wrong is a regulatory problem rather than a bug, which meant guarding every path that could touch them and writing more test than feature to keep it that way.",
      "The rest is ordinary craft. Bulk imports that used to run a query per row now run one. Counts that disagreed with the list they were counting now agree. None of it is visible from the outside, which is the point.",
    ],
    stack: [
      "Node.js",
      "Express",
      "MySQL",
      "Redis",
      "Socket.IO",
      "OAuth 2.0",
      "Google Cloud",
    ],
  },
  {
    id: "prefetch-v",
    title: "Prefetch V",
    context: "Final Year Project · NUST SEECS",
    dates: "2025",
    impact:
      "Came second for best electrical engineering final year project, SEECS Open House 2025.",
    narrative: [
      "We taught a CPU to guess what it was about to need. Three of us built a five stage pipelined RISC-V core from scratch, then put a prefetcher in its memory stage that watches the address pattern of each instruction and fetches ahead when it spots a constant stride.",
      "Most of the year went on proving it worked. Simulations, a test flow that rebuilt and rechecked the whole design on every change, and finally the real thing running on an FPGA. Faster than a vanilla core on every benchmark.",
    ],
    stack: ["Verilog", "SystemVerilog", "Questa", "Python", "FPGA"],
    image: prefetchTeam,
    imageAlt:
      "The Prefetch V team at their SEECS Open House booth, with the project poster, an FPGA development board, and a memory-latency slide on screen.",
  },
];
