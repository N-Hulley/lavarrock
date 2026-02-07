import inquirer from "inquirer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { log } from "../lib/logger.js";
import { manifestExists, readManifestFields } from "../lib/manifest.js";
import {
  commandTemplate,
  paneTemplate,
  statusItemTemplate,
  headerActionTemplate,
  languageTemplate,
  renderSlotTemplate,
  componentTemplate,
} from "../lib/templates.js";

const GENERATORS: Record<
  string,
  {
    description: string;
    prompt: () => Promise<{ name: string; [key: string]: unknown }>;
    generate: (
      pluginId: string,
      name: string,
      outDir: string,
    ) => Promise<string>;
  }
> = {
  command: {
    description: "Command handler",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Command name (camelCase):",
          validate: (v: string) => /^[a-z]\w*$/.test(v) || "Must be camelCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(outDir, "src", "resources", "commands", `${name}.ts`);
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, commandTemplate(pluginId, name));
      return path;
    },
  },
  pane: {
    description: "Pane component",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Pane name (PascalCase):",
          validate: (v: string) => /^[A-Z]\w*$/.test(v) || "Must be PascalCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(outDir, "src", "resources", "panes", `${name}.tsx`);
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, paneTemplate(pluginId, name));
      return path;
    },
  },
  "status-item": {
    description: "Status bar item component",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Status item name (PascalCase):",
          validate: (v: string) => /^[A-Z]\w*$/.test(v) || "Must be PascalCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(
        outDir,
        "src",
        "resources",
        "statusItems",
        `${name}.tsx`,
      );
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, statusItemTemplate(pluginId, name));
      return path;
    },
  },
  "header-action": {
    description: "Header action component",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Header action name (PascalCase):",
          validate: (v: string) => /^[A-Z]\w*$/.test(v) || "Must be PascalCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(
        outDir,
        "src",
        "resources",
        "headerActions",
        `${name}.tsx`,
      );
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, headerActionTemplate(pluginId, name));
      return path;
    },
  },
  language: {
    description: "Language / i18n translation file",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Locale code (e.g. en, es, ja):",
          validate: (v: string) =>
            /^[a-z]{2}(-[A-Z]{2})?$/.test(v) || "Must be a valid locale code",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(outDir, "src", "resources", "language", `${name}.ts`);
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, languageTemplate(pluginId, name));
      return path;
    },
  },
  "render-slot": {
    description: "Render slot component",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Render slot name (PascalCase):",
          validate: (v: string) => /^[A-Z]\w*$/.test(v) || "Must be PascalCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(
        outDir,
        "src",
        "resources",
        "renderSlots",
        `${name}.tsx`,
      );
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, renderSlotTemplate(pluginId, name));
      return path;
    },
  },
  component: {
    description: "Reusable UI component",
    prompt: async () =>
      inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Component name (PascalCase):",
          validate: (v: string) => /^[A-Z]\w*$/.test(v) || "Must be PascalCase",
        },
      ]),
    generate: async (pluginId, name, outDir) => {
      const path = join(
        outDir,
        "src",
        "resources",
        "components",
        `${name}.tsx`,
      );
      await mkdir(join(path, ".."), { recursive: true });
      await writeFile(path, componentTemplate(pluginId, name));
      return path;
    },
  },
};

export async function generateCommand(pluginDir: string): Promise<void> {
  log.heading("Generate a resource file");

  let pluginId = "my.plugin";
  if (await manifestExists(pluginDir)) {
    const manifest = await readManifestFields(pluginDir);
    pluginId = manifest.id;
  } else {
    log.warn(
      "No manifest.ts found — generating standalone file. Resource won't be auto-added to manifest.",
    );
  }

  const { type } = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "What to generate:",
      choices: Object.entries(GENERATORS).map(([key, val]) => ({
        name: `${key} — ${val.description}`,
        value: key,
      })),
    },
  ]);

  const generator = GENERATORS[type];
  const answers = await generator.prompt();
  const filePath = await generator.generate(pluginId, answers.name, pluginDir);

  log.success(`Created ${chalk.cyan(filePath)}`);
  log.dim("Don't forget to register this resource in your manifest.ts");
  log.blank();
}
