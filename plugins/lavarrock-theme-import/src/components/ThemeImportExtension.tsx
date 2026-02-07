/**
 * Theme Import — shared plugin.
 *
 * Registers a "theme-import" custom field renderer with the Settings Engine
 * so it renders inside the Theme section of the Settings Manager.
 *
 * Lazy-loads: the bundle loads when the plugin system initialises it,
 * but the import UI is only rendered when the user opens Theme → Import
 * in the Settings Manager.
 */

import { useState, useRef, useCallback } from "react";
import { Button, Separator } from "@lavarrock/ui";
import { Upload, AlertCircle, Check, Loader2 } from "lucide-react";
import {
  mapVSCodeTheme,
  applyThemeValues,
  type ThemeValues,
} from "@lavarrock/plugin-theme-engine";
import type { CustomFieldRendererProps } from "@lavarrock/plugin-settings-engine";

// ── Import Panel (the actual UI) ──────────────────

function ImportPanel(_props: CustomFieldRendererProps) {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setStatus("loading");
      setError("");

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const mapped = mapVSCodeTheme(json);

        // Apply via ThemeManagerAPI if available, else direct CSS
        const api = window.__LAVARROCK_THEME_MANAGER;
        if (api && typeof api.setAllVariables === "function") {
          api.setAllVariables(mapped);
        } else {
          applyThemeValues(mapped);
        }
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to parse theme file",
        );
        setStatus("error");
      }

      if (fileRef.current) fileRef.current.value = "";
    },
    [],
  );

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-medium">Import VS Code Theme</div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Import a VS Code theme JSON file (e.g.{" "}
        <code className="text-[9px]">gruvbox-material-dark.json</code>) to
        auto-fill all theme variables.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".json,.jsonc"
        className="hidden"
        onChange={handleFile}
      />

      <Button
        variant="outline"
        className="w-full h-8 text-xs"
        onClick={() => fileRef.current?.click()}
        disabled={status === "loading"}
      >
        {status === "loading" ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5 mr-1.5" />
        )}
        Choose Theme File
      </Button>

      {status === "success" && (
        <div className="flex items-center gap-2 text-[10px] text-green-500">
          <Check className="h-3 w-3" />
          <span>
            Imported <strong>{fileName}</strong> — variables applied!
          </span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-start gap-2 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Separator />

      <div className="text-[10px] text-muted-foreground">
        <strong>Supported formats:</strong>
        <ul className="list-disc pl-4 mt-1 space-y-0.5">
          <li>
            Full VS Code theme (<code>colors</code> object)
          </li>
          <li>
            Exported theme from{" "}
            <code>~/.vscode/extensions/*/themes/*.json</code>
          </li>
          <li>Flat color JSON object</li>
        </ul>
      </div>
    </div>
  );
}

// ── Registration ──────────────────────────────────

function registerImportRenderer() {
  const api = window.__LAVARROCK_SETTINGS;
  if (!api) return;

  api.registerFieldRenderer("theme-import", ImportPanel);
  console.log("[theme-import] Registered custom field renderer");
}

// ── Init (runs on bundle load) ────────────────────

export function initThemeImport(): void {
  if (window.__LAVARROCK_SETTINGS) {
    registerImportRenderer();
  } else {
    window.addEventListener(
      "lavarrock:settings-ready",
      () => registerImportRenderer(),
      { once: true },
    );
  }
}

initThemeImport();

export default initThemeImport;
