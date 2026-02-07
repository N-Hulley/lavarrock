import React, { createContext, useContext } from "react";
import type { ComponentType } from "react";

/**
 * Represents a registered plugin/pane that the WM can render.
 * This is a minimal interface — the host app maps its internal Plugin
 * type to this shape before passing it to the WM.
 */
export interface WMPlugin {
  id: string;
  name: string;
  kind: string;
  description?: string;
  IconComponent?: ComponentType<{ className?: string }>;
  Component?: ComponentType<any>;
  loadState: string;
  errorMessage?: string;
  [key: string]: any;
}

/**
 * Props for the pane content renderer.
 * The host app provides a component that knows how to render
 * a plugin's content inside a tile (wrapping with ErrorBoundary,
 * PluginContainer, etc.).
 */
export interface PaneRendererProps {
  plugin: WMPlugin;
  isActive: boolean;
  nodeId: string;
}

/**
 * Bridge context that the host application provides to the WM plugin.
 * This decouples the WM from host-app internals (PluginContext, PluginContainer, etc.).
 */
export interface WMHostBridge {
  /** Resolve a plugin by its id */
  getPlugin: (pluginId: string) => WMPlugin | undefined;

  /** Get all registered plugins */
  getAllPlugins: () => WMPlugin[];

  /** Component that renders a plugin's content inside a tile */
  PaneRenderer: ComponentType<PaneRendererProps>;
}

const WMHostBridgeContext = createContext<WMHostBridge | undefined>(undefined);

export const WMHostBridgeProvider: React.FC<{
  bridge: WMHostBridge;
  children: React.ReactNode;
}> = ({ bridge, children }) => {
  return (
    <WMHostBridgeContext.Provider value={bridge}>
      {children}
    </WMHostBridgeContext.Provider>
  );
};

export const useWMHost = (): WMHostBridge => {
  const ctx = useContext(WMHostBridgeContext);
  if (!ctx)
    throw new Error("useWMHost must be used within WMHostBridgeProvider");
  return ctx;
};
