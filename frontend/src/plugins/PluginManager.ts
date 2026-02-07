import * as LucideIcons from "lucide-react";
import { Plugin, PaneManifest, PluginRegistry } from "./types";
import { pluginLogger } from "@/lib/logger";

const STORAGE_KEY = "lavarrock_plugin_registry";
const REGISTRY_VERSION = "1.0.0";

/**
 * PluginManager – slim v2 runtime.
 *
 * Handles registration, icon loading, and persistence of
 * PaneManifest-based plugins. Component loading is now
 * the responsibility of each v2 plugin package (they
 * export their own React component via the manifest).
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // ─── Registration ───────────────────────────────

  /**
   * Register a plugin and resolve its icon.
   */
  async registerPlugin(manifest: PaneManifest): Promise<void> {
    if (this.plugins.has(manifest.id)) {
      pluginLogger.warn(`Plugin ${manifest.id} is already registered`);
      return;
    }

    pluginLogger.info(`Registering plugin: ${manifest.id}`);

    const plugin: Plugin = {
      ...manifest,
      loadState: "pending",
      installedAt: Date.now(),
    };

    this.plugins.set(manifest.id, plugin);
    await this.loadPluginIcon(plugin);
    plugin.loadState = "loaded";
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Register a plugin that already has its React component resolved.
   * Used by v2 plugin packages that provide their own component.
   */
  registerLoadedPlugin(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      pluginLogger.warn(`Plugin ${plugin.id} is already registered`);
      return;
    }
    pluginLogger.info(`Registering loaded plugin: ${plugin.id}`);
    this.plugins.set(plugin.id, plugin);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Unregister a plugin.
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;
    if (plugin.isCore) {
      pluginLogger.warn(`Cannot unregister core plugin ${pluginId}`);
      return;
    }
    this.plugins.delete(pluginId);
    this.saveToStorage();
    this.notifyListeners();
  }

  // ─── Icon loading ───────────────────────────────

  private async loadPluginIcon(plugin: Plugin): Promise<void> {
    const iconName = plugin.icon;
    if (iconName in LucideIcons) {
      plugin.IconComponent = (LucideIcons as any)[iconName];
    } else {
      plugin.IconComponent = LucideIcons.Box;
    }
  }

  // ─── Queries ────────────────────────────────────

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByKind(kind: "content" | "extension"): Plugin[] {
    return this.getAllPlugins().filter((p) => p.kind === kind);
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  // ─── Import / Export ────────────────────────────

  async importPlugin(pluginPackage: string | object): Promise<void> {
    const pkg =
      typeof pluginPackage === "string"
        ? JSON.parse(pluginPackage)
        : pluginPackage;
    const manifest = pkg.manifest || pkg;
    manifest.isCore = false;
    await this.registerPlugin(manifest);
  }

  exportPlugin(pluginId: string): string {
    const plugin = this.getPlugin(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);

    const {
      Component,
      IconComponent,
      loadState,
      errorMessage,
      installedAt,
      ...manifest
    } = plugin;
    return JSON.stringify({ manifest }, null, 2);
  }

  // ─── Subscriptions ──────────────────────────────

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ─── Persistence ────────────────────────────────

  private saveToStorage(): void {
    const registry: PluginRegistry = {
      version: REGISTRY_VERSION,
      plugins: {},
    };

    this.plugins.forEach((plugin) => {
      if (!plugin.isCore) {
        const {
          Component,
          IconComponent,
          loadState,
          errorMessage,
          installedAt,
          ...manifest
        } = plugin;
        registry.plugins[plugin.id] = manifest;
      }
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
    } catch (error) {
      console.error("Failed to save plugin registry:", error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const registry: PluginRegistry = JSON.parse(stored);
      Object.values(registry.plugins).forEach((manifest) => {
        this.registerPlugin(manifest);
      });
    } catch (error) {
      console.error("Failed to load plugin registry:", error);
    }
  }

  /**
   * Reset to core plugins only.
   */
  reset(): void {
    const corePlugins = Array.from(this.plugins.values()).filter(
      (p) => p.isCore,
    );
    this.plugins.clear();
    corePlugins.forEach((p) => this.plugins.set(p.id, p));
    this.saveToStorage();
    this.notifyListeners();
  }
}

// Singleton instance
export const pluginManager = new PluginManager();
