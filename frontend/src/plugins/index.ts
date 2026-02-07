// ─── Plugin system barrel ─────────────────────────
// Re-exports the slim v2 runtime used by the host app.

export { pluginManager } from "./PluginManager";

export type {
  PaneManifest,
  Plugin,
  PluginAPI,
  PluginComponentProps,
  DockSide,
  PaneKind,
  PluginRegistry,
} from "./types";

export { validatePaneManifest, PaneManifestSchema } from "./manifestValidator";
export type {
  ValidatedPaneManifest,
  ValidationResult,
} from "./manifestValidator";
