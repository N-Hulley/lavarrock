import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Button,
  Badge,
} from "@lavarrock/ui";
import { Columns2, Rows2, Plus } from "lucide-react";
import { useWMHost } from "./WMHostBridge";
import { useTiling } from "./TilingContext";
import type { SplitDirection } from "../lib/types";

interface PaneLauncherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If set, the new plugin will split this node instead of the focused one */
  targetNodeId?: string;
}

/**
 * A command-palette-style dialog to open a new plugin pane.
 * Shows all available plugins and lets you choose split direction.
 */
export function PaneLauncher({
  open,
  onOpenChange,
  targetNodeId,
}: PaneLauncherProps) {
  const { getAllPlugins } = useWMHost();
  const { openPlugin, splitPane, root, focusedNodeId, isPluginOpen } =
    useTiling();
  const [search, setSearch] = useState("");

  const allPlugins = getAllPlugins();

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allPlugins;
    return allPlugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q),
    );
  }, [allPlugins, search]);

  const handleOpen = (pluginId: string, direction: SplitDirection) => {
    if (!root) {
      // No existing panes → just open
      openPlugin(pluginId, direction);
    } else {
      const target = targetNodeId ?? focusedNodeId;
      if (target) {
        splitPane(target, pluginId, direction);
      } else {
        openPlugin(pluginId, direction);
      }
    }
    setSearch("");
    onOpenChange(false);
  };

  const handleOpenSolo = (pluginId: string) => {
    openPlugin(pluginId);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-medium">Open Pane</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search for a plugin to open in a new tile
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Input
            placeholder="Search plugins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto border-t border-border">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
              No plugins found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((plugin) => {
                const Icon = plugin.IconComponent;
                const alreadyOpen = isPluginOpen(plugin.id);

                return (
                  <div
                    key={plugin.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/5 transition-colors"
                  >
                    {/* Icon */}
                    {Icon && (
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent/10 text-[hsl(var(--tab-icon))]">
                        <Icon className="h-4 w-4" />
                      </span>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {plugin.name}
                        </span>
                        {alreadyOpen && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0"
                          >
                            open
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0"
                        >
                          {plugin.kind}
                        </Badge>
                      </div>
                      {plugin.description && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {plugin.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!root ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleOpenSolo(plugin.id)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Open
                        </Button>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Split Right"
                            onClick={() => handleOpen(plugin.id, "horizontal")}
                          >
                            <Columns2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            title="Split Down"
                            onClick={() => handleOpen(plugin.id, "vertical")}
                          >
                            <Rows2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
