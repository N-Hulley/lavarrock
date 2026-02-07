import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  Button,
  Badge,
  ScrollArea,
} from "@lavarrock/ui";
import { Columns2, Rows2, LayoutGrid, AppWindow } from "lucide-react";

// ── Public types ──────────────────────────────────

export interface AppEntry {
  id: string;
  name: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Direct action — if provided, this is called instead of opening a pane */
  action?: () => void;
}

export interface AppModalAPI {
  open: () => void;
  close: () => void;
  registerApp: (app: AppEntry) => () => void;
  getApps: () => AppEntry[];
}

declare global {
  interface Window {
    __LAVARROCK_APPS?: AppModalAPI;
  }
}

// ── Component ─────────────────────────────────────

export function AppModal() {
  const [open, setOpen] = useState(false);
  const [apps, setApps] = useState<AppEntry[]>([]);
  const [search, setSearch] = useState("");

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  // Use a ref so the global API object stays stable and
  // doesn't re-publish (and re-fire the ready event) on every state change.
  const appsRef = useRef<AppEntry[]>(apps);
  appsRef.current = apps;

  const registerApp = useCallback((app: AppEntry) => {
    setApps((prev) => {
      const without = prev.filter((a) => a.id !== app.id);
      return [...without, app];
    });
    return () => {
      setApps((prev) => prev.filter((a) => a.id !== app.id));
    };
  }, []);

  const getApps = useCallback(() => appsRef.current, []);

  // Publish the API globally — runs only once
  useEffect(() => {
    const api: AppModalAPI = {
      open: openModal,
      close: closeModal,
      registerApp,
      getApps,
    };
    window.__LAVARROCK_APPS = api;

    window.dispatchEvent(new CustomEvent("lavarrock:apps-ready"));

    return () => {
      delete window.__LAVARROCK_APPS;
    };
  }, [openModal, closeModal, registerApp, getApps]);

  // Keyboard shortcut: Cmd/Ctrl + P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return apps;
    return apps.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q),
    );
  }, [apps, search]);

  const handleAction = (app: AppEntry) => {
    if (app.action) {
      app.action();
    } else {
      // Default: dispatch event for the WM to open this as a pane
      window.dispatchEvent(
        new CustomEvent("lavarrock:open-launcher", { detail: true }),
      );
    }
    closeModal();
  };

  const handleSplit = (app: AppEntry, direction: "horizontal" | "vertical") => {
    // Dispatch a pane-split event the WM can pick up
    window.dispatchEvent(
      new CustomEvent("lavarrock:open-pane", {
        detail: { pluginId: app.id, direction },
      }),
    );
    closeModal();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openModal() : closeModal())}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-medium">
            Applications
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Open an application pane
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Input
            placeholder="Search applications…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[350px] border-t border-border">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground gap-2">
              <AppWindow className="h-8 w-8 opacity-30" />
              <span>
                {apps.length === 0
                  ? "No applications registered"
                  : "No matching applications"}
              </span>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((app) => {
                const Icon = app.icon || LayoutGrid;
                return (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/5 transition-colors"
                  >
                    {/* Icon */}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius)] bg-accent/10 text-[hsl(var(--tab-icon))]">
                      <Icon className="h-4 w-4" />
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-foreground truncate">
                          {app.name}
                        </span>
                      </div>
                      {app.description && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {app.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Split horizontal"
                        onClick={() => handleSplit(app, "horizontal")}
                      >
                        <Columns2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        title="Split vertical"
                        onClick={() => handleSplit(app, "vertical")}
                      >
                        <Rows2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[10px]"
                        onClick={() => handleAction(app)}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
