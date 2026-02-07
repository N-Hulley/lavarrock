import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

/**
 * Reads the raw text of a plugin's manifest.ts and extracts key fields
 * using regex (since we can't import TS at CLI time without a build).
 */
export async function readManifestFields(
  pluginDir: string,
): Promise<ManifestFields> {
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  const content = await readFile(manifestPath, "utf-8");
  return parseManifestContent(content);
}

/**
 * Checks if a manifest.ts exists in the given directory.
 */
export async function manifestExists(pluginDir: string): Promise<boolean> {
  try {
    await access(join(pluginDir, "src", "manifest.ts"));
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse manifest content to extract key fields.
 * Uses regex since we operate on TypeScript source text.
 */
export function parseManifestContent(content: string): ManifestFields {
  const str = (pattern: RegExp): string | undefined => {
    const match = content.match(pattern);
    return match?.[1];
  };

  const arr = (pattern: RegExp): string[] => {
    const match = content.match(pattern);
    if (!match?.[1]) return [];
    return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  };

  const id = str(/id:\s*"([^"]+)"/) ?? "";
  const version = str(/version:\s*"([^"]+)"/) ?? "1.0.0";
  const name = str(/name:\s*"([^"]+)"/) ?? "";
  const author = str(/author:\s*"([^"]+)"/) ?? "";
  const description = str(/description:\s*"([^"]+)"/) ?? "";
  const icon = str(/icon:\s*"([^"]+)"/);
  const fetchCondition = str(/fetchCondition:\s*"([^"]+)"/);

  // Parse exports array
  const exportsMatch = content.match(/exports:\s*\[([\s\S]*?)\]/);
  const exports = exportsMatch
    ? [...exportsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];

  // Parse imports array
  const importsMatch = content.match(/imports:\s*\[([\s\S]*?)\]/);
  const imports = importsMatch
    ? [...importsMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];

  // Parse dependencies
  const requiredMatch = content.match(/required:\s*\[([\s\S]*?)\]/);
  const required = requiredMatch
    ? [...requiredMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];

  const optionalMatch = content.match(/optional:\s*\[([\s\S]*?)\]/);
  const optional = optionalMatch
    ? [...optionalMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
    : [];

  // Parse resource type keys from the resources block
  const resourcesMatch = content.match(/resources:\s*\{([\s\S]*?)\n  \}/);
  const resourceTypes: string[] = [];
  if (resourcesMatch) {
    const block = resourcesMatch[1];
    const keys = [...block.matchAll(/^\s{4}(\w+):\s*\{/gm)];
    for (const k of keys) {
      resourceTypes.push(k[1]);
    }
  }

  // Parse resource names per type
  const resources: Record<string, string[]> = {};
  for (const type of resourceTypes) {
    const typeBlockMatch = content.match(
      new RegExp(`${type}:\\s*\\{([\\s\\S]*?)\\n    \\}`, "m"),
    );
    if (typeBlockMatch) {
      const names = [...typeBlockMatch[1].matchAll(/^\s{6}(\w+):\s*\{/gm)].map(
        (m) => m[1],
      );
      resources[type] = names;
    }
  }

  const loadPriority = str(/loadPriority:\s*(\d+)/);

  return {
    id,
    version,
    name,
    author,
    description,
    icon,
    fetchCondition,
    exports,
    imports,
    dependencies: { required, optional },
    resources,
    resourceTypes,
    loadPriority: loadPriority ? parseInt(loadPriority, 10) : 0,
  };
}

export interface ManifestFields {
  id: string;
  version: string;
  name: string;
  author: string;
  description: string;
  icon?: string;
  fetchCondition?: string;
  exports: string[];
  imports: string[];
  dependencies: {
    required: string[];
    optional: string[];
  };
  resources: Record<string, string[]>;
  resourceTypes: string[];
  loadPriority: number;
}

/**
 * Inject a new resource block into an existing manifest.ts.
 * Inserts inside the `resources: { ... }` block.
 */
export async function addResourceToManifest(
  pluginDir: string,
  resourceType: string,
  resourceName: string,
  resourceBlock: string,
): Promise<void> {
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  let content = await readFile(manifestPath, "utf-8");

  // Check if this resource type already exists
  const typeRegex = new RegExp(`(${resourceType}:\\s*\\{)`, "m");
  const typeMatch = content.match(typeRegex);

  if (typeMatch) {
    // Add to existing resource type block
    const insertPoint = typeMatch.index! + typeMatch[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n      ${resourceName}: ${resourceBlock},` +
      content.slice(insertPoint);
  } else {
    // Add new resource type block inside resources
    const resourcesMatch = content.match(/(resources:\s*\{)/m);
    if (!resourcesMatch) {
      throw new Error("Could not find resources block in manifest.ts");
    }
    const insertPoint = resourcesMatch.index! + resourcesMatch[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n    ${resourceType}: {\n      ${resourceName}: ${resourceBlock},\n    },` +
      content.slice(insertPoint);
  }

  await writeFile(manifestPath, content, "utf-8");
}

/**
 * Add a dependency to the manifest's dependencies block.
 */
export async function addDependencyToManifest(
  pluginDir: string,
  depId: string,
  kind: "required" | "optional",
): Promise<void> {
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  let content = await readFile(manifestPath, "utf-8");

  // Check if already listed
  if (content.includes(`"${depId}"`)) {
    return; // Already present
  }

  const regex = new RegExp(`(${kind}:\\s*\\[)`, "m");
  const match = content.match(regex);

  if (match) {
    const insertPoint = match.index! + match[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n      "${depId}",` +
      content.slice(insertPoint);
  } else {
    throw new Error(`Could not find dependencies.${kind} array in manifest.ts`);
  }

  await writeFile(manifestPath, content, "utf-8");
}

/**
 * Add an import URI to the manifest's imports array.
 */
export async function addImportToManifest(
  pluginDir: string,
  uri: string,
): Promise<void> {
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  let content = await readFile(manifestPath, "utf-8");

  if (content.includes(`"${uri}"`)) return;

  const match = content.match(/(imports:\s*\[)/m);
  if (match) {
    const insertPoint = match.index! + match[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n    "${uri}",` +
      content.slice(insertPoint);
  }

  await writeFile(manifestPath, content, "utf-8");
}

/**
 * Add an export URI to the manifest's exports array.
 */
export async function addExportToManifest(
  pluginDir: string,
  uri: string,
): Promise<void> {
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  let content = await readFile(manifestPath, "utf-8");

  if (content.includes(`"${uri}"`)) return;

  const match = content.match(/(exports:\s*\[)/m);
  if (match) {
    const insertPoint = match.index! + match[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n    "${uri}",` +
      content.slice(insertPoint);
  }

  await writeFile(manifestPath, content, "utf-8");
}
