import { LucideIcon } from "lucide-react";
import { ComponentType } from "react";

/**
 * Localized strings for multi-language support.
 * Key is locale code (e.g., "en", "es", "fr").
 */
export type LocalizedStrings = Record<string, string>;

export type DockSide = "left" | "main" | "right" | "bottom";
export type PaneKind = "content" | "extension";
export type PluginComponentType = "react" | "builtin";

// ─── Pane manifest ────────────────────────────────
/**
 * Manifest describing a plugin/pane that can be registered
 * with the PluginManager and rendered inside the tiling WM.
 */
export interface PaneManifest {
  id: string;
  version: string;
  name: string;
  displayName?: LocalizedStrings;
  author: string;
  description: string;
  localizedDescription?: LocalizedStrings;
  supportedLocales?: string[];
  icon: string;
  kind: PaneKind;
  defaultDock: DockSide;
  component: {
    type: PluginComponentType;
    source: string;
  };
  permissions?: string[];
  styles?: string;
  hooks?: {
    onActivate?: string;
    onDeactivate?: string;
    onSettings?: string;
  };
  isCore?: boolean;
  state?: {
    namespace?: string;
    exports?: string[];
    allowRead?: string[];
    allowWrite?: string[];
  };
  config?: Record<string, unknown>;
  useShadowDOM?: boolean;
}

// ─── Runtime plugin ───────────────────────────────
/**
 * Internal runtime representation of a loaded plugin.
 */
export interface Plugin extends PaneManifest {
  Component?: ComponentType<PluginComponentProps>;
  IconComponent?: LucideIcon;
  loadState: "pending" | "loading" | "loaded" | "error";
  errorMessage?: string;
  installedAt: number;
}

// ─── Props & API ──────────────────────────────────
export interface PluginComponentProps {
  pluginId: string;
  isActive: boolean;
  dock: DockSide;
  config?: Record<string, unknown>;
  api?: PluginAPI;
}

export interface PluginAPI {
  openPane: (paneId: string) => void;
  closePane: (paneId?: string) => void;
  getConfig: () => Record<string, unknown>;
  setConfig: (config: Record<string, unknown>) => void;
  notify: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;
  state: {
    get: (key: string, namespace?: string) => unknown;
    set: (key: string, value: unknown, namespace?: string) => void;
    getNamespace: (namespace?: string) => Record<string, unknown>;
    setNamespace: (values: Record<string, unknown>, namespace?: string) => void;
    replaceNamespace: (
      values: Record<string, unknown>,
      namespace?: string,
    ) => void;
    clearNamespace: (namespace?: string) => void;
  };
  getEditorContext?: () => unknown;
}

// ─── Registry ─────────────────────────────────────
export interface PluginRegistry {
  plugins: Record<string, PaneManifest>;
  version: string;
}
