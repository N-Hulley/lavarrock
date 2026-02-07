/**
 * PluginLoader.ts
 *
 * Dynamically loads plugins from the registry service at runtime.
 *
 * Flow:
 *  1. Fetch user config from backend  → GET /api/config
 *  2. Fetch available plugins from registry → GET <registryUrl>/api/plugins
 *  3. Filter to enabled plugins
 *  4. Topologically sort by dependency + priority
 *  5. Load each bundle via <script> injection
 *  6. After each shared plugin loads, publish its exports as a global
 *     so subsequent plugins can reference them.
 */

// ── Types ─────────────────────────────────────────

export interface PluginConfigEntry {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
}

export interface PluginConfig {
  plugins: PluginConfigEntry[];
}

export interface RegistryPluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  type: "shared" | "wrapper" | "ui" | "pane";
  priority: number;
  depends: string[];
  bundle: string;
  css?: string;
  componentCss?: string;
  renderSlot?: "header" | "footer" | "wrapper";
  component?: string;
  paneId?: string;
  paneManifest?: {
    name: string;
    icon: string;
    kind: string;
    defaultDock: string;
  };
}

export interface RegistryManifest {
  plugins: RegistryPluginManifest[];
  globalCss?: string;
}

export interface LoadedPlugin {
  manifest: RegistryPluginManifest;
  exports: Record<string, unknown>;
  settings: Record<string, unknown>;
}

// ── Globals ───────────────────────────────────────

// These are the well-known globals that plugin IIFE bundles read from.
// We set React/ReactDOM in main.tsx before anything loads.
// Shared plugins (ui, wm) register their exports here after loading.
declare global {
  interface Window {
    __LAVARROCK_UI: Record<string, unknown>;
    __LAVARROCK_WM: Record<string, unknown>;
    __LAVARROCK_TOOLTIPS: Record<string, unknown>;
    __LAVARROCK_HEADER: Record<string, unknown>;
    __LAVARROCK_FOOTER: Record<string, unknown>;
    __LAVARROCK_SEARCH_MODAL: Record<string, unknown>;
    __LAVARROCK_APP_MODAL: Record<string, unknown>;
    __LAVARROCK_SEARCH_BAR: Record<string, unknown>;
    __LAVARROCK_APP_LAUNCHER: Record<string, unknown>;
    __LAVARROCK_JSON_TOOL: Record<string, unknown>;
    __LAVARROCK_THEME_MANAGER: Record<string, unknown>;
    __LAVARROCK_THEME_ENGINE: Record<string, unknown>;
    __LAVARROCK_THEME_IMPORT: Record<string, unknown>;
    __LAVARROCK_LAYOUT_MANAGER: Record<string, unknown>;
    __LAVARROCK_LAYOUT_ENGINE: Record<string, unknown>;
    __LAVARROCK_FORM_ENGINE: Record<string, unknown>;
    __LAVARROCK_FORM_MANAGER: Record<string, unknown>;
    __LAVARROCK_SETTINGS_ENGINE: Record<string, unknown>;
    __LAVARROCK_SETTINGS_MANAGER: Record<string, unknown>;
    __LAVARROCK_APPS?: {
      open: () => void;
      close: () => void;
      registerApp: (app: {
        id: string;
        name: string;
        description?: string;
        icon?: React.ComponentType<{ className?: string }>;
        action?: () => void;
      }) => () => void;
      getApps: () => Array<{
        id: string;
        name: string;
        description?: string;
        icon?: React.ComponentType<{ className?: string }>;
        action?: () => void;
      }>;
    };
  }
}

const GLOBAL_MAP: Record<string, string> = {
  "lavarrock.ui": "__LAVARROCK_UI",
  "lavarrock.wm": "__LAVARROCK_WM",
  "lavarrock.tooltips": "__LAVARROCK_TOOLTIPS",
  "lavarrock.header": "__LAVARROCK_HEADER",
  "lavarrock.footer": "__LAVARROCK_FOOTER",
  "lavarrock.search-modal": "__LAVARROCK_SEARCH_MODAL",
  "lavarrock.app-modal": "__LAVARROCK_APP_MODAL",
  "lavarrock.search-bar": "__LAVARROCK_SEARCH_BAR",
  "lavarrock.app-launcher": "__LAVARROCK_APP_LAUNCHER",
  "lavarrock.json-tool": "__LAVARROCK_JSON_TOOL",
  "lavarrock.theme-manager": "__LAVARROCK_THEME_MANAGER",
  "lavarrock.theme-engine": "__LAVARROCK_THEME_ENGINE",
  "lavarrock.theme-import": "__LAVARROCK_THEME_IMPORT",
  "lavarrock.layout-manager": "__LAVARROCK_LAYOUT_MANAGER",
  "lavarrock.layout-engine": "__LAVARROCK_LAYOUT_ENGINE",
  "lavarrock.settings-engine": "__LAVARROCK_SETTINGS_ENGINE",
  "lavarrock.settings-manager": "__LAVARROCK_SETTINGS_MANAGER",
};

// ── Helpers ───────────────────────────────────────

const REGISTRY_URL =
  import.meta.env.VITE_REGISTRY_URL || "http://localhost:3001";

/**
 * Inject a <link rel="stylesheet"> for plugin CSS.
 */
function loadCSS(href: string): void {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Inject a <script> tag and wait for it to load.
 * Deduplicates by src URL — if a script with the same src exists, skip.
 */
function loadScript(src: string): Promise<void> {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Topological sort: plugins with fewer / no dependencies first,
 * then by descending priority.
 */
function topoSort(plugins: RegistryPluginManifest[]): RegistryPluginManifest[] {
  const byId = new Map(plugins.map((p) => [p.id, p]));
  const visited = new Set<string>();
  const sorted: RegistryPluginManifest[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const p = byId.get(id);
    if (!p) return;
    for (const dep of p.depends) {
      visit(dep);
    }
    sorted.push(p);
  }

  // Visit in priority order (highest first) to break ties predictably
  const byPriority = [...plugins].sort((a, b) => b.priority - a.priority);
  for (const p of byPriority) {
    visit(p.id);
  }

  return sorted;
}

// ── Main loader ───────────────────────────────────

export async function loadPlugins(): Promise<LoadedPlugin[]> {
  console.log("[PluginLoader] Starting plugin load…");

  // 1. Fetch user config
  let config: PluginConfig;
  try {
    const res = await fetch("/api/config");
    config = await res.json();
  } catch (err) {
    console.warn(
      "[PluginLoader] Could not reach backend /api/config, using defaults",
    );
    config = {
      plugins: [
        { id: "lavarrock.ui", enabled: true, settings: {} },
        { id: "lavarrock.wm", enabled: true, settings: {} },
        { id: "lavarrock.tooltips", enabled: true, settings: {} },
        { id: "lavarrock.header", enabled: true, settings: {} },
        { id: "lavarrock.search-modal", enabled: true, settings: {} },
        { id: "lavarrock.app-modal", enabled: true, settings: {} },
        { id: "lavarrock.search-bar", enabled: true, settings: {} },
        { id: "lavarrock.app-launcher", enabled: true, settings: {} },
        { id: "lavarrock.json-tool", enabled: true, settings: {} },
        { id: "lavarrock.theme-engine", enabled: true, settings: {} },
        { id: "lavarrock.theme-manager", enabled: true, settings: {} },
        { id: "lavarrock.theme-import", enabled: true, settings: {} },
        { id: "lavarrock.layout-engine", enabled: true, settings: {} },
        { id: "lavarrock.settings-engine", enabled: true, settings: {} },
        { id: "lavarrock.layout-manager", enabled: true, settings: {} },
        { id: "lavarrock.settings-manager", enabled: true, settings: {} },
      ],
    };
  }

  // 2. Fetch registry manifest
  let registry: RegistryManifest;
  try {
    const res = await fetch(`${REGISTRY_URL}/api/plugins`);
    registry = await res.json();
  } catch (err) {
    console.error("[PluginLoader] Failed to reach plugin registry:", err);
    return [];
  }

  // 3. Build a set of enabled plugin IDs
  const enabledIds = new Set(
    config.plugins.filter((c) => c.enabled).map((c) => c.id),
  );

  // Always include dependencies of enabled plugins
  const allAvailable = new Map(registry.plugins.map((p) => [p.id, p]));
  const toLoad = new Set<string>();

  function addWithDeps(id: string) {
    if (toLoad.has(id)) return;
    const manifest = allAvailable.get(id);
    if (!manifest) return;
    for (const dep of manifest.depends) {
      addWithDeps(dep);
    }
    toLoad.add(id);
  }

  for (const id of enabledIds) {
    addWithDeps(id);
  }

  // 4. Load global CSS (theme + Tailwind utilities for all plugins)
  if (registry.globalCss) {
    loadCSS(`${REGISTRY_URL}${registry.globalCss}`);
    console.log("[PluginLoader] Loaded global plugin CSS");
  }

  // 5. Filter to plugins we need and sort
  const pluginsToLoad = registry.plugins.filter((p) => toLoad.has(p.id));
  const sorted = topoSort(pluginsToLoad);

  console.log(
    "[PluginLoader] Load order:",
    sorted.map((p) => p.id),
  );

  // 6. Load each plugin sequentially (order matters for globals)
  const loaded: LoadedPlugin[] = [];

  for (const manifest of sorted) {
    try {
      // Load CSS if present
      if (manifest.css) {
        loadCSS(`${REGISTRY_URL}${manifest.css}`);
      }
      if (manifest.componentCss) {
        loadCSS(`${REGISTRY_URL}${manifest.componentCss}`);
      }

      // Load JS bundle
      const bundleUrl = `${REGISTRY_URL}${manifest.bundle}`;
      await loadScript(bundleUrl);

      // Read the plugin's exports from its global
      const globalName = GLOBAL_MAP[manifest.id];
      const exports = globalName ? (window as any)[globalName] || {} : {};

      // Resolve settings from config
      const configEntry = config.plugins.find((c) => c.id === manifest.id);
      const settings = configEntry?.settings || {};

      loaded.push({ manifest, exports, settings });

      console.log(
        `[PluginLoader] ✓ ${manifest.id} loaded (${Object.keys(exports).length} exports)`,
      );
    } catch (err) {
      console.error(`[PluginLoader] ✗ Failed to load ${manifest.id}:`, err);
    }
  }

  console.log(`[PluginLoader] Done — ${loaded.length} plugins loaded.`);
  return loaded;
}
