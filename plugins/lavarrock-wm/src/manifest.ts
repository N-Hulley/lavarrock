import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.wm",
  version: "1.0.0",
  name: "Tiling Window Manager",
  author: "Lavarrock",
  description: "Hyprland-style binary-tree tiling window manager",
  icon: "LayoutGrid",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Define the "pane" resource type ──────────
    resourceTypes: {
      pane: {
        description: "A React component displayed in the tiling layout",
        schema: z.object({
          name: z.string(),
          icon: z.string().optional(),
          component: z.function(),
          defaultTile: z
            .object({
              direction: z.enum(["horizontal", "vertical"]),
              ratio: z.number().min(1).max(99),
            })
            .optional(),
          toolbar: z.record(z.any()).optional(),
          contextMenu: z.record(z.any()).optional(),
        }),
        renderer: () => import("./renderers/PaneRenderer"),
        onRegister: (pluginId: string, name: string, _value: unknown) => {
          console.log(`[WM] Pane registered: ${pluginId}://pane/${name}`);
        },
      },
    },

    // ─── Claim the content slot ────────────────────
    renderSlots: {
      content: {
        slot: "content",
        component: () => import("./components/TilingShell"),
        priority: 0,
      },
    },

    // ─── Commands ──────────────────────────────────
    commands: {
      splitHorizontal: {
        name: "Split Horizontal",
        handler: () => import("./commands/splitHorizontal"),
      },
      splitVertical: {
        name: "Split Vertical",
        handler: () => import("./commands/splitVertical"),
      },
      closePane: {
        name: "Close Pane",
        handler: () => import("./commands/closePane"),
      },
      focusNext: {
        name: "Focus Next Pane",
        handler: () => import("./commands/focusNext"),
      },
      focusPrevious: {
        name: "Focus Previous Pane",
        handler: () => import("./commands/focusPrevious"),
      },
      openLauncher: {
        name: "Open Pane Launcher",
        handler: () => import("./commands/openLauncher"),
      },
    },

    // ─── Hotkeys ───────────────────────────────────
    hotkeys: {
      splitHorizontal: {
        name: "Split Horizontal",
        keys: "mod+\\",
        command: "lavarrock.wm://command/splitHorizontal",
      },
      splitVertical: {
        name: "Split Vertical",
        keys: "mod+shift+\\",
        command: "lavarrock.wm://command/splitVertical",
      },
      closePane: {
        name: "Close Pane",
        keys: "mod+w",
        command: "lavarrock.wm://command/closePane",
      },
      focusNext: {
        name: "Focus Next",
        keys: "mod+]",
        command: "lavarrock.wm://command/focusNext",
      },
      focusPrevious: {
        name: "Focus Previous",
        keys: "mod+[",
        command: "lavarrock.wm://command/focusPrevious",
      },
      openLauncher: {
        name: "Open Launcher",
        keys: "mod+p",
        command: "lavarrock.wm://command/openLauncher",
      },
    },

    // ─── Settings ──────────────────────────────────
    settings: {
      gapSize: {
        name: "Gap Size",
        description: "Pixel gap between tiled panes",
        schema: z.number().min(0).max(32),
        default: 4,
      },
      animationDuration: {
        name: "Animation Duration",
        description: "Transition duration in ms (0 to disable)",
        schema: z.number().min(0).max(1000),
        default: 150,
      },
    },

    // ─── State ─────────────────────────────────────
    state: {
      layout: {
        default: null as any, // TilingNode tree
        sync: true,
      },
      activePane: {
        default: null as string | null,
      },
    },

    // ─── Extension points ──────────────────────────
    extensionPoints: {
      paneDecorator: {
        description:
          "Wrap or decorate pane windows (e.g. add borders, indicators)",
        schema: z.object({
          wrapper: z.function(),
          priority: z.number().default(0),
        }),
      },
      launcherItem: {
        description: "Add custom items to the pane launcher (⌘P)",
        schema: z.object({
          name: z.string(),
          icon: z.string().optional(),
          command: z.string(),
          when: z.string().optional(),
        }),
      },
    },
  },

  // ─── Exports ────────────────────────────────────
  exports: [
    "lavarrock.wm://resourceType/pane",
    "lavarrock.wm://state/layout",
    "lavarrock.wm://state/activePane",
    "lavarrock.wm://command/splitHorizontal",
    "lavarrock.wm://command/splitVertical",
    "lavarrock.wm://command/closePane",
    "lavarrock.wm://command/openLauncher",
    "lavarrock.wm://extensionPoint/paneDecorator",
    "lavarrock.wm://extensionPoint/launcherItem",
  ],

  imports: [],

  dependencies: {
    required: [
      "lavarrock.ui", // uses UI components via namespace
    ],
    optional: [],
  },

  loadPriority: 100, // load early — other plugins need the "pane" type

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
