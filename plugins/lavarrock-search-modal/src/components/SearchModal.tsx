import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Input,
  ScrollArea,
} from "@lavarrock/ui";
import { Search, FileText } from "lucide-react";

// ── Public types ──────────────────────────────────

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export interface SearchProvider {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  search: (query: string) => SearchResult[] | Promise<SearchResult[]>;
}

export interface SearchAPI {
  open: () => void;
  close: () => void;
  registerProvider: (provider: SearchProvider) => () => void;
  getProviders: () => SearchProvider[];
}

declare global {
  interface Window {
    __LAVARROCK_SEARCH?: SearchAPI;
  }
}

// ── Component ─────────────────────────────────────

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [providers, setProviders] = useState<SearchProvider[]>([]);
  const [results, setResults] = useState<
    { provider: SearchProvider; results: SearchResult[] }[]
  >([]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
  }, []);

  // Use a ref so the global API object stays stable
  const providersRef = useRef<SearchProvider[]>(providers);
  providersRef.current = providers;

  const registerProvider = useCallback((provider: SearchProvider) => {
    setProviders((prev) => {
      const without = prev.filter((p) => p.id !== provider.id);
      return [...without, provider];
    });
    // Return unregister function
    return () => {
      setProviders((prev) => prev.filter((p) => p.id !== provider.id));
    };
  }, []);

  const getProviders = useCallback(() => providersRef.current, []);

  // Publish the API globally — runs only once
  useEffect(() => {
    const api: SearchAPI = {
      open: openModal,
      close: closeModal,
      registerProvider,
      getProviders,
    };
    window.__LAVARROCK_SEARCH = api;

    window.dispatchEvent(new CustomEvent("lavarrock:search-ready"));

    return () => {
      delete window.__LAVARROCK_SEARCH;
    };
  }, [openModal, closeModal, registerProvider, getProviders]);

  // Global keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Run search across all providers when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    const run = async () => {
      const grouped: { provider: SearchProvider; results: SearchResult[] }[] =
        [];
      for (const provider of providers) {
        try {
          const hits = await provider.search(query);
          if (!cancelled && hits.length > 0) {
            grouped.push({ provider, results: hits });
          }
        } catch {
          // skip failed providers
        }
      }
      if (!cancelled) setResults(grouped);
    };

    const timer = setTimeout(run, 150); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, providers]);

  const totalResults = useMemo(
    () => results.reduce((sum, g) => sum + g.results.length, 0),
    [results],
  );

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? openModal() : closeModal())}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-medium">Search</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Search across all registered providers
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Type to search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="max-h-[350px] border-t border-border">
          {query.trim() === "" ? (
            <div className="flex flex-col items-center justify-center p-8 text-sm text-muted-foreground gap-2">
              <Search className="h-8 w-8 opacity-30" />
              <span>
                {providers.length === 0
                  ? "No search providers registered"
                  : `${providers.length} provider${providers.length !== 1 ? "s" : ""} available`}
              </span>
            </div>
          ) : totalResults === 0 ? (
            <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
              No results found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {results.map(({ provider, results: hits }) => (
                <div key={provider.id}>
                  {/* Provider group header */}
                  <div className="flex items-center gap-2 px-4 py-1.5 text-[10px] font-medium uppercase text-muted-foreground bg-muted/30">
                    {provider.icon &&
                      React.createElement(provider.icon, {
                        className: "h-3 w-3",
                      })}
                    <span>{provider.name}</span>
                    <span className="ml-auto">{hits.length}</span>
                  </div>
                  {/* Results */}
                  {hits.map((result) => {
                    const Icon = result.icon || FileText;
                    return (
                      <button
                        key={result.id}
                        onClick={() => {
                          result.action();
                          closeModal();
                        }}
                        className="flex items-center gap-3 px-4 py-2 w-full text-left hover:bg-accent/10 transition-colors"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-foreground truncate">
                            {result.title}
                          </div>
                          {result.description && (
                            <div className="text-[10px] text-muted-foreground truncate">
                              {result.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
