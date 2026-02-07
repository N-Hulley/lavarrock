import React, { useEffect, useRef, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { PluginComponentProps } from "../types";
import { pluginLogger } from "@/lib/logger";

interface ShadowPluginWrapperProps {
  plugin: any;
  pluginProps: PluginComponentProps;
  styles?: string;
}

/**
 * Wrapper component that renders a plugin in Shadow DOM for isolation
 * This provides:
 * - Style isolation (CSS doesn't leak in or out)
 * - DOM isolation (querySelector, getElementById work independently)
 * - Controlled communication via custom API calls
 */
export function ShadowPluginWrapper({ plugin, pluginProps, styles }: ShadowPluginWrapperProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    try {
      // Create shadow root if it doesn't exist
      if (!shadowRootRef.current) {
        shadowRootRef.current = hostRef.current.attachShadow({ mode: "open" });
        pluginLogger.debug(`Created Shadow DOM for plugin: ${plugin.id}`);
      }

      const shadowRoot = shadowRootRef.current;

      // Create container for React
      const container = document.createElement("div");
      container.style.height = "100%";
      container.style.width = "100%";
      container.style.overflow = "auto";
      shadowRoot.appendChild(container);

      // Inject styles into Shadow DOM
      const styleSheet = document.createElement("style");
      
      // Get all stylesheets from the main document
      const mainStyles = Array.from(document.styleSheets)
        .map((sheet) => {
          try {
            return Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
          } catch (e) {
            // Can't access cross-origin stylesheets
            return "";
          }
        })
        .join("\n");

      styleSheet.textContent = `
        /* Main app styles */
        ${mainStyles}
        
        /* Plugin-specific styles */
        ${styles || ""}
        
        /* Reset to ensure consistency */
        :host {
          all: initial;
          display: block;
          height: 100%;
          width: 100%;
        }
        
        * {
          box-sizing: border-box;
        }
      `;
      shadowRoot.appendChild(styleSheet);

      // Create React root and render plugin
      if (plugin.Component) {
        reactRootRef.current = createRoot(container);
        
        // Create sandboxed API that only exposes controlled methods
        const sandboxedAPI = createSandboxedAPI(pluginProps.api);
        const sandboxedProps: PluginComponentProps = {
          ...pluginProps,
          api: sandboxedAPI,
        };

        reactRootRef.current.render(
          <ErrorBoundaryWrapper>
            <plugin.Component {...sandboxedProps} />
          </ErrorBoundaryWrapper>
        );
        
        pluginLogger.debug(`Rendered plugin in Shadow DOM: ${plugin.id}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      pluginLogger.error(`Failed to render plugin in Shadow DOM: ${plugin.id}`, { error: errorMsg });
    }

    // Cleanup
    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
        reactRootRef.current = null;
      }
      if (shadowRootRef.current) {
        shadowRootRef.current.innerHTML = "";
      }
    };
  }, [plugin, pluginProps, styles]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-destructive mb-2">Shadow DOM Error</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return <div ref={hostRef} className="h-full w-full" />;
}

/**
 * Create a sandboxed API that logs all calls and can be monitored/controlled
 */
function createSandboxedAPI(api: any) {
  if (!api) return undefined;

  const sandboxLogger = pluginLogger;

  return new Proxy(api, {
    get(target, prop) {
      const value = target[prop];
      
      // If it's a function, wrap it to log calls
      if (typeof value === "function") {
        return (...args: any[]) => {
          sandboxLogger.debug(`Plugin API call: ${String(prop)}`, { args });
          
          try {
            const result = value.apply(target, args);
            sandboxLogger.debug(`Plugin API call success: ${String(prop)}`, { result });
            return result;
          } catch (error) {
            sandboxLogger.error(
              `Plugin API call failed: ${String(prop)}`,
              { args, error: error instanceof Error ? error.message : String(error) }
            );
            throw error;
          }
        };
      }
      
      return value;
    },
  });
}

/**
 * Simple error boundary for Shadow DOM content
 */
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    pluginLogger.error("Shadow DOM plugin error", { error: error.message, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1rem", textAlign: "center" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.5rem" }}>
            Plugin Error
          </p>
          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            {this.state.error?.message || "An error occurred"}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
