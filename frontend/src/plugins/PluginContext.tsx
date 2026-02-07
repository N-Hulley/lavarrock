import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Plugin, PluginAPI } from "./types";
import { pluginManager } from "./PluginManager";
import {
  clearNamespaceValues,
  getNamespaceState,
  getNamespaceValue,
  replaceNamespaceValues,
  setNamespaceValue,
  setNamespaceValues,
} from "@/state/pluginStateAccess";

// ─── Context shape ────────────────────────────────
interface PluginContextType {
  plugins: Plugin[];
  getPlugin: (pluginId: string) => Plugin | undefined;
  getAllPlugins: () => Plugin[];
  reloadPlugins: () => void;
  importPlugin: (data: string | object) => Promise<void>;
  exportPlugin: (pluginId: string) => string;
  uninstallPlugin: (pluginId: string) => void;
  createPluginAPI: (pluginId: string) => PluginAPI;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────
export const PluginProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);

  // Subscribe to PluginManager changes
  useEffect(() => {
    const update = () => setPlugins(pluginManager.getAllPlugins());
    update();
    return pluginManager.subscribe(update);
  }, []);

  const getPlugin = useCallback(
    (id: string) => pluginManager.getPlugin(id),
    [],
  );

  const getAllPlugins = useCallback(() => pluginManager.getAllPlugins(), []);

  const reloadPlugins = useCallback(
    () => setPlugins(pluginManager.getAllPlugins()),
    [],
  );

  const importPlugin = useCallback(
    async (data: string | object) => pluginManager.importPlugin(data),
    [],
  );

  const exportPlugin = useCallback(
    (id: string) => pluginManager.exportPlugin(id),
    [],
  );

  const uninstallPlugin = useCallback(
    (id: string) => pluginManager.unregisterPlugin(id),
    [],
  );

  const createPluginAPI = useCallback(
    (pluginId: string): PluginAPI => ({
      openPane: (_paneId: string) => {
        // Pane management is handled by the tiling WM plugin.
        // Plugins that need to open a pane should dispatch a
        // custom event or call a WM command.
        console.log(`[PluginAPI] openPane is a no-op — use WM commands`);
      },
      closePane: (_id?: string) => {
        console.log(`[PluginAPI] closePane is a no-op — use WM commands`);
      },
      getConfig: () => {
        const plugin = pluginManager.getPlugin(pluginId);
        return plugin?.config || {};
      },
      setConfig: (config: Record<string, unknown>) => {
        const plugin = pluginManager.getPlugin(pluginId);
        if (plugin) plugin.config = config;
      },
      notify: (message: string, type = "info") => {
        console.log(`[${type.toUpperCase()}] ${message}`);
      },
      state: {
        get: (key, ns?) => getNamespaceValue(pluginId, key, ns),
        set: (key, val, ns?) => setNamespaceValue(pluginId, key, val, ns),
        getNamespace: (ns?) => getNamespaceState(pluginId, ns),
        setNamespace: (vals, ns?) => setNamespaceValues(pluginId, vals, ns),
        replaceNamespace: (vals, ns?) =>
          replaceNamespaceValues(pluginId, vals, ns),
        clearNamespace: (ns?) => clearNamespaceValues(pluginId, ns),
      },
    }),
    [],
  );

  return (
    <PluginContext.Provider
      value={{
        plugins,
        getPlugin,
        getAllPlugins,
        reloadPlugins,
        importPlugin,
        exportPlugin,
        uninstallPlugin,
        createPluginAPI,
      }}
    >
      {children}
    </PluginContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────
export const usePlugins = () => {
  const ctx = useContext(PluginContext);
  if (!ctx) throw new Error("usePlugins must be used within PluginProvider");
  return ctx;
};
