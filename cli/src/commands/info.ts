import chalk from "chalk";
import { log } from "../lib/logger.js";
import { manifestExists, readManifestFields } from "../lib/manifest.js";
import { SINGULAR_FORMS } from "../lib/constants.js";

export async function infoCommand(pluginDir: string): Promise<void> {
  if (!(await manifestExists(pluginDir))) {
    log.error("No manifest.ts found in src/. Is this a plugin directory?");
    process.exit(1);
  }

  const m = await readManifestFields(pluginDir);

  log.heading(`${m.name || m.id}`);

  log.table([
    ["Plugin ID", chalk.cyan(m.id)],
    ["Version", m.version],
    ["Author", m.author || chalk.dim("(not set)")],
    ["Description", m.description || chalk.dim("(not set)")],
    ["Icon", m.icon || chalk.dim("(not set)")],
    ["Load Priority", String(m.loadPriority)],
    ...(m.fetchCondition
      ? [
          ["Fetch Condition", chalk.yellow(m.fetchCondition)] as [
            string,
            string,
          ],
        ]
      : []),
  ]);

  // Resources
  if (Object.keys(m.resources).length > 0) {
    log.heading("Resources");
    for (const [type, names] of Object.entries(m.resources)) {
      const singular = SINGULAR_FORMS[type] ?? type;
      log.info(chalk.bold(type));
      for (const name of names) {
        const uri = `${m.id}://${singular}/${name}`;
        const exported = m.exports.some(
          (e) =>
            e === uri || (e.endsWith("*") && uri.startsWith(e.slice(0, -1))),
        );
        log.dim(
          `  ${name} ${chalk.dim("→")} ${chalk.cyan(uri)}${exported ? chalk.green(" [exported]") : ""}`,
        );
      }
    }
  }

  // Dependencies
  if (
    m.dependencies.required.length > 0 ||
    m.dependencies.optional.length > 0
  ) {
    log.heading("Dependencies");
    for (const dep of m.dependencies.required) {
      log.info(`${chalk.cyan(dep)} ${chalk.dim("(required)")}`);
    }
    for (const dep of m.dependencies.optional) {
      log.info(`${chalk.cyan(dep)} ${chalk.dim("(optional)")}`);
    }
  }

  // Exports
  if (m.exports.length > 0) {
    log.heading("Exports");
    log.list(m.exports.map((e) => chalk.cyan(e)));
  }

  // Imports
  if (m.imports.length > 0) {
    log.heading("Imports");
    log.list(m.imports.map((i) => chalk.cyan(i)));
  }

  log.blank();
}
