import React, { useMemo } from "react";
import { Plugin, PluginComponentProps, DockSide } from "../types";
import { usePlugins } from "../PluginContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { pluginLogger } from "@/lib/logger";
import { ShadowPluginWrapper } from "./ShadowPluginWrapper";

interface PluginContainerProps {
  plugin: Plugin;
  dock: DockSide;
  isActive: boolean;
}

/**
 * Container component that loads and renders plugin content
 *
 * Trust-based system: All plugins are dynamically-imported React components
 * that run directly in the main application context. This provides:
 * - Direct access to application state and APIs
 * - Full React integration (hooks, context, etc.)
 * - Performance without IPC overhead
 * - Type safety for plugin APIs
 *
 * Security relies on user approval and code review rather than sandboxing.
 * Wraps each plugin in an error boundary for runtime isolation.
 */
export function PluginContainer({
  plugin,
  dock,
  isActive,
}: PluginContainerProps) {
  const { createPluginAPI } = usePlugins();

  console.log(
    `[PluginContainer] Rendering plugin: ${plugin.id}, isActive: ${isActive}, loadState: ${plugin.loadState}, Component: ${!!plugin.Component}`,
  );

  const pluginProps: PluginComponentProps = useMemo(
    () => ({
      pluginId: plugin.id,
      isActive,
      dock,
      config: plugin.config,
      api: createPluginAPI(plugin.id),
    }),
    [plugin.id, isActive, dock, plugin.config, createPluginAPI],
  );

  const pluginNamespace = `plugin:${plugin.id}`;

  // Show error state
  if (plugin.loadState === "error") {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-destructive mb-2">
            Plugin Error
          </p>
          <p className="text-xs text-muted-foreground">
            {plugin.errorMessage || "Failed to load plugin"}
          </p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (plugin.loadState === "loading" || plugin.loadState === "pending") {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Loading plugin...</p>
        </div>
      </div>
    );
  }

  // Render based on plugin type, wrapped in error boundary
  const renderPlugin = () => {
    switch (plugin.component.type) {
      case "builtin":
      case "react":
        if (!plugin.Component) {
          return (
            <div className="flex items-center justify-center h-full p-4">
              <p className="text-sm text-muted-foreground">
                Component not available
              </p>
            </div>
          );
        }

        // Use Shadow DOM if enabled for this plugin
        if (plugin.useShadowDOM) {
          return (
            <ShadowPluginWrapper
              plugin={plugin}
              pluginProps={pluginProps}
              styles={plugin.styles}
            />
          );
        }

        return <plugin.Component {...pluginProps} />;

      default:
        return (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-muted-foreground">Unknown plugin type</p>
          </div>
        );
    }
  };

  return (
    <ErrorBoundary
      namespace={pluginNamespace}
      onError={(error, errorInfo) => {
        pluginLogger.error(
          `Plugin ${plugin.name} crashed: ${error.message}`,
          {
            pluginId: plugin.id,
            componentStack: errorInfo.componentStack,
          },
          error,
        );
      }}
    >
      {renderPlugin()}
    </ErrorBoundary>
  );
}
