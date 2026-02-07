import React, { useEffect, useState, useMemo, ComponentType } from "react";
import { loadActiveTheme } from "@/lib/theme";
import { PluginProvider, usePlugins } from "./plugins/PluginContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { pluginManager } from "./plugins/PluginManager";
import { loadPlugins, LoadedPlugin } from "./plugins/PluginLoader";
import type { DockSide } from "./plugins/types";
import { PluginContainer } from "./plugins/components/PluginContainer";

// ── Types for dynamically-resolved components ─────
interface ResolvedComponents {
  TilingProvider?: ComponentType<{ children: React.ReactNode }>;
  TilingShell?: ComponentType<any>;
  useTiling?: () => any;
  createLeaf?: (pluginId: string) => any;
  HeaderBar?: ComponentType<any>;
  FooterBar?: ComponentType<any>;
  TooltipWrapper?: ComponentType<{ children: React.ReactNode }>;
  SearchModal?: ComponentType<any>;
  AppModal?: ComponentType<any>;
  SearchBarSlot?: ComponentType<any>;
  AppLauncherSlot?: ComponentType<any>;
  ThemeImportExtension?: ComponentType<any>;
}

/**
 * Resolve named components from loaded plugin exports.
 */
function resolveComponents(loaded: LoadedPlugin[]): ResolvedComponents {
  const components: ResolvedComponents = {};
  const byId = new Map(loaded.map((p) => [p.manifest.id, p]));

  const wm = byId.get("lavarrock.wm");
  if (wm) {
    components.TilingProvider = wm.exports.TilingProvider as any;
    components.TilingShell = wm.exports.TilingShell as any;
    components.useTiling = wm.exports.useTiling as any;
    components.createLeaf = wm.exports.createLeaf as any;
  }

  const header = byId.get("lavarrock.header");
  if (header) {
    components.HeaderBar = (header.exports.HeaderBar ||
      header.exports.default) as any;
  }

  const footer = byId.get("lavarrock.footer");
  if (footer) {
    components.FooterBar = (footer.exports.FooterBar ||
      footer.exports.default) as any;
  }

  const tooltips = byId.get("lavarrock.tooltips");
  if (tooltips) {
    components.TooltipWrapper = (tooltips.exports.TooltipWrapper ||
      tooltips.exports.default) as any;
  }

  const searchModal = byId.get("lavarrock.search-modal");
  if (searchModal) {
    components.SearchModal = (searchModal.exports.SearchModal ||
      searchModal.exports.default) as any;
  }

  const appModal = byId.get("lavarrock.app-modal");
  if (appModal) {
    components.AppModal = (appModal.exports.AppModal ||
      appModal.exports.default) as any;
  }

  const searchBar = byId.get("lavarrock.search-bar");
  if (searchBar) {
    components.SearchBarSlot = (searchBar.exports.SearchBarSlot ||
      searchBar.exports.default) as any;
  }

  const appLauncher = byId.get("lavarrock.app-launcher");
  if (appLauncher) {
    components.AppLauncherSlot = (appLauncher.exports.AppLauncherSlot ||
      appLauncher.exports.default) as any;
  }

  const themeImport = byId.get("lavarrock.theme-import");
  if (themeImport) {
    components.ThemeImportExtension = (themeImport.exports
      .ThemeImportExtension || themeImport.exports.default) as any;
  }

  return components;
}

/**
 * Register pane plugins with the PluginManager so they appear in the WM launcher.
 */
function registerPanePlugins(loaded: LoadedPlugin[]): void {
  for (const { manifest, exports } of loaded) {
    if (manifest.type !== "pane" || !manifest.paneId) continue;

    const Component = (exports[manifest.component || "default"] ||
      exports.default) as ComponentType<any> | undefined;
    if (!Component) continue;

    pluginManager.registerLoadedPlugin({
      id: manifest.paneId,
      version: manifest.version,
      name: manifest.paneManifest?.name || manifest.name,
      author: "Lavarrock",
      description: manifest.description || "",
      icon: manifest.paneManifest?.icon || "Box",
      kind: (manifest.paneManifest?.kind || "content") as any,
      defaultDock: (manifest.paneManifest?.defaultDock || "main") as DockSide,
      component: { type: "react", source: "registry" },
      isCore: true,
      Component,
      loadState: "loaded",
      installedAt: Date.now(),
    });
  }
}

// ── Loading screen ────────────────────────────────

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto animate-spin rounded-full border-2 border-muted border-t-foreground" />
        <p className="text-sm text-muted-foreground">Loading plugins…</p>
      </div>
    </div>
  );
}

// ── Main app content (rendered after plugins load) ──

function AppContent({ components }: { components: ResolvedComponents }) {
  const {
    TilingShell,
    useTiling: useTilingHook,
    HeaderBar,
    FooterBar,
    TooltipWrapper,
    SearchModal,
    AppModal,
    SearchBarSlot,
    AppLauncherSlot,
    ThemeImportExtension,
  } = components;

  const { getPlugin, getAllPlugins, createPluginAPI } = usePlugins();
  const [launcherOpen, setLauncherOpen] = useState(false);

  // Access tiling context (available because TilingProvider wraps us)
  const tiling = useTilingHook?.();

  // Build the WM host bridge
  const bridge = useMemo(
    () => ({
      getPlugin: (pluginId: string) => {
        const p = getPlugin(pluginId);
        if (!p) return undefined;
        return {
          id: p.id,
          name: p.name,
          kind: p.kind,
          description: p.description,
          IconComponent: p.IconComponent,
          Component: p.Component,
          loadState: p.loadState,
          errorMessage: p.errorMessage,
        };
      },
      getAllPlugins: () =>
        getAllPlugins().map((p) => ({
          id: p.id,
          name: p.name,
          kind: p.kind,
          description: p.description,
          IconComponent: p.IconComponent,
          Component: p.Component,
          loadState: p.loadState,
          errorMessage: p.errorMessage,
        })),
      PaneRenderer: ({
        plugin,
        isActive,
      }: {
        plugin: any;
        isActive: boolean;
        nodeId: string;
      }) => {
        const hostPlugin = getPlugin(plugin.id);
        if (!hostPlugin) return null;
        return (
          <ErrorBoundary namespace={`tile-${plugin.id}`}>
            <PluginContainer
              plugin={hostPlugin}
              dock={"main" as DockSide}
              isActive={isActive}
            />
          </ErrorBoundary>
        );
      },
    }),
    [getPlugin, getAllPlugins, createPluginAPI],
  );

  // Theme loading
  useEffect(() => {
    loadActiveTheme();
    const handler = () => loadActiveTheme();
    window.addEventListener("theme-updated", handler);
    return () => window.removeEventListener("theme-updated", handler);
  }, []);

  // Listen for launcher events from header plugin
  useEffect(() => {
    const onOpen = () => setLauncherOpen(true);
    window.addEventListener("lavarrock:open-launcher", onOpen);
    return () => window.removeEventListener("lavarrock:open-launcher", onOpen);
  }, []);

  // Listen for reset-layout events
  useEffect(() => {
    if (!tiling) return;
    const onReset = () => tiling.setRoot(null);
    window.addEventListener("lavarrock:reset-layout", onReset);
    return () => window.removeEventListener("lavarrock:reset-layout", onReset);
  }, [tiling]);

  // Register all pane plugins with the app modal so they appear in the launcher.
  // Use a ref to hold tiling so the registration closure always has the latest
  // context without needing tiling in the dependency array.
  const tilingRef = React.useRef(tiling);
  tilingRef.current = tiling;

  useEffect(() => {
    const plugins = getAllPlugins();
    if (plugins.length === 0) return;

    let registered = false;
    const unregisters: (() => void)[] = [];

    function registerWithAppModal() {
      const api = window.__LAVARROCK_APPS;
      if (!api || registered) return;
      registered = true;

      for (const p of plugins) {
        const unreg = api.registerApp({
          id: p.id,
          name: p.name,
          description: p.description,
          icon: p.IconComponent,
          action: () => {
            const t = tilingRef.current;
            if (t) {
              t.openPlugin(p.id);
            }
          },
        });
        unregisters.push(unreg);
      }
    }

    // Register now if the API is ready, or wait for it
    if (window.__LAVARROCK_APPS) {
      registerWithAppModal();
    }
    window.addEventListener("lavarrock:apps-ready", registerWithAppModal);

    return () => {
      window.removeEventListener("lavarrock:apps-ready", registerWithAppModal);
      unregisters.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllPlugins]);

  // Listen for lavarrock:open-pane events from the app modal
  useEffect(() => {
    if (!tiling) return;
    const onOpenPane = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.pluginId) {
        const direction = detail.direction || "horizontal";
        if (tiling.root && tiling.focusedNodeId) {
          tiling.splitPane(tiling.focusedNodeId, detail.pluginId, direction);
        } else {
          tiling.openPlugin(detail.pluginId, direction);
        }
      }
    };
    window.addEventListener("lavarrock:open-pane", onOpenPane);
    return () => window.removeEventListener("lavarrock:open-pane", onOpenPane);
  }, [tiling]);

  const inner = (
    <div
      id="lavarrock-root"
      className="grid h-screen grid-rows-[auto_1fr_auto] bg-background"
    >
      {HeaderBar && <HeaderBar />}
      {SearchModal && <SearchModal />}
      {AppModal && <AppModal />}
      {SearchBarSlot && <SearchBarSlot />}
      {AppLauncherSlot && <AppLauncherSlot />}
      {ThemeImportExtension && <ThemeImportExtension />}
      <div
        className="min-h-0 mx-auto w-full"
        style={{
          padding: "calc(var(--panel-gap, 8px) / 2)",
          maxWidth: "var(--container-max, 100%)",
        }}
      >
        <ErrorBoundary namespace="tiling-root">
          {TilingShell ? (
            <TilingShell
              bridge={bridge}
              launcherOpen={launcherOpen}
              onLauncherOpenChange={setLauncherOpen}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Window manager plugin not loaded
            </div>
          )}
        </ErrorBoundary>
      </div>
      {FooterBar && <FooterBar />}
    </div>
  );

  return TooltipWrapper ? <TooltipWrapper>{inner}</TooltipWrapper> : inner;
}

// ── Root App ──────────────────────────────────────

// Guard against StrictMode double-effect loading plugins twice
let pluginLoadPromise: Promise<LoadedPlugin[]> | null = null;

function App() {
  const [loaded, setLoaded] = useState<LoadedPlugin[] | null>(null);
  const [components, setComponents] = useState<ResolvedComponents>({});

  useEffect(() => {
    if (!pluginLoadPromise) {
      pluginLoadPromise = loadPlugins();
    }
    pluginLoadPromise.then((plugins) => {
      const resolved = resolveComponents(plugins);
      registerPanePlugins(plugins);
      setComponents(resolved);
      setLoaded(plugins);
    });
  }, []);

  if (!loaded) return <LoadingScreen />;

  const { TilingProvider } = components;

  let content = <AppContent components={components} />;

  if (TilingProvider) {
    content = <TilingProvider>{content}</TilingProvider>;
  }

  return <PluginProvider>{content}</PluginProvider>;
}

export default App;
