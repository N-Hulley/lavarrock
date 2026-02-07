import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.header",
  version: "1.0.0",
  name: "Header Bar",
  author: "Lavarrock",
  description:
    "Application header with layout controls, search, and settings menu",
  icon: "PanelTop",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Claim the header render slot ──────────────
    renderSlots: {
      header: {
        slot: "header",
        component: () => import("./components/HeaderBar"),
        priority: 0,
      },
    },

    // ─── Commands ──────────────────────────────────
    commands: {
      openLauncher: {
        name: "Open Pane Launcher",
        handler: () => import("./commands/openLauncher"),
      },
      resetLayout: {
        name: "Reset Layout",
        handler: () => import("./commands/resetLayout"),
      },
    },

    // ─── Hotkeys ───────────────────────────────────
    hotkeys: {
      openLauncher: {
        name: "Open Pane Launcher",
        keys: "mod+p",
        command: "lavarrock.header://command/openLauncher",
      },
    },

    // ─── Settings ──────────────────────────────────
    settings: {
      showSearch: {
        name: "Show Search",
        description: "Display the search input in the header",
        schema: z.boolean(),
        default: true,
      },
    },
  },

  // ─── Exports ────────────────────────────────────
  exports: [
    "lavarrock.header://renderSlot/header",
    "lavarrock.header://command/openLauncher",
    "lavarrock.header://command/resetLayout",
  ],

  imports: [
    "lavarrock.wm://command/openLauncher",
    "lavarrock.wm://state/layout",
  ],

  dependencies: {
    required: ["lavarrock.ui", "lavarrock.wm"],
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
