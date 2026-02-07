import { Command } from "commander";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { log } from "./lib/logger.js";
import { initCommand } from "./commands/init.js";
import {
  addResourceCommand,
  addDepCommand,
  addExtensionPointCommand,
  addModificationCommand,
} from "./commands/add.js";
import { verifyCommand } from "./commands/verify.js";
import { validateCommand } from "./commands/validate.js";
import { generateCommand } from "./commands/generate.js";
import { infoCommand } from "./commands/info.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getVersion(): Promise<string> {
  try {
    const pkg = JSON.parse(
      await readFile(join(__dirname, "..", "package.json"), "utf-8"),
    );
    return pkg.version;
  } catch {
    return "0.0.0";
  }
}

export async function run(argv: string[] = process.argv): Promise<void> {
  const version = await getVersion();
  const program = new Command();

  program
    .name("lavarrock")
    .description("CLI toolkit for Lavarrock plugin development")
    .version(version);

  // ── lavarrock init ──────────────────────────────
  program
    .command("init")
    .description("Scaffold a new plugin with interactive wizard")
    .action(async () => {
      try {
        await initCommand();
      } catch (err) {
        handleError(err);
      }
    });

  // ── lavarrock add ───────────────────────────────
  const add = program
    .command("add")
    .description(
      "Add resources, dependencies, extension points, or modifications",
    );

  add
    .command("resource")
    .description("Add a new resource to the plugin")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await addResourceCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  add
    .command("dep")
    .alias("dependency")
    .description("Add a plugin dependency")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await addDepCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  add
    .command("extension-point")
    .alias("ext")
    .description("Add an extension point")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await addExtensionPointCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  add
    .command("modification")
    .alias("mod")
    .description("Add a modification (wrap, intercept, etc.)")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await addModificationCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  // ── lavarrock verify ────────────────────────────
  program
    .command("verify")
    .description("Verify SHA-384 integrity of built plugin files")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await verifyCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  // ── lavarrock validate ──────────────────────────
  program
    .command("validate")
    .description("Validate plugin manifest against the spec")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await validateCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  // ── lavarrock generate ──────────────────────────
  program
    .command("generate")
    .alias("gen")
    .description("Generate a standalone resource file from a template")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await generateCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  // ── lavarrock info ──────────────────────────────
  program
    .command("info")
    .description("Display plugin metadata from manifest")
    .argument("[dir]", "Plugin directory", ".")
    .action(async (dir: string) => {
      try {
        await infoCommand(resolve(dir));
      } catch (err) {
        handleError(err);
      }
    });

  await program.parseAsync(argv);
}

function handleError(err: unknown): void {
  if (err instanceof Error) {
    log.error(err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
  } else {
    log.error(String(err));
  }
  process.exit(1);
}

// Auto-run when executed directly
run();
