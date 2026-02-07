import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@lavarrock/ui";
import type { TilingNode as TilingNodeType } from "../lib/types";
import { TileWindow } from "./TileWindow";
import { useTiling } from "./TilingContext";
import { useWMHost } from "./WMHostBridge";

interface TilingNodeRendererProps {
  node: TilingNodeType;
}

/**
 * Recursively renders the binary tree tiling layout.
 *
 * - Leaf nodes → TileWindow
 * - Split nodes → ResizablePanelGroup with two children
 *
 * This mirrors how Hyprland's dwindle/master layout works,
 * using react-resizable-panels (shadcn Resizable) for the resize handles.
 */
export function TilingNodeRenderer({ node }: TilingNodeRendererProps) {
  const { focusedNodeId } = useTiling();
  const { getPlugin } = useWMHost();

  if (node.type === "leaf") {
    const plugin = getPlugin(node.pluginId);
    if (!plugin) {
      return (
        <div className="flex h-full items-center justify-center rounded-[var(--radius)] border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Plugin "{node.pluginId}" not found
          </p>
        </div>
      );
    }

    return (
      <TileWindow
        nodeId={node.id}
        plugin={plugin}
        isFocused={focusedNodeId === node.id}
      />
    );
  }

  // Split node
  const direction = node.direction === "horizontal" ? "horizontal" : "vertical";

  return (
    <ResizablePanelGroup direction={direction} className="h-full w-full">
      <ResizablePanel defaultSize={node.ratio} minSize={10}>
        <div
          className="h-full"
          style={{ padding: "calc(var(--panel-gap, 8px) / 2)" }}
        >
          <TilingNodeRenderer node={node.children[0]} />
        </div>
      </ResizablePanel>

      <ResizableHandle
        withHandle
        className="mx-0 data-[panel-group-direction=horizontal]:w-1 data-[panel-group-direction=vertical]:h-1"
      />

      <ResizablePanel defaultSize={100 - node.ratio} minSize={10}>
        <div
          className="h-full"
          style={{ padding: "calc(var(--panel-gap, 8px) / 2)" }}
        >
          <TilingNodeRenderer node={node.children[1]} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
