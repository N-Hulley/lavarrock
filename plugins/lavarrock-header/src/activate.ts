import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Activate the header bar plugin.
 */
export async function activate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.header] Header bar activated");
}

/**
 * Deactivate the header bar plugin.
 */
export async function deactivate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.header] Header bar deactivated");
}
