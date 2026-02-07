import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Focus the next pane in the tiling layout (cycles).
 */
export default function focusNext(ctx: PluginContext): void {
  ctx.emit("wm:focusNext");
}
