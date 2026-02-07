import chalk from "chalk";

const PREFIX = chalk.hex("#E8590C").bold("▌ lavarrock");

export const log = {
  info: (msg: string) => console.log(`${PREFIX} ${msg}`),
  success: (msg: string) => console.log(`${PREFIX} ${chalk.green("✔")} ${msg}`),
  warn: (msg: string) => console.log(`${PREFIX} ${chalk.yellow("⚠")} ${msg}`),
  error: (msg: string) => console.error(`${PREFIX} ${chalk.red("✖")} ${msg}`),
  dim: (msg: string) => console.log(`${PREFIX} ${chalk.dim(msg)}`),
  step: (n: number, total: number, msg: string) =>
    console.log(`${PREFIX} ${chalk.cyan(`[${n}/${total}]`)} ${msg}`),
  blank: () => console.log(),
  heading: (msg: string) => {
    console.log();
    console.log(`${PREFIX} ${chalk.bold.underline(msg)}`);
    console.log();
  },
  list: (items: string[]) => {
    for (const item of items) {
      console.log(`${PREFIX}   ${chalk.dim("•")} ${item}`);
    }
  },
  table: (rows: [string, string][]) => {
    const maxKey = Math.max(...rows.map(([k]) => k.length));
    for (const [key, value] of rows) {
      console.log(`${PREFIX}   ${chalk.cyan(key.padEnd(maxKey))}  ${value}`);
    }
  },
};
