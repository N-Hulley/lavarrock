import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Activate the tooltip provider plugin.
 */
export async function activate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.tooltips] Tooltip provider activated");
}

/**
 * Deactivate the tooltip provider plugin.
 */
export async function deactivate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.tooltips] Tooltip provider deactivated");
}
