import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Close the currently focused pane.
 */
export default function closePane(ctx: PluginContext): void {
  ctx.emit("wm:closePane");
}
