import { SDK_VERSION, REQUIRED_EXTERNALS } from "./constants.js";
import type { Channel } from "./constants.js";

// ────────────────────────────────────────────────────────────
//  Template context passed to all generators
// ────────────────────────────────────────────────────────────

export interface PluginContext {
  id: string;
  name: string;
  author: string;
  description: string;
  icon: string;
  channel: Channel;
  packageName: string; // e.g. "@lavarrock/plugin-files" or "lavarrock-plugin-my-thing"
  /** Resource types the user chose during init */
  resourceTypes: string[];
  /** Required dependencies chosen during init */
  requiredDeps: string[];
  /** Optional dependencies chosen during init */
  optionalDeps: string[];
}

// ────────────────────────────────────────────────────────────
//  package.json
// ────────────────────────────────────────────────────────────

export function packageJsonTemplate(ctx: PluginContext): string {
  const devDeps: Record<string, string> = {
    "@lavarrock/plugin-sdk": SDK_VERSION,
    vite: "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    typescript: "^5.2.0",
  };

  // Add plugin-defined type dependencies as devDeps
  const coreDepMap: Record<string, string> = {
    panes: "@lavarrock/plugin-wm",
    components: "@lavarrock/plugin-ui",
    statusItems: "@lavarrock/plugin-footer",
    headerActions: "@lavarrock/plugin-header",
  };
  for (const rt of ctx.resourceTypes) {
    if (rt in coreDepMap) {
      devDeps[coreDepMap[rt]] = SDK_VERSION;
    }
  }
  // Add explicit dep packages
  for (const dep of ctx.requiredDeps) {
    const pkg = depIdToPackage(dep);
    if (pkg && !(pkg in devDeps)) devDeps[pkg] = SDK_VERSION;
  }
  for (const dep of ctx.optionalDeps) {
    const pkg = depIdToPackage(dep);
    if (pkg && !(pkg in devDeps)) devDeps[pkg] = SDK_VERSION;
  }

  const obj = {
    name: ctx.packageName,
    version: "1.0.0",
    type: "module",
    main: "dist/manifest.js",
    types: "dist/plugin-api.d.ts",
    lavarrock: {
      pluginId: ctx.id,
      sdk: SDK_VERSION,
      channel: ctx.channel,
    },
    peerDependencies: {
      react: "^18.0.0",
      "react-dom": "^18.0.0",
      "@lavarrock/plugin-sdk": SDK_VERSION,
    },
    devDependencies: sortKeys(devDeps),
    scripts: {
      build: "vite build",
      dev: "vite build --watch",
      typecheck: "tsc --noEmit",
    },
  };

  return JSON.stringify(obj, null, 2) + "\n";
}

// ────────────────────────────────────────────────────────────
//  tsconfig.json
// ────────────────────────────────────────────────────────────

export function tsconfigTemplate(): string {
  return (
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          declaration: true,
          declarationDir: "dist",
          outDir: "dist",
          rootDir: "src",
          resolveJsonModule: true,
          isolatedModules: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2,
    ) + "\n"
  );
}

// ────────────────────────────────────────────────────────────
//  vite.config.ts
// ────────────────────────────────────────────────────────────

export function viteConfigTemplate(): string {
  const externals = REQUIRED_EXTERNALS.map((e) => `        "${e}",`).join("\n");

  return `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { lavarrockPlugin } from "@lavarrock/plugin-sdk/vite";

export default defineConfig({
  plugins: [react(), lavarrockPlugin()],
  build: {
    lib: {
      entry: "src/manifest.ts",
      formats: ["es"],
      fileName: "manifest",
    },
    rollupOptions: {
      external: [
${externals}
      ],
      output: {
        manualChunks: undefined,
      },
    },
  },
});
`;
}

// ────────────────────────────────────────────────────────────
//  manifest.ts
// ────────────────────────────────────────────────────────────

export function manifestTemplate(ctx: PluginContext): string {
  const lines: string[] = [];

  lines.push(`import { definePlugin } from "@lavarrock/plugin-sdk";`);

  // Import zod if we have settings, extensionPoints, or resourceTypes
  const needsZod = ctx.resourceTypes.some((r) =>
    ["settings", "extensionPoints", "resourceTypes"].includes(r),
  );
  if (needsZod) {
    lines.push(`import { z } from "zod";`);
  }

  lines.push("");
  lines.push("export default definePlugin({");
  lines.push(`  // ─── Identity ───────────────────────────────────`);
  lines.push(`  id: "${ctx.id}",`);
  lines.push(`  version: "1.0.0",`);
  lines.push(`  name: "${ctx.name}",`);
  lines.push(`  author: "${ctx.author}",`);
  lines.push(`  description: "${ctx.description}",`);
  lines.push(`  icon: "${ctx.icon}",`);
  lines.push("");

  // Resources block
  lines.push(`  // ─── Resources ──────────────────────────────────`);
  lines.push(`  resources: {`);

  for (const type of ctx.resourceTypes) {
    lines.push(...resourceBlockTemplate(ctx, type));
  }

  lines.push(`  },`);
  lines.push("");

  // Modifications
  lines.push(`  modifications: [],`);
  lines.push("");

  // Exports
  lines.push(`  // ─── Exports ────────────────────────────────────`);
  lines.push(`  exports: [],`);
  lines.push("");

  // Imports
  lines.push(`  // ─── Imports ────────────────────────────────────`);
  lines.push(`  imports: [],`);
  lines.push("");

  // Dependencies
  lines.push(`  // ─── Dependencies ──────────────────────────────`);
  lines.push(`  dependencies: {`);
  lines.push(`    required: [`);
  for (const dep of ctx.requiredDeps) {
    lines.push(`      "${dep}",`);
  }
  lines.push(`    ],`);
  lines.push(`    optional: [`);
  for (const dep of ctx.optionalDeps) {
    lines.push(`      "${dep}",`);
  }
  lines.push(`    ],`);
  lines.push(`  },`);
  lines.push("");

  // Load order
  lines.push(`  loadPriority: 0,`);
  lines.push("");

  // Lifecycle
  lines.push(`  // ─── Lifecycle ──────────────────────────────────`);
  lines.push(`  lifecycle: {`);
  lines.push(`    activate: async (ctx) => {`);
  lines.push(`      const mod = await import("./index");`);
  lines.push(`      return mod.activate(ctx);`);
  lines.push(`    },`);
  lines.push(`    deactivate: async (ctx) => {`);
  lines.push(`      // Cleanup on deactivation`);
  lines.push(`    },`);
  lines.push(`  },`);

  lines.push(`});`);
  lines.push("");

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────
//  Resource block snippets (inside manifest resources: {})
// ────────────────────────────────────────────────────────────

function resourceBlockTemplate(ctx: PluginContext, type: string): string[] {
  const lines: string[] = [];

  switch (type) {
    case "commands":
      lines.push(`    commands: {`);
      lines.push(`      // example: {`);
      lines.push(`      //   name: "Example Command",`);
      lines.push(
        `      //   handler: () => import("./resources/commands/example"),`,
      );
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "hotkeys":
      lines.push(`    hotkeys: {`);
      lines.push(`      // example: {`);
      lines.push(`      //   name: "Example Hotkey",`);
      lines.push(`      //   keys: "mod+shift+e",`);
      lines.push(`      //   command: "${ctx.id}://command/example",`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "settings":
      lines.push(`    settings: {`);
      lines.push(`      // enabled: {`);
      lines.push(`      //   name: "Enable ${ctx.name}",`);
      lines.push(`      //   description: "Toggle this plugin on or off",`);
      lines.push(`      //   schema: z.boolean(),`);
      lines.push(`      //   default: true,`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "state":
      lines.push(`    state: {`);
      lines.push(`      // exampleState: {`);
      lines.push(`      //   default: null,`);
      lines.push(`      //   sync: false,`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "panes":
      lines.push(`    panes: {`);
      lines.push(`      // MainPane: {`);
      lines.push(`      //   name: "${ctx.name}",`);
      lines.push(`      //   icon: "${ctx.icon}",`);
      lines.push(
        `      //   component: () => import("./resources/panes/MainPane"),`,
      );
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "language":
      lines.push(`    language: {`);
      lines.push(`      en: {`);
      lines.push(`        source: () => import("./resources/language/en"),`);
      lines.push(`        fallback: true,`);
      lines.push(`      },`);
      lines.push(`    },`);
      break;

    case "extensionPoints":
      lines.push(`    extensionPoints: {`);
      lines.push(`      // myExtensionPoint: {`);
      lines.push(
        `      //   description: "Describe what contributors should provide",`,
      );
      lines.push(`      //   schema: z.object({ /* ... */ }),`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "statusItems":
      lines.push(`    statusItems: {`);
      lines.push(`      // indicator: {`);
      lines.push(`      //   name: "${ctx.name} Status",`);
      lines.push(`      //   icon: "${ctx.icon}",`);
      lines.push(
        `      //   component: () => import("./resources/statusItems/Indicator"),`,
      );
      lines.push(`      //   position: "left",`);
      lines.push(`      //   priority: 0,`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "headerActions":
      lines.push(`    headerActions: {`);
      lines.push(`      // action: {`);
      lines.push(`      //   name: "${ctx.name} Action",`);
      lines.push(`      //   icon: "${ctx.icon}",`);
      lines.push(`      //   command: "${ctx.id}://command/example",`);
      lines.push(`      //   position: "right",`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "renderSlots":
      lines.push(`    renderSlots: {`);
      lines.push(`      // content: {`);
      lines.push(`      //   slot: "content",`);
      lines.push(
        `      //   component: () => import("./resources/renderSlots/MainSlot"),`,
      );
      lines.push(`      //   priority: 0,`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    case "resourceTypes":
      lines.push(`    resourceTypes: {`);
      lines.push(`      // myType: {`);
      lines.push(
        `      //   description: "Describe this custom resource type",`,
      );
      lines.push(`      //   schema: z.object({ /* ... */ }),`);
      lines.push(`      // },`);
      lines.push(`    },`);
      break;

    default:
      lines.push(`    ${type}: {},`);
      break;
  }

  return lines;
}

// ────────────────────────────────────────────────────────────
//  index.tsx (activation entry point)
// ────────────────────────────────────────────────────────────

export function indexTemplate(ctx: PluginContext): string {
  return `import type { PluginContext } from "@lavarrock/plugin-sdk";

export async function activate(ctx: PluginContext): Promise<void> {
  console.log("[${ctx.id}] activated");
}
`;
}

// ────────────────────────────────────────────────────────────
//  Resource file templates
// ────────────────────────────────────────────────────────────

export function commandTemplate(pluginId: string, commandName: string): string {
  return `import type { CommandContext } from "@lavarrock/plugin-sdk";

export default async function ${commandName}(ctx: CommandContext): Promise<void> {
  // TODO: implement ${commandName}
  console.log("[${pluginId}] ${commandName} executed");
}
`;
}

export function paneTemplate(pluginId: string, paneName: string): string {
  return `import type { PaneProps } from "@lavarrock/plugin-sdk";

export default function ${paneName}({ pluginId, isActive, api }: PaneProps) {
  return (
    <div data-plugin={pluginId} data-active={isActive}>
      <h2>${paneName}</h2>
      <p>TODO: build this pane</p>
    </div>
  );
}
`;
}

export function statusItemTemplate(pluginId: string, itemName: string): string {
  return `export default function ${itemName}() {
  return <span data-plugin="${pluginId}">${itemName}</span>;
}
`;
}

export function headerActionTemplate(
  pluginId: string,
  actionName: string,
): string {
  return `export default function ${actionName}() {
  return <button data-plugin="${pluginId}">${actionName}</button>;
}
`;
}

export function languageTemplate(pluginId: string, locale: string): string {
  const name = pluginId.split(".").pop() ?? pluginId;
  return `export default {
  ${name}: {
    title: "${locale === "en" ? "Title" : `[${locale}] Title`}",
  },
} satisfies Record<string, Record<string, string>>;
`;
}

export function renderSlotTemplate(pluginId: string, slotName: string): string {
  return `import type { RenderSlotProps } from "@lavarrock/plugin-sdk";

export default function ${slotName}({ pluginId, ctx }: RenderSlotProps) {
  return (
    <div data-plugin={pluginId}>
      <p>${slotName} render slot</p>
    </div>
  );
}
`;
}

export function componentTemplate(
  _pluginId: string,
  componentName: string,
): string {
  return `import type { ComponentProps } from "react";

export interface ${componentName}Props extends ComponentProps<"div"> {
  // TODO: define props
}

export default function ${componentName}({ ...props }: ${componentName}Props) {
  return <div {...props}>${componentName}</div>;
}
`;
}

// ────────────────────────────────────────────────────────────
//  Helpers
// ────────────────────────────────────────────────────────────

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)),
  );
}

function depIdToPackage(id: string): string | null {
  if (id.startsWith("lavarrock.")) {
    const name = id.replace("lavarrock.", "");
    return `@lavarrock/plugin-${name}`;
  }
  return null;
}
