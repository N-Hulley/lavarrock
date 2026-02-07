import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Open the pane launcher (⌘P).
 */
export default function openLauncher(ctx: PluginContext): void {
  ctx.emit("wm:openLauncher");
}
