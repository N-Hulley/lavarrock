import React from "react";
import { WMHostBridgeProvider } from "./WMHostBridge";
import type { WMHostBridge } from "./WMHostBridge";
import { TilingNodeRenderer } from "./TilingNodeRenderer";
import { PaneLauncher } from "./PaneLauncher";
import { useTiling } from "./TilingContext";
import { Button } from "@lavarrock/ui";
import { LayoutGrid, Plus } from "lucide-react";

export interface TilingShellProps {
  /** Host bridge providing plugin resolution and pane rendering */
  bridge: WMHostBridge;
  /** Whether the launcher dialog is open */
  launcherOpen?: boolean;
  /** Callback when launcher open state changes */
  onLauncherOpenChange?: (open: boolean) => void;
}

/**
 * The TilingShell component — this is what gets mounted
 * into the `content` render slot. It expects a TilingProvider
 * to be present higher in the tree (provided by the host app)
 * so that header controls can also access useTiling().
 *
 * It wraps with WMHostBridgeProvider to give tiling components
 * access to the host's plugin registry.
 */
export function TilingShell({
  bridge,
  launcherOpen = false,
  onLauncherOpenChange,
}: TilingShellProps) {
  const { root } = useTiling();

  return (
    <WMHostBridgeProvider bridge={bridge}>
      {root ? (
        <TilingNodeRenderer node={root} />
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center space-y-3">
            <LayoutGrid className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No panes open</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLauncherOpenChange?.(true)}
              className="text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Open a Pane
            </Button>
          </div>
        </div>
      )}

      <PaneLauncher
        open={launcherOpen}
        onOpenChange={(open) => onLauncherOpenChange?.(open)}
      />
    </WMHostBridgeProvider>
  );
}
