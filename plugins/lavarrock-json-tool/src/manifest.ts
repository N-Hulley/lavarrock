import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.json-tool",
  version: "1.0.0",
  name: "JSON Tool",
  author: "Lavarrock",
  description: "Parse, format, minify, and validate JSON in a WM pane",
  icon: "Braces",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Register a pane with the WM ──────────────
    panes: {
      "json-tool": {
        name: "JSON Tool",
        icon: "Braces",
        component: () => import("./components/JsonToolPane"),
        defaultTile: {
          direction: "vertical",
          ratio: 50,
        },
      },
    },

    // ─── Commands ──────────────────────────────────
    commands: {
      format: {
        name: "Format JSON",
        handler: () => import("./commands/format"),
      },
      minify: {
        name: "Minify JSON",
        handler: () => import("./commands/minify"),
      },
      validate: {
        name: "Validate JSON",
        handler: () => import("./commands/validate"),
      },
    },

    // ─── Settings ──────────────────────────────────
    settings: {
      indentSize: {
        name: "Indent Size",
        description: "Number of spaces used for formatting",
        schema: z.number().min(1).max(8),
        default: 2,
      },
      sortKeys: {
        name: "Sort Keys",
        description: "Alphabetically sort object keys when formatting",
        schema: z.boolean(),
        default: false,
      },
    },

    // ─── State ─────────────────────────────────────
    state: {
      input: {
        default: "" as string,
        sync: false,
      },
      output: {
        default: "" as string,
        sync: false,
      },
      error: {
        default: null as string | null,
        sync: false,
      },
    },
  },

  // ─── Exports ────────────────────────────────────
  exports: [
    "lavarrock.json-tool://pane/json-tool",
    "lavarrock.json-tool://command/format",
    "lavarrock.json-tool://command/minify",
    "lavarrock.json-tool://command/validate",
  ],

  imports: ["lavarrock.wm://resourceType/pane"],

  dependencies: {
    required: ["lavarrock.ui", "lavarrock.wm"],
    optional: [],
  },

  loadPriority: 10,

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
