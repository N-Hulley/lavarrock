import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import { log } from "./logger.js";

/**
 * Compute SHA-384 hash of a buffer, returning the prefixed string.
 */
export function computeSHA384(buffer: Buffer): string {
  const hash = createHash("sha384").update(buffer).digest("base64");
  return `sha384-${hash}`;
}

/**
 * Compute SHA-384 hashes for all files in a directory.
 */
export async function hashDirectory(
  dir: string,
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  const entries = await readdir(dir, { recursive: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const s = await stat(fullPath);
    if (!s.isFile()) continue;

    const buffer = await readFile(fullPath);
    const relPath = relative(dir, fullPath);
    hashes[relPath] = computeSHA384(buffer);
  }

  return hashes;
}

/**
 * Verify integrity of a plugin's dist/ directory against plugin-meta.json.
 * Returns a list of issues (empty = all good).
 */
export async function verifyIntegrity(
  pluginDir: string,
): Promise<VerifyResult> {
  const metaPath = join(pluginDir, "dist", "plugin-meta.json");
  const distDir = join(pluginDir, "dist");

  let metaRaw: string;
  try {
    metaRaw = await readFile(metaPath, "utf-8");
  } catch {
    return {
      valid: false,
      issues: [`plugin-meta.json not found at ${metaPath}`],
      checked: 0,
    };
  }

  const meta = JSON.parse(metaRaw);
  if (!meta.integrity || typeof meta.integrity !== "object") {
    return {
      valid: false,
      issues: ["plugin-meta.json is missing 'integrity' field"],
      checked: 0,
    };
  }

  const issues: string[] = [];
  let checked = 0;

  // Check every file listed in integrity
  for (const [filePath, expectedHash] of Object.entries(meta.integrity)) {
    const fullPath = join(distDir, filePath);

    try {
      const buffer = await readFile(fullPath);
      const actualHash = computeSHA384(buffer);
      checked++;

      if (actualHash !== expectedHash) {
        issues.push(
          `MISMATCH ${filePath}\n` +
            `  expected: ${expectedHash}\n` +
            `  actual:   ${actualHash}`,
        );
      }
    } catch {
      issues.push(
        `MISSING ${filePath} — listed in integrity but not found on disk`,
      );
    }
  }

  // Check for files in dist/ not listed in integrity
  const actualHashes = await hashDirectory(distDir);
  for (const filePath of Object.keys(actualHashes)) {
    if (filePath === "plugin-meta.json") continue; // meta isn't in its own integrity
    if (filePath === "plugin-api.d.ts") continue; // types aren't hashed
    if (!(filePath in meta.integrity)) {
      issues.push(
        `UNLISTED ${filePath} — exists in dist/ but not in integrity`,
      );
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    checked,
  };
}

export interface VerifyResult {
  valid: boolean;
  issues: string[];
  checked: number;
}

/**
 * Generate a plugin-meta.json structure from dist/ files and manifest data.
 */
export async function generatePluginMeta(
  pluginDir: string,
  meta: {
    pluginId: string;
    version: string;
    sdk: string;
    exports: string[];
    resources: Record<string, string[]>;
  },
): Promise<object> {
  const distDir = join(pluginDir, "dist");
  const hashes = await hashDirectory(distDir);

  // Remove plugin-meta.json and .d.ts from integrity hashes
  delete hashes["plugin-meta.json"];
  for (const key of Object.keys(hashes)) {
    if (key.endsWith(".d.ts")) delete hashes[key];
  }

  return {
    pluginId: meta.pluginId,
    version: meta.version,
    sdk: meta.sdk,
    integrity: hashes,
    exports: meta.exports,
    resources: meta.resources,
  };
}
