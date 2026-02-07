import chalk from "chalk";
import ora from "ora";
import { log } from "../lib/logger.js";
import { verifyIntegrity } from "../lib/integrity.js";

export async function verifyCommand(pluginDir: string): Promise<void> {
  log.heading("Verify plugin integrity (SHA-384)");

  const spinner = ora("Checking integrity hashes…").start();
  const result = await verifyIntegrity(pluginDir);

  if (result.valid) {
    spinner.succeed(
      `All ${result.checked} file(s) verified — integrity ${chalk.green("OK")}`,
    );
  } else {
    spinner.fail("Integrity check failed");
    log.blank();
    for (const issue of result.issues) {
      log.error(issue);
    }
    log.blank();
    log.dim(
      `Checked ${result.checked} file(s), found ${result.issues.length} issue(s)`,
    );
    process.exit(1);
  }
}
