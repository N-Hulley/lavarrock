/**
 * Core type definitions for Lavarrock extensions
 */

/**
 * Extension manifest metadata
 */
export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  icon?: string;
  permissions?: string[];
  dependencies?: Record<string, string>;
}

/**
 * Plugin context provided to extensions
 */
export interface PluginContext {
  id: string;
  name: string;
  version: string;
  api: ExtensionAPI;
}

/**
 * Main extension API surface
 */
export interface ExtensionAPI {
  /**
   * Get data from the application
   */
  getData: (key: string) => Promise<unknown>;

  /**
   * Set data in the application
   */
  setData: (key: string, value: unknown) => Promise<void>;

  /**
   * Register an event listener
   */
  on: (event: string, handler: EventHandler) => void;

  /**
   * Unregister an event listener
   */
  off: (event: string, handler: EventHandler) => void;

  /**
   * Emit an event
   */
  emit: (event: string, data: unknown) => void;

  /**
   * Call a registered command
   */
  command: (name: string, ...args: unknown[]) => Promise<unknown>;
}

/**
 * Event handler type
 */
export type EventHandler = (data: unknown) => void;

/**
 * Message format for inter-process communication
 */
export interface Message {
  id: string;
  type: "request" | "response" | "event";
  source: string;
  target: string;
  method?: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Extension lifecycle events
 */
export enum ExtensionEvent {
  LOAD = "extension:load",
  UNLOAD = "extension:unload",
  ACTIVATE = "extension:activate",
  DEACTIVATE = "extension:deactivate",
  ERROR = "extension:error",
}

/**
 * Data transfer options
 */
export interface DataTransferOptions {
  /**
   * Serialize circular references
   */
  handleCircular?: boolean;

  /**
   * Maximum depth for nested objects
   */
  maxDepth?: number;

  /**
   * Include metadata about the transfer
   */
  includeMetadata?: boolean;
}

/**
 * Serialized data envelope
 */
export interface SerializedData {
  version: string;
  timestamp: number;
  data: unknown;
  metadata?: Record<string, unknown>;
}
