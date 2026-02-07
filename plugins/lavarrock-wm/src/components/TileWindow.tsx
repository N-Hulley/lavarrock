import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@lavarrock/ui";
import { X, Columns2, Rows2, MoreVertical } from "lucide-react";
import type { WMPlugin } from "./WMHostBridge";
import { useWMHost } from "./WMHostBridge";
import { useTiling } from "./TilingContext";

interface TileWindowProps {
  nodeId: string;
  plugin: WMPlugin;
  isFocused: boolean;
}

/**
 * A single tile in the tiling layout — the Hyprland-style window.
 * Shows a thin title bar with split/close actions, and renders
 * the plugin content beneath it via the host-provided PaneRenderer.
 */
export function TileWindow({ nodeId, plugin, isFocused }: TileWindowProps) {
  const { closePane, splitPane, focusNode } = useTiling();
  const { PaneRenderer } = useWMHost();

  const Icon = plugin.IconComponent;

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-[var(--radius)] border bg-card transition-all duration-150 ${
        isFocused
          ? "border-[hsl(var(--tab-icon-active))/40] ring-1 ring-[hsl(var(--tab-icon-active))/15]"
          : "border-border"
      }`}
      onClick={() => focusNode(nodeId)}
    >
      {/* Title bar */}
      <div
        className={`flex items-center gap-1.5 border-b px-2 py-1 text-xs select-none transition-colors duration-150 ${
          isFocused
            ? "border-[hsl(var(--tab-icon-active))/20] bg-[hsl(var(--tab-icon-active))/6]"
            : "border-border bg-[hsl(var(--tablist))]"
        }`}
      >
        {/* Icon + Name */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {Icon && (
            <span
              className={`flex h-5 w-5 items-center justify-center text-[hsl(var(--tab-icon))] ${
                isFocused ? "text-[hsl(var(--tab-icon-active))]" : ""
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          <span className="truncate font-medium text-foreground">
            {plugin.name}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          {/* Split horizontal */}
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  splitPane(nodeId, plugin.id, "horizontal");
                }}
              >
                <Columns2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Split Right</TooltipContent>
          </Tooltip>

          {/* Split vertical */}
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  splitPane(nodeId, plugin.id, "vertical");
                }}
              >
                <Rows2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Split Down</TooltipContent>
          </Tooltip>

          {/* More actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => splitPane(nodeId, plugin.id, "horizontal")}
              >
                <Columns2 className="mr-2 h-3.5 w-3.5" />
                Split Right
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => splitPane(nodeId, plugin.id, "vertical")}
              >
                <Rows2 className="mr-2 h-3.5 w-3.5" />
                Split Down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => closePane(nodeId)}
                className="text-destructive focus:text-destructive"
              >
                <X className="mr-2 h-3.5 w-3.5" />
                Close
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Close */}
          <Tooltip delayDuration={400}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-muted-foreground hover:text-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  closePane(nodeId);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Plugin content — rendered by host-provided PaneRenderer */}
      <div
        className="@container flex-1 overflow-auto"
        style={{ padding: "var(--card-padding, 1rem)" }}
      >
        <PaneRenderer plugin={plugin} isActive={isFocused} nodeId={nodeId} />
      </div>
    </div>
  );
}
