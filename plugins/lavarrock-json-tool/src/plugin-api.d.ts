/**
 * Type declarations for @lavarrock/plugin-json-tool
 *
 * A utility pane that parses, formats, minifies, and validates JSON.
 * Registers a pane resource with lavarrock.wm so it appears in the
 * pane launcher (⌘P).
 */
import type { PluginTypeExports } from "@lavarrock/plugin-sdk";

export interface JsonToolPaneProps {
  pluginId?: string;
  isActive?: boolean;
}

// ─── Plugin registry augmentation ─────────────────
declare module "@lavarrock/plugin-sdk" {
  interface PluginRegistry {
    "lavarrock.json-tool": PluginTypeExports<{
      panes: {
        "json-tool": typeof import("./components/JsonToolPane").default;
      };
      commands: {
        format: void;
        minify: void;
        validate: void;
      };
      state: {
        input: string;
        output: string;
        error: string | null;
      };
    }>;
  }
}
