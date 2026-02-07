/**
 * Layout Manager — shared plugin.
 *
 * Registers layout settings with the Settings Engine.
 * No pane — all config lives in the Settings Manager.
 */
export { initLayoutManager } from "./init";

// Re-export layout engine types for downstream consumers
export * from "@lavarrock/plugin-layout-engine";
