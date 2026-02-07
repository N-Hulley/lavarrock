import { useEffect } from "react";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@lavarrock/ui";
import { Plus } from "lucide-react";

/**
 * AppLauncherSlot — injects a "+ Open Pane" button into the
 * header's left slot. Clicking it opens the App Modal.
 */
export function AppLauncherSlot() {
  useEffect(() => {
    function inject() {
      const slots = window.__LAVARROCK_HEADER_SLOTS;
      if (!slots) return;

      slots.addLeft(
        "app-launcher",
        () => React.createElement(AppLauncherButton),
        0,
      );
    }

    if (window.__LAVARROCK_HEADER_SLOTS) {
      inject();
    }

    window.addEventListener("lavarrock:header-slots-ready", inject);
    return () => {
      window.removeEventListener("lavarrock:header-slots-ready", inject);
      window.__LAVARROCK_HEADER_SLOTS?.remove("app-launcher");
    };
  }, []);

  return null;
}

function AppLauncherButton() {
  const openApps = () => {
    window.__LAVARROCK_APPS?.open();
  };

  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs gap-1.5"
          onClick={openApps}
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Open Pane</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Open Pane (⌘P)</p>
      </TooltipContent>
    </Tooltip>
  );
}
