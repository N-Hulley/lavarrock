/**
 * Type declarations for @lavarrock/plugin-ui
 *
 * When installed as a devDependency, this augments the global PluginRegistry
 * so TypeScript knows that `lavarrock.ui.Button` is a valid JSX element
 * with the correct props via the namespace-as-component system (§2.6).
 */
import type { PluginTypeExports } from "@lavarrock/plugin-sdk";
import type { BadgeProps } from "./resources/components/Badge";
import type { ButtonProps } from "./resources/components/Button";
import type React from "react";

// ─── Component prop types ─────────────────────────
// For compound components, we use the base React types since sub-components
// are re-exported from their parent modules.

export interface LavarrockUIPlugin extends PluginTypeExports {
  id: "lavarrock.ui";

  components: {
    // Layout
    Card: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    CardTitle: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    CardDescription: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    Separator: React.FC<
      React.ComponentPropsWithoutRef<"div"> & {
        orientation?: "horizontal" | "vertical";
        decorative?: boolean;
      }
    >;
    Tabs: React.FC<React.ComponentPropsWithoutRef<"div">>;
    TabsList: React.FC<React.ComponentPropsWithoutRef<"div">>;
    TabsTrigger: React.FC<
      React.ComponentPropsWithoutRef<"button"> & { value: string }
    >;
    TabsContent: React.FC<
      React.ComponentPropsWithoutRef<"div"> & { value: string }
    >;

    // Input
    Button: React.FC<ButtonProps>;
    Input: React.FC<React.ComponentProps<"input">>;
    Textarea: React.FC<React.ComponentProps<"textarea">>;
    Select: React.FC<React.ComponentPropsWithoutRef<"div">>;
    Label: React.FC<React.ComponentPropsWithoutRef<"label">>;

    // Display
    Badge: React.FC<BadgeProps>;
    Tooltip: React.FC<React.ComponentPropsWithoutRef<"div">>;
    TooltipTrigger: React.FC<React.ComponentPropsWithoutRef<"button">>;
    TooltipContent: React.FC<React.ComponentPropsWithoutRef<"div">>;
    TooltipProvider: React.FC<{ children: React.ReactNode }>;

    // Overlay
    Dialog: React.FC<React.ComponentPropsWithoutRef<"div">>;
    DialogTrigger: React.FC<React.ComponentPropsWithoutRef<"button">>;
    DialogContent: React.FC<React.ComponentPropsWithoutRef<"div">>;
    DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    DialogFooter: React.FC<React.HTMLAttributes<HTMLDivElement>>;
    DialogTitle: React.FC<React.ComponentPropsWithoutRef<"h2">>;
    DialogDescription: React.FC<React.ComponentPropsWithoutRef<"p">>;
    DialogClose: React.FC<React.ComponentPropsWithoutRef<"button">>;
    Drawer: React.FC<
      React.ComponentPropsWithoutRef<"div"> & {
        direction?: "top" | "bottom" | "left" | "right";
      }
    >;
    DrawerTrigger: React.FC<React.ComponentPropsWithoutRef<"button">>;
    DrawerContent: React.FC<
      React.ComponentPropsWithoutRef<"div"> & {
        side?: "top" | "bottom" | "left" | "right";
      }
    >;
    DrawerTitle: React.FC<React.ComponentPropsWithoutRef<"h2">>;
    DrawerClose: React.FC<React.ComponentPropsWithoutRef<"button">>;
    DropdownMenu: React.FC<React.ComponentPropsWithoutRef<"div">>;
    DropdownMenuTrigger: React.FC<React.ComponentPropsWithoutRef<"button">>;
    DropdownMenuContent: React.FC<React.ComponentPropsWithoutRef<"div">>;
    DropdownMenuItem: React.FC<
      React.ComponentPropsWithoutRef<"div"> & { inset?: boolean }
    >;
  };

  extensionPoints: {
    customComponent: {
      name: string;
      component: React.ComponentType;
      category?: string;
    };
  };

  settings: {
    radius: number;
    scale: "compact" | "default" | "comfortable";
  };

  state: Record<string, never>;

  uris:
    | "lavarrock.ui://resourceType/component"
    | `lavarrock.ui://component/${string}`
    | "lavarrock.ui://setting/radius"
    | "lavarrock.ui://setting/scale"
    | "lavarrock.ui://extensionPoint/customComponent";
}

declare module "@lavarrock/plugin-sdk" {
  interface PluginRegistry {
    "lavarrock.ui": LavarrockUIPlugin;
  }
}
