import inquirer from "inquirer";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import chalk from "chalk";
import { log } from "../lib/logger.js";
import {
  manifestExists,
  readManifestFields,
  addResourceToManifest,
  addDependencyToManifest,
  addExportToManifest,
  addImportToManifest,
} from "../lib/manifest.js";
import {
  SINGULAR_FORMS,
  CORE_PLUGIN_RESOURCE_TYPES,
  ALL_RESOURCE_TYPES,
} from "../lib/constants.js";
import {
  commandTemplate,
  paneTemplate,
  statusItemTemplate,
  headerActionTemplate,
  languageTemplate,
  renderSlotTemplate,
  componentTemplate,
} from "../lib/templates.js";

// ────────────────────────────────────────────────────────────
//  lavarrock add resource
// ────────────────────────────────────────────────────────────

export async function addResourceCommand(pluginDir: string): Promise<void> {
  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found. Run `lavarrock init` first.");
    process.exit(1);
  }

  const manifest = await readManifestFields(pluginDir);

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Resource type:",
      choices: ALL_RESOURCE_TYPES.map((t) => {
        const dep =
          CORE_PLUGIN_RESOURCE_TYPES[
            t as keyof typeof CORE_PLUGIN_RESOURCE_TYPES
          ];
        return {
          name: dep ? `${t} (requires ${dep})` : t,
          value: t,
        };
      }),
    },
    {
      type: "input",
      name: "name",
      message:
        "Resource name (PascalCase for panes/components, camelCase for commands):",
      validate: (v: string) =>
        /^[a-zA-Z]\w*$/.test(v) || "Must be a valid identifier",
    },
    {
      type: "confirm",
      name: "export",
      message: "Export this resource?",
      default: false,
    },
  ]);

  const { type, name } = answers;
  const singular = SINGULAR_FORMS[type] ?? type;
  const uri = `${manifest.id}://${singular}/${name}`;

  // Generate resource block for manifest
  let block: string;
  let filePath: string | null = null;
  let fileContent: string | null = null;

  switch (type) {
    case "commands":
      block = `{\n        name: "${toDisplayName(name)}",\n        handler: () => import("./resources/commands/${name}"),\n      }`;
      filePath = join(pluginDir, "src", "resources", "commands", `${name}.ts`);
      fileContent = commandTemplate(manifest.id, name);
      break;

    case "panes":
      block = `{\n        name: "${toDisplayName(name)}",\n        icon: "Layout",\n        component: () => import("./resources/panes/${name}"),\n      }`;
      filePath = join(pluginDir, "src", "resources", "panes", `${name}.tsx`);
      fileContent = paneTemplate(manifest.id, name);
      break;

    case "statusItems":
      block = `{\n        name: "${toDisplayName(name)}",\n        icon: "Activity",\n        component: () => import("./resources/statusItems/${name}"),\n        position: "left",\n        priority: 0,\n      }`;
      filePath = join(
        pluginDir,
        "src",
        "resources",
        "statusItems",
        `${name}.tsx`,
      );
      fileContent = statusItemTemplate(manifest.id, name);
      break;

    case "headerActions":
      block = `{\n        name: "${toDisplayName(name)}",\n        icon: "Activity",\n        command: "${manifest.id}://command/${name}",\n        position: "right",\n      }`;
      filePath = join(
        pluginDir,
        "src",
        "resources",
        "headerActions",
        `${name}.tsx`,
      );
      fileContent = headerActionTemplate(manifest.id, name);
      break;

    case "hotkeys":
      block = `{\n        name: "${toDisplayName(name)}",\n        keys: "mod+shift+?",\n        command: "${manifest.id}://command/${name}",\n      }`;
      break;

    case "settings":
      block = `{\n        name: "${toDisplayName(name)}",\n        description: "",\n        schema: z.boolean(),\n        default: false,\n      }`;
      break;

    case "state":
      block = `{\n        default: null,\n        sync: false,\n      }`;
      break;

    case "language":
      block = `{\n        source: () => import("./resources/language/${name}"),\n        ${name === "en" ? "fallback: true," : ""}\n      }`;
      filePath = join(pluginDir, "src", "resources", "language", `${name}.ts`);
      fileContent = languageTemplate(manifest.id, name);
      break;

    case "renderSlots":
      block = `{\n        slot: "content",\n        component: () => import("./resources/renderSlots/${name}"),\n        priority: 0,\n      }`;
      filePath = join(
        pluginDir,
        "src",
        "resources",
        "renderSlots",
        `${name}.tsx`,
      );
      fileContent = renderSlotTemplate(manifest.id, name);
      break;

    case "components":
      block = `{\n        name: "${toDisplayName(name)}",\n        component: () => import("./resources/components/${name}"),\n      }`;
      filePath = join(
        pluginDir,
        "src",
        "resources",
        "components",
        `${name}.tsx`,
      );
      fileContent = componentTemplate(manifest.id, name);
      break;

    case "extensionPoints":
      block = `{\n        description: "TODO: describe what contributors should provide",\n        schema: z.object({}),\n      }`;
      break;

    case "resourceTypes":
      block = `{\n        description: "TODO: describe this custom resource type",\n        schema: z.object({}),\n      }`;
      break;

    default:
      block = `{}`;
  }

  // Write implementation file if needed
  if (filePath && fileContent) {
    const dir = join(filePath, "..");
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, fileContent, "utf-8");
    log.success(`Created ${chalk.cyan(filePath)}`);
  }

  // Update manifest
  await addResourceToManifest(pluginDir, type, name, block);
  log.success(`Added ${chalk.cyan(`${type}.${name}`)} to manifest`);

  // Auto-add dependency for plugin-defined types
  if (type in CORE_PLUGIN_RESOURCE_TYPES) {
    const dep =
      CORE_PLUGIN_RESOURCE_TYPES[
        type as keyof typeof CORE_PLUGIN_RESOURCE_TYPES
      ];
    await addDependencyToManifest(pluginDir, dep, "required");
    log.success(`Added dependency ${chalk.cyan(dep)}`);
  }

  // Export if requested
  if (answers.export) {
    await addExportToManifest(pluginDir, uri);
    log.success(`Exported ${chalk.cyan(uri)}`);
  }

  log.blank();
}

// ────────────────────────────────────────────────────────────
//  lavarrock add dep
// ────────────────────────────────────────────────────────────

export async function addDepCommand(pluginDir: string): Promise<void> {
  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found. Run `lavarrock init` first.");
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "depId",
      message: "Dependency plugin ID:",
      validate: (v: string) =>
        /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(v) ||
        "Must be a valid plugin ID",
    },
    {
      type: "list",
      name: "kind",
      message: "Dependency kind:",
      choices: [
        {
          name: "required — plugin won't activate without it",
          value: "required",
        },
        { name: "optional — enhances behaviour if present", value: "optional" },
      ],
    },
    {
      type: "input",
      name: "imports",
      message: "Import URIs from this dependency (comma-separated, or blank):",
      default: "",
      filter: (v: string) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
    },
  ]);

  await addDependencyToManifest(pluginDir, answers.depId, answers.kind);
  log.success(`Added ${answers.kind} dependency ${chalk.cyan(answers.depId)}`);

  for (const uri of answers.imports) {
    await addImportToManifest(pluginDir, uri);
    log.success(`Added import ${chalk.cyan(uri)}`);
  }

  log.blank();
}

// ────────────────────────────────────────────────────────────
//  lavarrock add extension-point
// ────────────────────────────────────────────────────────────

export async function addExtensionPointCommand(
  pluginDir: string,
): Promise<void> {
  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found. Run `lavarrock init` first.");
    process.exit(1);
  }

  const manifest = await readManifestFields(pluginDir);

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "name",
      message: "Extension point name (camelCase):",
      validate: (v: string) =>
        /^[a-z]\w*$/.test(v) || "Must be a valid camelCase identifier",
    },
    {
      type: "input",
      name: "description",
      message: "Description (what should contributors provide?):",
    },
    {
      type: "confirm",
      name: "export",
      message: "Export this extension point?",
      default: true,
    },
  ]);

  const block = `{\n        description: "${answers.description}",\n        schema: z.object({\n          // TODO: define the contribution schema\n        }),\n      }`;

  await addResourceToManifest(
    pluginDir,
    "extensionPoints",
    answers.name,
    block,
  );
  log.success(`Added extension point ${chalk.cyan(answers.name)} to manifest`);

  if (answers.export) {
    const uri = `${manifest.id}://extensionPoint/${answers.name}`;
    await addExportToManifest(pluginDir, uri);
    log.success(`Exported ${chalk.cyan(uri)}`);
  }

  log.blank();
}

// ────────────────────────────────────────────────────────────
//  lavarrock add modification
// ────────────────────────────────────────────────────────────

export async function addModificationCommand(pluginDir: string): Promise<void> {
  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found. Run `lavarrock init` first.");
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "type",
      message: "Modification type:",
      choices: [
        { name: "wrap — wrap a pane with an HOC", value: "wrap" },
        { name: "intercept — intercept a command", value: "intercept" },
        {
          name: "transformRead — transform state on read",
          value: "transformRead",
        },
        { name: "replace — replace a pane entirely", value: "replace" },
        {
          name: "injectProps — inject extra props into a pane",
          value: "injectProps",
        },
        { name: "addResource — add a sub-resource", value: "addResource" },
      ],
    },
    {
      type: "input",
      name: "target",
      message: "Target resource URI (e.g. lavarrock.editor://pane/Editor):",
      validate: (v: string) =>
        /^[a-z][a-z0-9.]*:\/\/\w+\/\w+/.test(v) ||
        "Must be a valid resource URI",
    },
    {
      type: "input",
      name: "description",
      message: "Description (shown to user on install):",
    },
    {
      type: "input",
      name: "when",
      message: "Condition expression (or blank for always active):",
      default: "",
    },
  ]);

  // We need to append to the modifications array in manifest.ts
  const { readFile: rf, writeFile: wf } = await import("node:fs/promises");
  const manifestPath = join(pluginDir, "src", "manifest.ts");
  let content = await rf(manifestPath, "utf-8");

  const modEntry = [
    `{`,
    `      type: "${answers.type}",`,
    `      target: "${answers.target}",`,
    `      description: "${answers.description}",`,
    answers.when ? `      when: "${answers.when}",` : null,
    `      // TODO: implement the modification handler`,
    `    }`,
  ]
    .filter(Boolean)
    .join("\n");

  // Insert into modifications array
  const modMatch = content.match(/(modifications:\s*\[)/m);
  if (modMatch) {
    const insertPoint = modMatch.index! + modMatch[0].length;
    content =
      content.slice(0, insertPoint) +
      `\n    ${modEntry},` +
      content.slice(insertPoint);
    await wf(manifestPath, content, "utf-8");
  }

  log.success(
    `Added ${chalk.cyan(answers.type)} modification targeting ${chalk.cyan(answers.target)}`,
  );
  log.blank();
}

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────

function toDisplayName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
