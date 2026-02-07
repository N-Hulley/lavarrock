import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Split the focused pane vertically (stacked).
 */
export default function splitVertical(ctx: PluginContext): void {
  const tiling = ctx.getState<any>("layout");
  if (!tiling) return;

  ctx.emit("wm:split", { direction: "vertical" });
}
