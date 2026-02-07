import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Activate the tiling window manager plugin.
 *
 * Sets up keyboard shortcut listeners and initialises the
 * layout state from persisted storage or defaults.
 */
export async function activate(ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.wm] Tiling window manager activated");

  // Register keyboard shortcuts for WM commands
  const shortcuts: Record<string, string> = {
    "mod+\\": "lavarrock.wm://command/splitHorizontal",
    "mod+shift+\\": "lavarrock.wm://command/splitVertical",
    "mod+w": "lavarrock.wm://command/closePane",
    "mod+]": "lavarrock.wm://command/focusNext",
    "mod+[": "lavarrock.wm://command/focusPrevious",
    "mod+p": "lavarrock.wm://command/openLauncher",
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    let key = "";
    if (e.shiftKey && e.key === "\\") key = "mod+shift+\\";
    else if (e.key === "\\") key = "mod+\\";
    else if (e.key === "w") key = "mod+w";
    else if (e.key === "]") key = "mod+]";
    else if (e.key === "[") key = "mod+[";
    else if (e.key === "p") key = "mod+p";

    const command = shortcuts[key];
    if (command) {
      e.preventDefault();
      ctx.executeCommand?.(command);
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  // Store cleanup for deactivation
  (ctx as any).__wmCleanup = () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}

/**
 * Deactivate the tiling window manager plugin.
 */
export async function deactivate(ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.wm] Tiling window manager deactivated");

  const cleanup = (ctx as any).__wmCleanup;
  if (typeof cleanup === "function") {
    cleanup();
    delete (ctx as any).__wmCleanup;
  }
}
