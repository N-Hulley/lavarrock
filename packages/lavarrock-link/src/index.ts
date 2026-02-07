/**
 * @lavarrock/link - Extension Bridge Package
 *
 * This package provides the interface between Lavarrock and its extensions.
 * It includes type definitions, validation utilities, and data transfer helpers.
 */

// Type exports
export type {
  ExtensionManifest,
  PluginContext,
  ExtensionAPI,
  EventHandler,
  Message,
  DataTransferOptions,
  SerializedData,
} from "./types";

export { ExtensionEvent } from "./types";

// Validation exports
export {
  validateManifest,
  validateMessage,
  parseManifest,
  parseMessage,
  isType,
  TypeValidators,
  ExtensionManifestSchema,
  MessageSchema,
} from "./validate";

// Bridge/utility exports
export {
  serializeData,
  deserializeData,
  cloneData,
  mergeData,
  createMessage,
  createErrorMessage,
} from "./bridge";
