import { useState, useEffect, useCallback } from "react";

// ── Slot API types ────────────────────────────────

type SlotPosition = "left" | "center" | "right";

interface SlotEntry {
  id: string;
  position: SlotPosition;
  order: number;
  render: () => React.ReactElement;
}

interface HeaderSlotsAPI {
  add: (
    position: SlotPosition,
    id: string,
    render: () => React.ReactElement,
    order?: number,
  ) => void;
  remove: (id: string) => void;
  addLeft: (
    id: string,
    render: () => React.ReactElement,
    order?: number,
  ) => void;
  addCenter: (
    id: string,
    render: () => React.ReactElement,
    order?: number,
  ) => void;
  addRight: (
    id: string,
    render: () => React.ReactElement,
    order?: number,
  ) => void;
}

declare global {
  interface Window {
    __LAVARROCK_HEADER_SLOTS?: HeaderSlotsAPI;
  }
}

export interface HeaderBarProps {
  /** Optional translation function – falls back to static labels */
  t?: (key: string) => string;
}

/**
 * Header bar — a slot host.
 *
 * Other plugins inject UI into `left`, `center`, or `right`
 * zones by calling `window.__LAVARROCK_HEADER_SLOTS.addLeft(…)` etc.
 */
export default function HeaderBar(_props: HeaderBarProps) {
  const [slots, setSlots] = useState<SlotEntry[]>([]);

  const add = useCallback(
    (
      position: SlotPosition,
      id: string,
      render: () => React.ReactElement,
      order = 0,
    ) => {
      setSlots((prev) => {
        // Deduplicate by id
        const without = prev.filter((s) => s.id !== id);
        return [...without, { id, position, order, render }].sort(
          (a, b) => a.order - b.order,
        );
      });
    },
    [],
  );

  const remove = useCallback((id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Publish the slot API globally so child plugins can register
  useEffect(() => {
    const api: HeaderSlotsAPI = {
      add,
      remove,
      addLeft: (id, render, order) => add("left", id, render, order),
      addCenter: (id, render, order) => add("center", id, render, order),
      addRight: (id, render, order) => add("right", id, render, order),
    };
    window.__LAVARROCK_HEADER_SLOTS = api;

    // Notify any plugins waiting for the slot host
    window.dispatchEvent(new CustomEvent("lavarrock:header-slots-ready"));

    return () => {
      delete window.__LAVARROCK_HEADER_SLOTS;
    };
  }, [add, remove]);

  const left = slots.filter((s) => s.position === "left");
  const center = slots.filter((s) => s.position === "center");
  const right = slots.filter((s) => s.position === "right");

  return (
    <header className="border-b bg-[hsl(var(--tablist))]">
      <div className="flex items-center justify-between w-full px-3 py-1 gap-2">
        {/* Left zone */}
        <div className="flex items-center gap-1">
          {left.map((s) => (
            <React.Fragment key={s.id}>{s.render()}</React.Fragment>
          ))}
        </div>

        {/* Center zone */}
        <div className="relative max-w-xl flex-1 flex items-center justify-center">
          {center.map((s) => (
            <React.Fragment key={s.id}>{s.render()}</React.Fragment>
          ))}
        </div>

        {/* Right zone */}
        <div className="flex items-center gap-1">
          {right.map((s) => (
            <React.Fragment key={s.id}>{s.render()}</React.Fragment>
          ))}
        </div>
      </div>
    </header>
  );
}
