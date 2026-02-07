/**
 * Runtime validation schemas and utilities
 */

import { z } from "zod";
import type { ExtensionManifest, Message } from "./types";

/**
 * Zod schema for ExtensionManifest validation
 */
export const ExtensionManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  description: z.string().optional(),
  author: z.string().optional(),
  icon: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  dependencies: z.record(z.string()).optional(),
});

/**
 * Zod schema for Message validation
 */
export const MessageSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["request", "response", "event"]),
  source: z.string().min(1),
  target: z.string().min(1),
  method: z.string().optional(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
    })
    .optional(),
});

/**
 * Validate an extension manifest
 */
export function validateManifest(data: unknown): data is ExtensionManifest {
  return ExtensionManifestSchema.safeParse(data).success;
}

/**
 * Validate a message
 */
export function validateMessage(data: unknown): data is Message {
  return MessageSchema.safeParse(data).success;
}

/**
 * Parse and validate a manifest, throwing on error
 */
export function parseManifest(data: unknown): ExtensionManifest {
  return ExtensionManifestSchema.parse(data);
}

/**
 * Parse and validate a message, throwing on error
 */
export function parseMessage(data: unknown): Message {
  return MessageSchema.parse(data);
}

/**
 * Validate data types
 */
export const TypeValidators = {
  isString: (value: unknown): value is string => typeof value === "string",
  isNumber: (value: unknown): value is number => typeof value === "number",
  isBoolean: (value: unknown): value is boolean => typeof value === "boolean",
  isObject: (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  isArray: (value: unknown): value is unknown[] => Array.isArray(value),
  isNullable: (value: unknown): value is null | undefined =>
    value === null || value === undefined,
};

/**
 * Type guard for checking if value matches a specific type
 */
export function isType(value: unknown, type: string): boolean {
  switch (type.toLowerCase()) {
    case "string":
      return TypeValidators.isString(value);
    case "number":
      return TypeValidators.isNumber(value);
    case "boolean":
      return TypeValidators.isBoolean(value);
    case "object":
      return TypeValidators.isObject(value);
    case "array":
      return TypeValidators.isArray(value);
    case "null":
      return value === null;
    case "undefined":
      return value === undefined;
    default:
      return false;
  }
}
