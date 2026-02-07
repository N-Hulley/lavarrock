import { z } from "zod";

/**
 * Zod schema for validating PaneManifest objects.
 */

const ComponentConfigSchema = z.object({
  type: z.enum(["builtin", "react"]),
  source: z.string().min(1, "Component source is required"),
});

const LifecycleHooksSchema = z.object({
  onActivate: z.string().optional(),
  onDeactivate: z.string().optional(),
  onSettings: z.string().optional(),
});

const StateAccessSchema = z.object({
  namespace: z.string().optional(),
  exports: z.array(z.string()).optional(),
  allowRead: z.array(z.string()).optional(),
  allowWrite: z.array(z.string()).optional(),
});

export const PaneManifestSchema = z.object({
  id: z.string().min(1, "Plugin ID is required"),
  version: z
    .string()
    .regex(
      /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/,
      "Version must be valid semver (e.g., 1.0.0)",
    ),
  name: z.string().min(1, "Plugin name is required"),
  author: z.string().min(1, "Author is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  kind: z.enum(["content", "extension"]),
  defaultDock: z.enum(["left", "main", "right", "bottom"]),
  component: ComponentConfigSchema,
  permissions: z.array(z.string()).optional(),
  styles: z.string().optional(),
  hooks: LifecycleHooksSchema.optional(),
  isCore: z.boolean().optional(),
  state: StateAccessSchema.optional(),
});

export type ValidatedPaneManifest = z.infer<typeof PaneManifestSchema>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

/**
 * Validate a PaneManifest object.
 */
export function validatePaneManifest(
  manifest: unknown,
): ValidationResult<ValidatedPaneManifest> {
  const result = PaneManifestSchema.safeParse(manifest);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    ),
  };
}
