/**
 * Type declarations for @lavarrock/plugin-footer
 *
 * Provides the footer status bar render slot and an extension
 * point for other plugins to contribute status items.
 */
import type { PluginTypeExports } from "@lavarrock/plugin-sdk";

export interface FooterBarProps {
  status?: string;
  syncState?: string;
  peerCount?: number;
}

// ─── Plugin registry augmentation ─────────────────
declare module "@lavarrock/plugin-sdk" {
  interface PluginRegistry {
    "lavarrock.footer": PluginTypeExports<{
      renderSlots: {
        footer: typeof import("./components/FooterBar").default;
      };
      state: {
        status: string;
        peerCount: number;
        syncState: string;
      };
      extensionPoints: {
        statusItem: {
          id: string;
          side: "left" | "right";
          component: () => JSX.Element;
          priority: number;
        };
      };
    }>;
  }
}
