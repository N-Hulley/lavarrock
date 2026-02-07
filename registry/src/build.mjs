/**
 * build.mjs — Plugin build script for the Lavarrock registry.
 *
 * Reads all plugin directories (and packages/ui), builds each
 * into an IIFE bundle with React + shared deps externalized,
 * compiles Tailwind CSS for all plugins, and writes manifests
 * + bundles into registry/dist/.
 */

import { build } from "vite";
import react from "@vitejs/plugin-react";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { resolve, dirname } from "path";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");
const DIST = resolve(__dirname, "../dist");

// ── Plugin build definitions ──────────────────────
// Order matters: shared plugins are built first so their
// globals are available to plugins that depend on them.
const PLUGINS = [
  {
    id: "lavarrock.ui",
    dir: resolve(ROOT, "packages/ui"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_UI",
    type: "shared",
    priority: 100,
    external: ["react", "react-dom", "react/jsx-runtime"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
    },
    depends: [],
  },
  {
    id: "lavarrock.wm",
    dir: resolve(ROOT, "plugins/lavarrock-wm"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_WM",
    type: "shared",
    priority: 90,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
  },
  {
    id: "lavarrock.tooltips",
    dir: resolve(ROOT, "plugins/lavarrock-tooltips"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_TOOLTIPS",
    type: "wrapper",
    priority: 80,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    renderSlot: "wrapper",
    component: "TooltipWrapper",
  },
  {
    id: "lavarrock.header",
    dir: resolve(ROOT, "plugins/lavarrock-header"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_HEADER",
    type: "ui",
    priority: 70,
    external: ["react", "react-dom", "react/jsx-runtime"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
    },
    depends: [],
    renderSlot: "header",
    component: "HeaderBar",
  },
  {
    id: "lavarrock.search-modal",
    dir: resolve(ROOT, "plugins/lavarrock-search-modal"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_SEARCH_MODAL",
    type: "shared",
    priority: 65,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    component: "SearchModal",
  },
  {
    id: "lavarrock.app-modal",
    dir: resolve(ROOT, "plugins/lavarrock-app-modal"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_APP_MODAL",
    type: "shared",
    priority: 64,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@lavarrock/ui",
      "@lavarrock/plugin-wm",
    ],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
      "@lavarrock/plugin-wm": "__LAVARROCK_WM",
    },
    depends: ["lavarrock.ui", "lavarrock.wm"],
    component: "AppModal",
  },
  {
    id: "lavarrock.footer",
    dir: resolve(ROOT, "plugins/lavarrock-footer"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_FOOTER",
    type: "ui",
    priority: 60,
    external: ["react", "react-dom", "react/jsx-runtime"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
    },
    depends: [],
    renderSlot: "footer",
    component: "FooterBar",
  },
  {
    id: "lavarrock.search-bar",
    dir: resolve(ROOT, "plugins/lavarrock-search-bar"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_SEARCH_BAR",
    type: "shared",
    priority: 55,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui", "lavarrock.header", "lavarrock.search-modal"],
    component: "SearchBarSlot",
  },
  {
    id: "lavarrock.app-launcher",
    dir: resolve(ROOT, "plugins/lavarrock-app-launcher"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_APP_LAUNCHER",
    type: "shared",
    priority: 54,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui", "lavarrock.header", "lavarrock.app-modal"],
    component: "AppLauncherSlot",
  },
  {
    id: "lavarrock.json-tool",
    dir: resolve(ROOT, "plugins/lavarrock-json-tool"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_JSON_TOOL",
    type: "pane",
    priority: 50,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    paneId: "json-tool",
    paneManifest: {
      name: "JSON Tool",
      icon: "Braces",
      kind: "content",
      defaultDock: "main",
    },
    component: "JsonToolPane",
  },
  {
    id: "lavarrock.theme-engine",
    dir: resolve(ROOT, "plugins/lavarrock-theme-engine"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_THEME_ENGINE",
    type: "shared",
    priority: 50,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    component: "ThemeEngine",
  },
  {
    id: "lavarrock.theme-manager",
    dir: resolve(ROOT, "plugins/lavarrock-theme-manager"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_THEME_MANAGER",
    type: "shared",
    priority: 49,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@lavarrock/ui",
      "@lavarrock/plugin-theme-engine",
      "@lavarrock/plugin-settings-engine",
    ],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
      "@lavarrock/plugin-theme-engine": "__LAVARROCK_THEME_ENGINE",
      "@lavarrock/plugin-settings-engine": "__LAVARROCK_SETTINGS_ENGINE",
    },
    depends: [
      "lavarrock.ui",
      "lavarrock.theme-engine",
      "lavarrock.settings-engine",
    ],
  },
  {
    id: "lavarrock.theme-import",
    dir: resolve(ROOT, "plugins/lavarrock-theme-import"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_THEME_IMPORT",
    type: "shared",
    priority: 48,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@lavarrock/ui",
      "@lavarrock/plugin-theme-engine",
      "@lavarrock/plugin-settings-engine",
    ],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
      "@lavarrock/plugin-theme-engine": "__LAVARROCK_THEME_ENGINE",
      "@lavarrock/plugin-settings-engine": "__LAVARROCK_SETTINGS_ENGINE",
    },
    depends: [
      "lavarrock.ui",
      "lavarrock.theme-engine",
      "lavarrock.settings-engine",
    ],
  },
  {
    id: "lavarrock.layout-engine",
    dir: resolve(ROOT, "plugins/lavarrock-layout-engine"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_LAYOUT_ENGINE",
    type: "shared",
    priority: 48,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    component: "LayoutEngine",
  },
  {
    id: "lavarrock.settings-engine",
    dir: resolve(ROOT, "plugins/lavarrock-settings-engine"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_SETTINGS_ENGINE",
    type: "shared",
    priority: 46,
    external: ["react", "react-dom", "react/jsx-runtime", "@lavarrock/ui"],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
    },
    depends: ["lavarrock.ui"],
    component: "SettingsEngine",
  },
  {
    id: "lavarrock.layout-manager",
    dir: resolve(ROOT, "plugins/lavarrock-layout-manager"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_LAYOUT_MANAGER",
    type: "shared",
    priority: 45,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@lavarrock/ui",
      "@lavarrock/plugin-layout-engine",
      "@lavarrock/plugin-settings-engine",
    ],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
      "@lavarrock/plugin-layout-engine": "__LAVARROCK_LAYOUT_ENGINE",
      "@lavarrock/plugin-settings-engine": "__LAVARROCK_SETTINGS_ENGINE",
    },
    depends: [
      "lavarrock.ui",
      "lavarrock.layout-engine",
      "lavarrock.settings-engine",
    ],
  },
  {
    id: "lavarrock.settings-manager",
    dir: resolve(ROOT, "plugins/lavarrock-settings-manager"),
    entry: "src/index.ts",
    globalName: "__LAVARROCK_SETTINGS_MANAGER",
    type: "pane",
    priority: 43,
    external: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@lavarrock/ui",
      "@lavarrock/plugin-settings-engine",
    ],
    globals: {
      react: "React",
      "react-dom": "ReactDOM",
      "react/jsx-runtime": "React",
      "@lavarrock/ui": "__LAVARROCK_UI",
      "@lavarrock/plugin-settings-engine": "__LAVARROCK_SETTINGS_ENGINE",
    },
    depends: ["lavarrock.ui", "lavarrock.settings-engine"],
    paneId: "settings-manager",
    paneManifest: {
      name: "Settings",
      icon: "Settings",
      kind: "content",
      defaultDock: "main",
    },
    component: "SettingsManagerPane",
  },
];

// ── Build each plugin ─────────────────────────────
async function buildPlugin(plugin) {
  const outDir = resolve(DIST, "plugins", plugin.id);
  mkdirSync(outDir, { recursive: true });

  console.log(`\n📦 Building ${plugin.id} from ${plugin.dir}...`);
  console.log(`   Entry: ${resolve(plugin.dir, plugin.entry)}`);

  // Build resolve aliases so the TypeScript compiler can find
  // workspace packages during the Vite transform step.
  // These are needed for type resolution even though the imports
  // are ultimately externalized by Rollup.
  const resolveAlias = {
    "@lavarrock/ui": resolve(ROOT, "packages/ui/src/index.ts"),
    "@lavarrock/plugin-wm": resolve(ROOT, "plugins/lavarrock-wm/src/index.ts"),
    "@lavarrock/plugin-search-modal": resolve(
      ROOT,
      "plugins/lavarrock-search-modal/src/index.ts",
    ),
    "@lavarrock/plugin-app-modal": resolve(
      ROOT,
      "plugins/lavarrock-app-modal/src/index.ts",
    ),
    "@lavarrock/plugin-theme-manager": resolve(
      ROOT,
      "plugins/lavarrock-theme-manager/src/index.ts",
    ),
    "@lavarrock/plugin-theme-engine": resolve(
      ROOT,
      "plugins/lavarrock-theme-engine/src/index.ts",
    ),
    "@lavarrock/plugin-theme-import": resolve(
      ROOT,
      "plugins/lavarrock-theme-import/src/index.ts",
    ),
    "@lavarrock/plugin-layout-manager": resolve(
      ROOT,
      "plugins/lavarrock-layout-manager/src/index.ts",
    ),
    "@lavarrock/plugin-layout-engine": resolve(
      ROOT,
      "plugins/lavarrock-layout-engine/src/index.ts",
    ),
    "@lavarrock/plugin-settings-engine": resolve(
      ROOT,
      "plugins/lavarrock-settings-engine/src/index.ts",
    ),
    "@lavarrock/plugin-settings-manager": resolve(
      ROOT,
      "plugins/lavarrock-settings-manager/src/index.ts",
    ),
  };

  await build({
    root: plugin.dir,
    configFile: false,
    plugins: [react({ jsxRuntime: "classic" })],
    resolve: {
      alias: resolveAlias,
    },
    build: {
      outDir,
      emptyOutDir: true,
      lib: {
        entry: resolve(plugin.dir, plugin.entry),
        formats: ["iife"],
        name: plugin.globalName,
        fileName: () => "bundle.js",
      },
      rollupOptions: {
        external: (id) => {
          // Match exact specifiers and sub-path imports
          return plugin.external.some(
            (ext) => id === ext || id.startsWith(ext + "/"),
          );
        },
        output: {
          globals: (id) => {
            // Check exact match first
            if (plugin.globals[id]) return plugin.globals[id];
            // For sub-path imports like react/jsx-runtime
            for (const [key, val] of Object.entries(plugin.globals)) {
              if (id.startsWith(key + "/") || id === key) return val;
            }
            return id;
          },
          // Ensure all CSS is extracted to a single file
          assetFileNames: "style.css",
        },
      },
      // Don't minify for easier debugging; production builds can minify
      minify: false,
      cssCodeSplit: false,
    },
    logLevel: "warn",
  });

  console.log(`  ✓ Built ${plugin.id} → ${outDir}/bundle.js`);
}

// ── Generate registry manifest ────────────────────
function generateManifest() {
  const plugins = PLUGINS.map((p) => {
    // Read version from the plugin's own package.json
    const pkgPath = resolve(p.dir, "package.json");
    let version = "1.0.0";
    let name = p.id;
    let description = "";
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      version = pkg.version || version;
      name = pkg.lavarrock?.pluginId || pkg.name || name;
      description = pkg.description || "";
    } catch {
      // ignore
    }

    const manifest = {
      id: p.id,
      name,
      version,
      description,
      type: p.type,
      priority: p.priority,
      depends: p.depends,
      bundle: `/plugins/${p.id}/bundle.js`,
    };

    // Add render slot info for UI plugins
    if (p.renderSlot) manifest.renderSlot = p.renderSlot;
    if (p.component) manifest.component = p.component;

    // Add pane manifest for pane plugins
    if (p.paneId) manifest.paneId = p.paneId;
    if (p.paneManifest) manifest.paneManifest = p.paneManifest;

    // Check if a style.css was generated by Vite
    const styleOutPath = resolve(DIST, "plugins", p.id, "style.css");
    if (existsSync(styleOutPath)) {
      manifest.componentCss = `/plugins/${p.id}/style.css`;
    }

    return manifest;
  });

  const manifestPath = resolve(DIST, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        plugins,
        globalCss: "/plugin-utilities.css",
      },
      null,
      2,
    ),
  );
  console.log(`\n✅ Manifest written to ${manifestPath}`);
}

// ── Main ──────────────────────────────────────────
async function main() {
  console.log("🔨 Lavarrock Plugin Registry — Build\n");
  mkdirSync(DIST, { recursive: true });

  for (const plugin of PLUGINS) {
    await buildPlugin(plugin);
  }

  await buildCSS();
  generateManifest();
  console.log("\n🎉 All plugins built successfully.\n");
}

// ── Compile Tailwind CSS for all plugins ──────────
async function buildCSS() {
  console.log("\n🎨 Compiling plugin CSS with Tailwind v4…");

  const cssEntryPath = resolve(__dirname, "plugin-utilities.css");
  const inputCSS = readFileSync(cssEntryPath, "utf-8");

  const processor = postcss([
    tailwindcss({
      base: dirname(cssEntryPath),
      optimize: false,
    }),
  ]);

  const result = await processor.process(inputCSS, {
    from: cssEntryPath,
    to: resolve(DIST, "plugin-utilities.css"),
  });

  // Also include the theme/base styles from packages/ui/styles.css
  const themeCSS = readFileSync(
    resolve(ROOT, "packages/ui/styles.css"),
    "utf-8",
  );

  const combinedCSS =
    themeCSS + "\n\n/* ── Tailwind Utilities ── */\n\n" + result.css;
  writeFileSync(resolve(DIST, "plugin-utilities.css"), combinedCSS);
  console.log(
    `  ✓ Plugin CSS compiled (${Math.round(combinedCSS.length / 1024)}KB)`,
  );
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
