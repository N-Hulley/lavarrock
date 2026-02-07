/**
 * Type declarations for @lavarrock/plugin-wm
 *
 * When installed as a devDependency, this augments the global PluginRegistry
 * so TypeScript knows about the WM's exported state, commands, and
 * extension points via the namespace-as-component system (§2.6).
 */
import type { PluginTypeExports } from "@lavarrock/plugin-sdk";
import type { ComponentType, ReactNode } from "react";

// ─── Tiling tree types ────────────────────────────

export type SplitDirection = "horizontal" | "vertical";

export interface TilingLeaf {
  type: "leaf";
  id: string;
  pluginId: string;
}

export interface TilingSplit {
  type: "split";
  id: string;
  direction: SplitDirection;
  ratio: number;
  children: [TilingNode, TilingNode];
}

export type TilingNode = TilingLeaf | TilingSplit;

// ─── Pane resource schema ─────────────────────────

export interface PaneResource {
  name: string;
  icon?: string;
  component: ComponentType<any>;
  defaultTile?: {
    direction: SplitDirection;
    ratio: number;
  };
  toolbar?: Record<string, any>;
  contextMenu?: Record<string, any>;
}

// ─── Extension point schemas ──────────────────────

export interface PaneDecorator {
  wrapper: ComponentType<{ children: ReactNode }>;
  priority: number;
}

export interface LauncherItem {
  name: string;
  icon?: string;
  command: string;
  when?: string;
}

// ─── Plugin type exports ──────────────────────────

export interface LavarrockWMPlugin extends PluginTypeExports {
  id: "lavarrock.wm";

  /** The "pane" resource type that other plugins register against */
  resourceTypes: {
    pane: PaneResource;
  };

  /** Exported state */
  state: {
    layout: TilingNode | null;
    activePane: string | null;
  };

  /** WM commands */
  commands: {
    splitHorizontal: () => void;
    splitVertical: () => void;
    closePane: () => void;
    focusNext: () => void;
    focusPrevious: () => void;
    openLauncher: () => void;
  };

  /** Extension points other plugins can contribute to */
  extensionPoints: {
    paneDecorator: PaneDecorator;
    launcherItem: LauncherItem;
  };

  /** Settings */
  settings: {
    gapSize: number;
    animationDuration: number;
  };
}

// ─── Global registry augmentation ─────────────────

declare module "@lavarrock/plugin-sdk" {
  interface PluginRegistry {
    "lavarrock.wm": LavarrockWMPlugin;
  }
}
