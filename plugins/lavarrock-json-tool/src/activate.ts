import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Activate the JSON tool plugin.
 */
export async function activate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.json-tool] JSON tool activated");
}

/**
 * Deactivate the JSON tool plugin.
 */
export async function deactivate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.json-tool] JSON tool deactivated");
}
