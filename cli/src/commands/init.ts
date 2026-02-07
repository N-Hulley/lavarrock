import inquirer from "inquirer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import ora from "ora";
import chalk from "chalk";
import { log } from "../lib/logger.js";
import {
  CHANNELS,
  ALL_RESOURCE_TYPES,
  CORE_PLUGIN_RESOURCE_TYPES,
} from "../lib/constants.js";
import {
  packageJsonTemplate,
  tsconfigTemplate,
  viteConfigTemplate,
  manifestTemplate,
  indexTemplate,
  languageTemplate,
  type PluginContext,
} from "../lib/templates.js";

interface InitAnswers {
  id: string;
  name: string;
  author: string;
  description: string;
  icon: string;
  channel: string;
  resourceTypes: string[];
  requiredDeps: string[];
  optionalDeps: string[];
  outputDir: string;
}

export async function initCommand(outputDir?: string): Promise<void> {
  log.heading("Create a new Lavarrock plugin");
  log.dim("Answer the prompts below to scaffold a new plugin package.\n");

  const answers = await inquirer.prompt<InitAnswers>([
    {
      type: "input",
      name: "id",
      message: "Plugin ID (reverse-domain style):",
      default: "my.plugin",
      validate: (v: string) =>
        /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(v) ||
        "Must be dot-separated lowercase (e.g. my.awesome.plugin)",
    },
    {
      type: "input",
      name: "name",
      message: "Display name:",
      default: (a: InitAnswers) =>
        a.id
          .split(".")
          .pop()!
          .replace(/^./, (c) => c.toUpperCase()),
    },
    {
      type: "input",
      name: "author",
      message: "Author:",
      default: "Lavarrock",
    },
    {
      type: "input",
      name: "description",
      message: "Description:",
      default: (a: InitAnswers) => `${a.name} plugin for Lavarrock`,
    },
    {
      type: "input",
      name: "icon",
      message: "Icon (Lucide icon name):",
      default: "Puzzle",
    },
    {
      type: "list",
      name: "channel",
      message: "Channel:",
      choices: CHANNELS.map((c) => ({
        name:
          c === "core"
            ? "core (ships with Lavarrock)"
            : c === "community"
              ? "community (published to registry)"
              : "local (development / private)",
        value: c,
      })),
      default: "community",
    },
    {
      type: "checkbox",
      name: "resourceTypes",
      message: "Resource types to scaffold:",
      choices: [
        new inquirer.Separator("── Built-in types ──"),
        { name: "commands", checked: true },
        { name: "hotkeys" },
        { name: "settings" },
        { name: "state", checked: true },
        { name: "language" },
        { name: "extensionPoints" },
        { name: "renderSlots" },
        { name: "resourceTypes" },
        { name: "assets" },
        { name: "menus" },
        new inquirer.Separator("── Plugin-defined types (adds dependency) ──"),
        { name: "panes (requires lavarrock.wm)", value: "panes" },
        { name: "components (requires lavarrock.ui)", value: "components" },
        {
          name: "statusItems (requires lavarrock.footer)",
          value: "statusItems",
        },
        {
          name: "headerActions (requires lavarrock.header)",
          value: "headerActions",
        },
      ],
    },
    {
      type: "input",
      name: "requiredDeps",
      message: "Required dependencies (comma-separated plugin IDs, or blank):",
      default: "",
      filter: (v: string) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: "input",
      name: "optionalDeps",
      message: "Optional dependencies (comma-separated plugin IDs, or blank):",
      default: "",
      filter: (v: string) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    },
    {
      type: "input",
      name: "outputDir",
      message: "Output directory:",
      default: (a: InitAnswers) =>
        outputDir ??
        (a.channel === "core"
          ? `packages/plugins/${a.id.replace(/\./g, "-")}`
          : a.id.replace(/\./g, "-")),
    },
  ]);

  // Auto-add required deps for plugin-defined resource types
  const requiredDeps = [...answers.requiredDeps];
  for (const rt of answers.resourceTypes) {
    if (rt in CORE_PLUGIN_RESOURCE_TYPES) {
      const dep =
        CORE_PLUGIN_RESOURCE_TYPES[
          rt as keyof typeof CORE_PLUGIN_RESOURCE_TYPES
        ];
      if (!requiredDeps.includes(dep)) {
        requiredDeps.push(dep);
      }
    }
  }
  // Always include lavarrock.ui if using namespace-as-component
  if (
    answers.resourceTypes.some((r) =>
      ["panes", "statusItems", "headerActions"].includes(r),
    ) &&
    !requiredDeps.includes("lavarrock.ui")
  ) {
    requiredDeps.push("lavarrock.ui");
  }

  const ctx: PluginContext = {
    id: answers.id,
    name: answers.name,
    author: answers.author,
    description: answers.description,
    icon: answers.icon,
    channel: answers.channel as PluginContext["channel"],
    packageName:
      answers.channel === "core"
        ? `@lavarrock/plugin-${answers.id.replace("lavarrock.", "")}`
        : answers.id.replace(/\./g, "-"),
    resourceTypes: answers.resourceTypes,
    requiredDeps,
    optionalDeps: answers.optionalDeps,
  };

  const spinner = ora("Scaffolding plugin…").start();
  const root = answers.outputDir;

  try {
    // Create directory structure
    await mkdir(join(root, "src", "resources", "commands"), {
      recursive: true,
    });
    await mkdir(join(root, "src", "resources", "panes"), { recursive: true });
    await mkdir(join(root, "src", "resources", "language"), {
      recursive: true,
    });
    await mkdir(join(root, "src", "resources", "settings"), {
      recursive: true,
    });
    await mkdir(join(root, "src", "resources", "statusItems"), {
      recursive: true,
    });
    await mkdir(join(root, "src", "resources", "headerActions"), {
      recursive: true,
    });
    await mkdir(join(root, "src", "resources", "assets"), { recursive: true });
    await mkdir(join(root, "src", "hooks"), { recursive: true });
    await mkdir(join(root, "src", "lib"), { recursive: true });
    await mkdir(join(root, "__tests__"), { recursive: true });

    // Write files
    const files: [string, string][] = [
      ["package.json", packageJsonTemplate(ctx)],
      ["tsconfig.json", tsconfigTemplate()],
      ["vite.config.ts", viteConfigTemplate()],
      ["src/manifest.ts", manifestTemplate(ctx)],
      ["src/index.tsx", indexTemplate(ctx)],
    ];

    // Add language template if selected
    if (answers.resourceTypes.includes("language")) {
      files.push([
        "src/resources/language/en.ts",
        languageTemplate(ctx.id, "en"),
      ]);
    }

    for (const [path, content] of files) {
      await writeFile(join(root, path), content, "utf-8");
    }

    // .gitignore
    await writeFile(
      join(root, ".gitignore"),
      "node_modules/\ndist/\n*.tsbuildinfo\n",
      "utf-8",
    );

    spinner.succeed("Plugin scaffolded successfully!");
    log.blank();

    // Summary
    log.heading("Summary");
    log.table([
      ["Plugin ID", chalk.cyan(ctx.id)],
      ["Package", chalk.cyan(ctx.packageName)],
      ["Channel", ctx.channel],
      ["Directory", root],
      ["Resources", ctx.resourceTypes.join(", ") || "(none)"],
      ["Required deps", requiredDeps.join(", ") || "(none)"],
      ["Optional deps", ctx.optionalDeps.join(", ") || "(none)"],
    ]);

    log.blank();
    log.heading("Next steps");
    log.list([
      `cd ${root}`,
      `npm install`,
      `Edit ${chalk.cyan("src/manifest.ts")} to add resources`,
      `npm run dev   ${chalk.dim("— build in watch mode")}`,
      `npm run build ${chalk.dim("— production build")}`,
    ]);
    log.blank();
  } catch (err) {
    spinner.fail("Failed to scaffold plugin");
    log.error(String(err));
    process.exit(1);
  }
}
