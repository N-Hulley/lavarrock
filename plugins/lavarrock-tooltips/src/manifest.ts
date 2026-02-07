import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.tooltips",
  version: "1.0.0",
  name: "Tooltips",
  author: "Lavarrock",
  description: "Global tooltip provider wrapping the application shell",
  icon: "MessageSquare",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Render slot: wraps the entire app shell ──
    renderSlots: {
      wrapper: {
        slot: "wrapper",
        component: () => import("./components/TooltipWrapper"),
        priority: 10, // wrap early so all children have tooltips
      },
    },

    // ─── Settings ─────────────────────────────────
    settings: {
      delayDuration: {
        name: "Delay Duration",
        description: "Milliseconds before a tooltip appears",
        schema: z.number().min(0).max(2000),
        default: 300,
      },
      skipDelayDuration: {
        name: "Skip Delay Duration",
        description: "Milliseconds to skip delay when moving between triggers",
        schema: z.number().min(0).max(1000),
        default: 100,
      },
    },
  },

  // ─── Exports ────────────────────────────────────
  exports: ["lavarrock.tooltips://renderSlot/wrapper"],

  imports: [],

  dependencies: {
    required: [
      "lavarrock.ui", // uses TooltipProvider from UI kit
    ],
    optional: [],
  },

  loadPriority: 200, // load very early — everything needs tooltips

  // ─── Lifecycle ──────────────────────────────────
  lifecycle: {
    activate: async (ctx) => {
      const mod = await import("./activate");
      return mod.activate(ctx);
    },
    deactivate: async (ctx) => {
      const mod = await import("./activate");
      return mod.deactivate(ctx);
    },
  },
});
