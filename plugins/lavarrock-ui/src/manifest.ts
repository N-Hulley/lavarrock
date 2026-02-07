import { definePlugin } from "@lavarrock/plugin-sdk";
import { z } from "zod";

export default definePlugin({
  // ─── Identity ───────────────────────────────────
  id: "lavarrock.ui",
  version: "1.0.0",
  name: "UI Components",
  author: "Lavarrock",
  description:
    "shadcn/ui-based component library — every component is a resource",
  icon: "Component",

  // ─── Resources ──────────────────────────────────
  resources: {
    // ─── Define the "component" resource type ─────
    resourceTypes: {
      component: {
        description:
          "A reusable React UI component accessible via namespace-as-component",
        schema: z.object({
          name: z.string(),
          component: z.function(),
          description: z.string().optional(),
          category: z
            .enum([
              "layout",
              "input",
              "display",
              "feedback",
              "overlay",
              "navigation",
            ])
            .optional(),
        }),
      },
    },

    // ─── Every component is a resource ────────────
    components: {
      // Layout
      Card: {
        name: "Card",
        component: () => import("./resources/components/Card"),
        category: "layout",
      },
      CardHeader: {
        name: "CardHeader",
        component: () => import("./resources/components/CardHeader"),
        category: "layout",
      },
      CardTitle: {
        name: "CardTitle",
        component: () => import("./resources/components/CardTitle"),
        category: "layout",
      },
      CardDescription: {
        name: "CardDescription",
        component: () => import("./resources/components/CardDescription"),
        category: "layout",
      },
      CardContent: {
        name: "CardContent",
        component: () => import("./resources/components/CardContent"),
        category: "layout",
      },
      CardFooter: {
        name: "CardFooter",
        component: () => import("./resources/components/CardFooter"),
        category: "layout",
      },
      Separator: {
        name: "Separator",
        component: () => import("./resources/components/Separator"),
        category: "layout",
      },
      Tabs: {
        name: "Tabs",
        component: () => import("./resources/components/Tabs"),
        category: "layout",
      },
      TabsList: {
        name: "TabsList",
        component: () => import("./resources/components/TabsList"),
        category: "layout",
      },
      TabsTrigger: {
        name: "TabsTrigger",
        component: () => import("./resources/components/TabsTrigger"),
        category: "layout",
      },
      TabsContent: {
        name: "TabsContent",
        component: () => import("./resources/components/TabsContent"),
        category: "layout",
      },

      // Input
      Button: {
        name: "Button",
        component: () => import("./resources/components/Button"),
        category: "input",
      },
      Input: {
        name: "Input",
        component: () => import("./resources/components/Input"),
        category: "input",
      },
      Textarea: {
        name: "Textarea",
        component: () => import("./resources/components/Textarea"),
        category: "input",
      },
      Select: {
        name: "Select",
        component: () => import("./resources/components/Select"),
        category: "input",
      },
      Label: {
        name: "Label",
        component: () => import("./resources/components/Label"),
        category: "input",
      },

      // Display
      Badge: {
        name: "Badge",
        component: () => import("./resources/components/Badge"),
        category: "display",
      },
      Tooltip: {
        name: "Tooltip",
        component: () => import("./resources/components/Tooltip"),
        category: "display",
      },
      TooltipTrigger: {
        name: "TooltipTrigger",
        component: () => import("./resources/components/TooltipTrigger"),
        category: "display",
      },
      TooltipContent: {
        name: "TooltipContent",
        component: () => import("./resources/components/TooltipContent"),
        category: "display",
      },
      TooltipProvider: {
        name: "TooltipProvider",
        component: () => import("./resources/components/TooltipProvider"),
        category: "display",
      },

      // Overlay
      Dialog: {
        name: "Dialog",
        component: () => import("./resources/components/Dialog"),
        category: "overlay",
      },
      DialogTrigger: {
        name: "DialogTrigger",
        component: () => import("./resources/components/DialogTrigger"),
        category: "overlay",
      },
      DialogContent: {
        name: "DialogContent",
        component: () => import("./resources/components/DialogContent"),
        category: "overlay",
      },
      DialogHeader: {
        name: "DialogHeader",
        component: () => import("./resources/components/DialogHeader"),
        category: "overlay",
      },
      DialogFooter: {
        name: "DialogFooter",
        component: () => import("./resources/components/DialogFooter"),
        category: "overlay",
      },
      DialogTitle: {
        name: "DialogTitle",
        component: () => import("./resources/components/DialogTitle"),
        category: "overlay",
      },
      DialogDescription: {
        name: "DialogDescription",
        component: () => import("./resources/components/DialogDescription"),
        category: "overlay",
      },
      DialogClose: {
        name: "DialogClose",
        component: () => import("./resources/components/DialogClose"),
        category: "overlay",
      },
      Drawer: {
        name: "Drawer",
        component: () => import("./resources/components/Drawer"),
        category: "overlay",
      },
      DrawerTrigger: {
        name: "DrawerTrigger",
        component: () => import("./resources/components/DrawerTrigger"),
        category: "overlay",
      },
      DrawerContent: {
        name: "DrawerContent",
        component: () => import("./resources/components/DrawerContent"),
        category: "overlay",
      },
      DrawerTitle: {
        name: "DrawerTitle",
        component: () => import("./resources/components/DrawerTitle"),
        category: "overlay",
      },
      DrawerClose: {
        name: "DrawerClose",
        component: () => import("./resources/components/DrawerClose"),
        category: "overlay",
      },
      DropdownMenu: {
        name: "DropdownMenu",
        component: () => import("./resources/components/DropdownMenu"),
        category: "overlay",
      },
      DropdownMenuTrigger: {
        name: "DropdownMenuTrigger",
        component: () => import("./resources/components/DropdownMenuTrigger"),
        category: "overlay",
      },
      DropdownMenuContent: {
        name: "DropdownMenuContent",
        component: () => import("./resources/components/DropdownMenuContent"),
        category: "overlay",
      },
      DropdownMenuItem: {
        name: "DropdownMenuItem",
        component: () => import("./resources/components/DropdownMenuItem"),
        category: "overlay",
      },
    },

    // ─── Theme settings ───────────────────────────
    settings: {
      radius: {
        name: "Border Radius",
        description: "Base border radius for UI components",
        schema: z.number().min(0).max(20),
        default: 6,
      },
      scale: {
        name: "UI Scale",
        description: "Global scale factor for component sizing",
        schema: z.enum(["compact", "default", "comfortable"]),
        default: "default",
      },
    },

    // ─── Extension points ─────────────────────────
    extensionPoints: {
      customComponent: {
        description:
          "Register additional components into the lavarrock.ui namespace",
        schema: z.object({
          name: z.string(),
          component: z.function(),
          category: z.string().optional(),
        }),
      },
    },
  },

  modifications: [],

  // ─── Exports ────────────────────────────────────
  exports: [
    "lavarrock.ui://resourceType/component",
    "lavarrock.ui://component/*",
    "lavarrock.ui://setting/radius",
    "lavarrock.ui://setting/scale",
    "lavarrock.ui://extensionPoint/customComponent",
  ],

  // ─── Imports ────────────────────────────────────
  imports: [],

  // ─── Dependencies ──────────────────────────────
  dependencies: {
    required: [],
    optional: [],
  },

  loadPriority: 110, // load before everything — other plugins need components

  // ─── Lifecycle ──────────────────────────────────
  lifecycle: {
    activate: async (ctx) => {
      const mod = await import("./activate");
      return mod.activate(ctx);
    },
  },
});
