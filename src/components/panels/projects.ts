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
      "Built and owned the backend services: REST APIs, Redis-backed sessions, OAuth 2.0 authentication, and multi-stage compliance workflows.",
      "Kubernetes CronJob processors sync data from Google Cloud Storage, and Node.js AsyncLocalStorage carries request-scoped context so work stays traceable across the pipeline.",
      "Slack carries operational alerts, Socket.io pushes real-time events, and axios handles service-to-service communication.",
    ],
    stack: ["Node.js", "Redis", "Kubernetes", "OAuth 2.0", "Google Cloud"],
  },
  {
    id: "prefetch-v",
    title: "Prefetch V",
    context: "Final Year Project · NUST SEECS",
    dates: "2025",
    impact:
      "2nd Prize for Best Final Year Project in Electrical Engineering, SEECS Open House 2025.",
    narrative: [
      "A hardware-based cache prefetcher for a RISC-V core, built by a three-person team advised by Dr. Muhammad Imran.",
      "We designed and implemented a 5-stage pipelined RISC-V core in Verilog, integrating a constant-stride instruction pointer classifier prefetcher into the memory stage to reduce memory latency.",
      "Full RTL implementation in Verilog, a SystemVerilog testbench driven through Questa simulations, and a Python-automated test and build flow. The final design was synthesised and implemented on FPGA.",
      "Custom benchmarks showed significant performance improvement over the same core without prefetching.",
    ],
    stack: ["Verilog", "SystemVerilog", "Questa", "Python", "FPGA"],
    image: prefetchTeam,
    imageAlt:
      "The Prefetch V team at their SEECS Open House booth, with the project poster, an FPGA development board, and a memory-latency slide on screen.",
  },
];
