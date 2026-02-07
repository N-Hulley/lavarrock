import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Split the focused pane horizontally (side by side).
 */
export default function splitHorizontal(ctx: PluginContext): void {
  const tiling = ctx.getState<any>("layout");
  if (!tiling) return;

  // Emit a WM event — the TilingContext listens for this
  ctx.emit("wm:split", { direction: "horizontal" });
}
