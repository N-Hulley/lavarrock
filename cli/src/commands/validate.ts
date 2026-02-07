import chalk from "chalk";
import ora from "ora";
import { readFile, access } from "node:fs/promises";
import { join } from "node:path";
import { log } from "../lib/logger.js";
import { manifestExists, readManifestFields } from "../lib/manifest.js";
import {
  REQUIRED_EXTERNALS,
  SINGULAR_FORMS,
  CORE_PLUGIN_RESOURCE_TYPES,
} from "../lib/constants.js";

interface Issue {
  severity: "error" | "warn";
  message: string;
}

export async function validateCommand(pluginDir: string): Promise<void> {
  log.heading("Validate plugin manifest");

  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found in src/. Is this a plugin directory?");
    process.exit(1);
  }

  const spinner = ora("Parsing manifest…").start();
  const manifest = await readManifestFields(pluginDir);
  spinner.succeed("Manifest parsed");

  const issues: Issue[] = [];

  // ─── Identity ───────────────────────────────────
  if (!manifest.id) {
    issues.push({ severity: "error", message: "Missing 'id' field" });
  } else if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(manifest.id)) {
    issues.push({
      severity: "error",
      message: `Invalid plugin ID "${manifest.id}" — must be dot-separated lowercase`,
    });
  }

  if (!manifest.name) {
    issues.push({ severity: "error", message: "Missing 'name' field" });
  }

  if (!manifest.version) {
    issues.push({ severity: "error", message: "Missing 'version' field" });
  }

  if (!manifest.author) {
    issues.push({ severity: "warn", message: "Missing 'author' field" });
  }

  // ─── Dependencies ──────────────────────────────
  // Check that plugin-defined resource types have their defining plugin as a dependency
  for (const rt of Object.keys(manifest.resources)) {
    if (rt in CORE_PLUGIN_RESOURCE_TYPES) {
      const dep =
        CORE_PLUGIN_RESOURCE_TYPES[
          rt as keyof typeof CORE_PLUGIN_RESOURCE_TYPES
        ];
      if (!manifest.dependencies.required.includes(dep)) {
        issues.push({
          severity: "error",
          message: `Uses "${rt}" resource type but doesn't declare "${dep}" as a required dependency`,
        });
      }
    }
  }

  // ─── Exports reference valid resources ──────────
  for (const uri of manifest.exports) {
    if (uri.includes("*")) continue; // wildcard exports are fine
    const match = uri.match(/^([^:]+):\/\/(\w+)\/(\w+)/);
    if (!match) {
      issues.push({
        severity: "warn",
        message: `Export URI doesn't match expected format: "${uri}"`,
      });
      continue;
    }
    const [, pluginId, singular, resourceName] = match;
    if (pluginId !== manifest.id) {
      issues.push({
        severity: "error",
        message: `Cannot export another plugin's resource: "${uri}"`,
      });
    }
    // Find the plural form
    const plural = Object.entries(SINGULAR_FORMS).find(
      ([, s]) => s === singular,
    )?.[0];
    if (
      plural &&
      manifest.resources[plural] &&
      !manifest.resources[plural].includes(resourceName)
    ) {
      issues.push({
        severity: "warn",
        message: `Export references non-existent resource: "${uri}"`,
      });
    }
  }

  // ─── Imports should have matching dependencies ──
  for (const uri of manifest.imports) {
    const match = uri.match(/^([^:]+):\/\//);
    if (match) {
      const depId = match[1];
      if (
        depId !== manifest.id &&
        !manifest.dependencies.required.includes(depId) &&
        !manifest.dependencies.optional.includes(depId)
      ) {
        issues.push({
          severity: "warn",
          message: `Imports from "${depId}" but it's not listed in dependencies`,
        });
      }
    }
  }

  // ─── Hotkeys should reference valid commands ────
  const hotkeyResources = manifest.resources["hotkeys"] ?? [];
  // Read manifest to check hotkey commands reference existing commands
  if (hotkeyResources.length > 0 && manifest.resources["commands"]) {
    const manifestContent = await readFile(
      join(pluginDir, "src", "manifest.ts"),
      "utf-8",
    );
    for (const hk of hotkeyResources) {
      const commandRef = manifestContent.match(
        new RegExp(`${hk}:[\\s\\S]*?command:\\s*"([^"]+)"`, "m"),
      );
      if (commandRef) {
        const cmdUri = commandRef[1];
        if (cmdUri.startsWith(manifest.id)) {
          const cmdName = cmdUri.split("/").pop();
          if (cmdName && !manifest.resources["commands"]?.includes(cmdName)) {
            issues.push({
              severity: "warn",
              message: `Hotkey "${hk}" references command "${cmdUri}" which doesn't exist`,
            });
          }
        }
      }
    }
  }

  // ─── package.json checks ───────────────────────
  try {
    const pkgRaw = await readFile(join(pluginDir, "package.json"), "utf-8");
    const pkg = JSON.parse(pkgRaw);

    if (pkg.type !== "module") {
      issues.push({
        severity: "error",
        message: 'package.json must have "type": "module"',
      });
    }

    if (!pkg.lavarrock?.pluginId) {
      issues.push({
        severity: "error",
        message: "package.json missing lavarrock.pluginId field",
      });
    } else if (pkg.lavarrock.pluginId !== manifest.id) {
      issues.push({
        severity: "error",
        message: `package.json pluginId "${pkg.lavarrock.pluginId}" doesn't match manifest id "${manifest.id}"`,
      });
    }

    // Check externals aren't in dependencies
    const deps = {
      ...pkg.dependencies,
    };
    for (const ext of REQUIRED_EXTERNALS) {
      if (ext in deps) {
        issues.push({
          severity: "error",
          message: `"${ext}" must be in peerDependencies, not dependencies (it's provided by the host)`,
        });
      }
    }

    // Check peerDependencies
    const peers = pkg.peerDependencies ?? {};
    for (const ext of ["react", "react-dom", "@lavarrock/plugin-sdk"]) {
      if (!(ext in peers)) {
        issues.push({
          severity: "warn",
          message: `Missing peerDependency: "${ext}"`,
        });
      }
    }
  } catch {
    issues.push({
      severity: "warn",
      message: "Could not read or parse package.json",
    });
  }

  // ─── Print results ─────────────────────────────
  log.blank();

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  if (errors.length > 0) {
    log.heading("Errors");
    for (const err of errors) {
      log.error(err.message);
    }
  }

  if (warnings.length > 0) {
    log.heading("Warnings");
    for (const warn of warnings) {
      log.warn(warn.message);
    }
  }

  if (issues.length === 0) {
    log.success("Manifest is valid — no issues found");
    log.blank();
    log.table([
      ["Plugin ID", chalk.cyan(manifest.id)],
      ["Version", manifest.version],
      ["Resources", Object.keys(manifest.resources).join(", ") || "(none)"],
      ["Exports", String(manifest.exports.length)],
      ["Imports", String(manifest.imports.length)],
      [
        "Dependencies",
        String(
          manifest.dependencies.required.length +
            manifest.dependencies.optional.length,
        ),
      ],
    ]);
  } else {
    log.blank();
    log.dim(`${errors.length} error(s), ${warnings.length} warning(s)`);
  }

  log.blank();

  if (errors.length > 0) {
    process.exit(1);
  }
}
