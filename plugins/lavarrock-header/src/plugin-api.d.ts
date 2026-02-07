/**
 * Type declarations for @lavarrock/plugin-header
 *
 * Provides the header bar render slot with layout controls,
 * search, and settings dropdown.
 */
import type { PluginTypeExports } from "@lavarrock/plugin-sdk";

export interface HeaderBarProps {
  t?: (key: string) => string;
}

// ─── Plugin registry augmentation ─────────────────
declare module "@lavarrock/plugin-sdk" {
  interface PluginRegistry {
    "lavarrock.header": PluginTypeExports<{
      commands: {
        openLauncher: void;
        resetLayout: void;
      };
      renderSlots: {
        header: typeof import("./components/HeaderBar").default;
      };
    }>;
  }
}
