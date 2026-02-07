import type { PluginContext } from "@lavarrock/plugin-sdk";

/**
 * Activate the footer bar plugin.
 */
export async function activate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.footer] Footer bar activated");
}

/**
 * Deactivate the footer bar plugin.
 */
export async function deactivate(_ctx: PluginContext): Promise<void> {
  console.log("[lavarrock.footer] Footer bar deactivated");
}
