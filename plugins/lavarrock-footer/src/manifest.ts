import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.footer",
  version: "1.0.0",
  name: "Footer Bar",
  author: "Lavarrock",
  description:
    "Application status bar showing readiness, sync state, and peer count",
  icon: "PanelBottom",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Claim the footer render slot ──────────────
    renderSlots: {
      footer: {
        slot: "footer",
        component: () => import("./components/FooterBar"),
        priority: 0,
      },
    },

    // ─── Extension point for status items ──────────
    extensionPoints: {
      statusItem: {
        description: "Add items to the footer status bar",
        schema: z.object({
          id: z.string(),
          side: z.enum(["left", "right"]),
          component: z.function(),
          priority: z.number().default(0),
        }),
      },
    },

    // ─── Settings ──────────────────────────────────
    settings: {
      showSyncStatus: {
        name: "Show Sync Status",
        description: "Display sync/peer information in the footer",
        schema: z.boolean(),
        default: true,
      },
    },

    // ─── State ─────────────────────────────────────
    state: {
      status: {
        default: "Ready",
        sync: false,
      },
      peerCount: {
        default: 0,
        sync: false,
      },
      syncState: {
        default: "idle" as string,
        sync: false,
      },
    },
  },

  // ─── Exports ────────────────────────────────────
  exports: [
    "lavarrock.footer://renderSlot/footer",
    "lavarrock.footer://extensionPoint/statusItem",
    "lavarrock.footer://state/status",
    "lavarrock.footer://state/peerCount",
    "lavarrock.footer://state/syncState",
  ],

  imports: [],

  dependencies: {
    required: ["lavarrock.ui"],
    optional: [],
  },

  loadPriority: 50,

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
