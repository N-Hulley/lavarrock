/**
 * Data bridge utilities for moving data between app and extensions
 */

import type { DataTransferOptions, SerializedData } from "./types";

/**
 * Serialize data for transmission across extension boundaries
 */
export function serializeData(
  data: unknown,
  options: DataTransferOptions = {},
): SerializedData {
  const {
    handleCircular = true,
    maxDepth = 10,
    includeMetadata = true,
  } = options;

  try {
    // Create a WeakSet to track circular references if needed
    const seen = handleCircular ? new WeakSet<object>() : null;

    const serializedValue = serializeValue(data, 0, maxDepth, seen);

    const result: SerializedData = {
      version: "1.0.0",
      timestamp: Date.now(),
      data: serializedValue,
    };

    if (includeMetadata) {
      result.metadata = {
        hasCircular: seen ? false : undefined,
        depth: maxDepth,
      };
    }

    return result;
  } catch (error) {
    throw new Error(
      `Failed to serialize data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Deserialize data received from extensions
 */
export function deserializeData(envelope: SerializedData): unknown {
  try {
    // Basic deserialization - the data is already deserialized from JSON
    // This function exists for symmetry and potential future enhancements
    return envelope.data;
  } catch (error) {
    throw new Error(
      `Failed to deserialize data: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Clone data safely
 */
export function cloneData(data: unknown, maxDepth: number = 10): unknown {
  return serializeValue(data, 0, maxDepth, new WeakSet());
}

/**
 * Merge data objects
 */
export function mergeData(target: unknown, source: unknown): unknown {
  if (!isPlainObject(target) || !isPlainObject(source)) {
    return source;
  }

  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
        result[key] = mergeData(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}

/**
 * Create a message envelope
 */
export function createMessage(
  id: string,
  type: "request" | "response" | "event",
  source: string,
  target: string,
  data?: unknown,
  method?: string,
) {
  return {
    id,
    type,
    source,
    target,
    method,
    data,
  };
}

/**
 * Create an error response
 */
export function createErrorMessage(
  id: string,
  source: string,
  target: string,
  code: string,
  message: string,
) {
  return {
    id,
    type: "response" as const,
    source,
    target,
    error: {
      code,
      message,
    },
  };
}

// Helper functions

/**
 * Check if value is a plain object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Recursively serialize a value
 */
function serializeValue(
  value: unknown,
  depth: number,
  maxDepth: number,
  seen: WeakSet<object> | null,
): unknown {
  // Check depth limit
  if (depth > maxDepth) {
    return "[max depth exceeded]";
  }

  // Handle primitives
  if (value === null || value === undefined) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  // Handle objects
  if (typeof value === "object") {
    // Check for circular references
    if (seen?.has(value)) {
      return "[circular reference]";
    }

    if (seen) {
      seen.add(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map((item) =>
        serializeValue(item, depth + 1, maxDepth, seen),
      );
    }

    // Handle dates
    if (value instanceof Date) {
      return value.toISOString();
    }

    // Handle maps
    if (value instanceof Map) {
      return Object.fromEntries(
        Array.from(value.entries()).map(([k, v]) => [
          String(k),
          serializeValue(v, depth + 1, maxDepth, seen),
        ]),
      );
    }

    // Handle sets
    if (value instanceof Set) {
      return Array.from(value).map((item) =>
        serializeValue(item, depth + 1, maxDepth, seen),
      );
    }

    // Handle plain objects
    if (isPlainObject(value)) {
      const result: Record<string, unknown> = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          result[key] = serializeValue(value[key], depth + 1, maxDepth, seen);
        }
      }
      return result;
    }

    // For other objects, return string representation
    return Object.prototype.toString.call(value);
  }

  // Handle functions and other types
  return undefined;
}
