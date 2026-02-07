import { useEffect } from "react";
import { Input } from "@lavarrock/ui";
import { Search } from "lucide-react";

/**
 * SearchBar — injects itself into the header's center slot.
 * When clicked (or via ⌘K), opens the global search modal.
 */
export function SearchBarSlot() {
  useEffect(() => {
    function inject() {
      const slots = window.__LAVARROCK_HEADER_SLOTS;
      if (!slots) return;

      slots.addCenter(
        "search-bar",
        () => React.createElement(SearchBarWidget),
        0,
      );
    }

    // If header slots are already available, inject now
    if (window.__LAVARROCK_HEADER_SLOTS) {
      inject();
    }

    // Also listen for the ready event in case we load before the header
    window.addEventListener("lavarrock:header-slots-ready", inject);
    return () => {
      window.removeEventListener("lavarrock:header-slots-ready", inject);
      window.__LAVARROCK_HEADER_SLOTS?.remove("search-bar");
    };
  }, []);

  return null;
}

function SearchBarWidget() {
  const openSearch = () => {
    window.__LAVARROCK_SEARCH?.open();
  };

  return (
    <div className="relative max-w-xl flex-1 w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        readOnly
        placeholder="Search… (⌘K)"
        onClick={openSearch}
        onFocus={openSearch}
        className="h-7 pl-8 pr-3 text-xs bg-background/50 border-border text-center cursor-pointer"
      />
    </div>
  );
}
