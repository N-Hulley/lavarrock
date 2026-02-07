import type { PluginContext } from "@lavarrock/plugin-sdk";

export async function activate(ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.ui] UI components plugin activated");

  // Register the TooltipProvider as a global wrapper so all tooltips work
  // without each consumer needing to add their own provider.
  const { TooltipProvider } = await import("./resources/components/Tooltip");
  ctx.registerWrapper?.(TooltipProvider);
}
