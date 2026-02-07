import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Focus the previous pane in the tiling layout (cycles).
 */
export default function focusPrevious(ctx: PluginContext): void {
  ctx.emit("wm:focusPrevious");
}
