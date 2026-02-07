/**
 * Constants aligned with the Plugin Standard v2.
 */

/** Built-in resource types that every plugin can use without a dependency. */
export const BUILT_IN_RESOURCE_TYPES = [
  "commands",
  "hotkeys",
  "settings",
  "state",
  "assets",
  "menus",
  "language",
  "extensionPoints",
  "renderSlots",
  "resourceTypes",
] as const;

/** Plugin-defined resource types from core plugins. */
export const CORE_PLUGIN_RESOURCE_TYPES = {
  panes: "lavarrock.wm",
  components: "lavarrock.ui",
  statusItems: "lavarrock.footer",
  headerActions: "lavarrock.header",
} as const;

/** All resource type keys (built-in + plugin-defined). */
export const ALL_RESOURCE_TYPES = [
  ...BUILT_IN_RESOURCE_TYPES,
  ...Object.keys(CORE_PLUGIN_RESOURCE_TYPES),
] as const;

/** Singular form of resource types for URI scheme. */
export const SINGULAR_FORMS: Record<string, string> = {
  commands: "command",
  hotkeys: "hotkey",
  settings: "setting",
  state: "state",
  assets: "asset",
  menus: "menu",
  language: "language",
  extensionPoints: "extensionPoint",
  renderSlots: "renderSlot",
  resourceTypes: "resourceType",
  panes: "pane",
  components: "component",
  statusItems: "statusItem",
  headerActions: "headerAction",
};

/** Externals that plugins MUST NOT bundle. */
export const REQUIRED_EXTERNALS = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "@lavarrock/plugin-sdk",
  "zod",
] as const;

/** Valid plugin channels. */
export const CHANNELS = ["core", "community", "local"] as const;
export type Channel = (typeof CHANNELS)[number];

/** Minimum SDK version. */
export const SDK_VERSION = "^2.0.0";

/** Files the CLI generates. */
export const GENERATED_FILES = {
  manifest: "src/manifest.ts",
  index: "src/index.tsx",
  viteConfig: "vite.config.ts",
  packageJson: "package.json",
  tsconfig: "tsconfig.json",
  pluginMeta: "dist/plugin-meta.json",
} as const;
