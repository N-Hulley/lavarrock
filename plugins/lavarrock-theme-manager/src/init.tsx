/**
 * Theme Manager — shared plugin (no pane).
 *
 * Registers all theme settings with the Settings Engine:
 *  • Color Wheel (custom field renderer)
 *  • Effects (gradient, texture, glass — slider/switch fields)
 *  • Theme Library (custom field renderer — save/load/delete)
 *  • Theme Variables (custom field renderer — individual color overrides)
 *
 * Also exposes the ThemeManagerAPI so extensions (like theme-import)
 * can register custom field renderers lazily.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Input, Label } from "@lavarrock/ui";
import { Save, Trash2, Check, Star, StarOff } from "lucide-react";
import { ColorWheel } from "./components/ColorWheel";
import {
  THEME_VARIABLES,
  type ThemeValues,
  type ThemeVariableKey,
  type SavedTheme,
  type ThemeManagerAPI,
  type ThemeExtension,
  type HarmonyMode,
  hslStringToHex,
  hexToHSLString,
  applyThemeValues,
  computeHarmonyHues,
} from "@lavarrock/plugin-theme-engine";
import {
  getThemeEngine,
  type ThemeAttributeDefinition,
} from "@lavarrock/plugin-theme-engine";
import type { CustomFieldRendererProps } from "@lavarrock/plugin-settings-engine";

// ── Constants ──

const API_BASE = "/api/themes";
const GROUPS = [...new Set(THEME_VARIABLES.map((v) => v.group))];
const THEME_SETTINGS_ID = "lavarrock.theme-engine";

// ────────────────────────────────────────────────
// Custom Field Renderers
// ────────────────────────────────────────────────

/**
 * Color Wheel — custom field renderer.
 * Embeds the full interactive color wheel inside the settings form.
 */
function ColorWheelFieldRenderer({
  value,
  onChange,
}: CustomFieldRendererProps) {
  const engine = getThemeEngine();
  const inp = engine.inputs;

  const [hues, setHues] = useState<number[]>(inp.hues);
  const [harmony, setHarmony] = useState<HarmonyMode>(inp.harmony);
  const [mode, setMode] = useState<"dark" | "light">(inp.mode);
  const [vibrancy, setVibrancy] = useState(inp.vibrancy);
  const [lightness, setLightness] = useState(inp.lightness);

  const apply = useCallback(
    (h = hues, har = harmony, m = mode, v = vibrancy, lt = lightness) => {
      engine.setInputs({
        ...engine.inputs,
        hues: h,
        harmony: har,
        mode: m,
        vibrancy: v,
        lightness: lt,
      });
      engine.resetToDefaults();
      engine.applyToDOM();
      onChange({ hues: h, harmony: har, mode: m, vibrancy: v, lightness: lt });
    },
    [engine, hues, harmony, mode, vibrancy, lightness, onChange],
  );

  return (
    <ColorWheel
      hues={hues}
      onHuesChange={(h) => {
        setHues(h);
        apply(h);
      }}
      harmony={harmony}
      onHarmonyChange={(har) => {
        setHarmony(har);
        const newHues = computeHarmonyHues(hues[0] ?? 220, har);
        setHues(newHues);
        apply(newHues, har);
      }}
      mode={mode}
      onModeChange={(m) => {
        setMode(m);
        apply(undefined, undefined, m);
      }}
      vibrancy={vibrancy}
      onVibrancyChange={(v) => {
        setVibrancy(v);
        apply(undefined, undefined, undefined, v);
      }}
      lightness={lightness}
      onLightnessChange={(l) => {
        setLightness(l);
        apply(undefined, undefined, undefined, undefined, l);
      }}
      hideEffects
      onLiveUpdate={(h, m, v, lt) => {
        setHues(h);
        setMode(m);
        setVibrancy(v);
        setLightness(lt);
        apply(h, undefined, m, v, lt);
      }}
    />
  );
}

/**
 * Theme Library — custom field renderer.
 * Save, load, and delete named themes via the backend API.
 */
function ThemeLibraryFieldRenderer(_props: CustomFieldRendererProps) {
  const engine = getThemeEngine();
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [themeName, setThemeName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  const loadThemes = useCallback(async () => {
    try {
      const resp = await fetch(API_BASE);
      if (!resp.ok) return;
      const list: SavedTheme[] = await resp.json();
      setSavedThemes(list);
      const active = list.find((t) => t.active);
      if (active) setSelectedTheme(active.name);
    } catch (e) {
      console.error("Failed to load themes:", e);
    }
  }, []);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const saveTheme = useCallback(async () => {
    const name = themeName.trim();
    if (!name) return;
    try {
      const serialized = engine.serialize();
      await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, theme: serialized }),
      });
      setSelectedTheme(name);
      await loadThemes();
    } catch (e) {
      console.error("Failed to save theme:", e);
    }
  }, [themeName, engine, loadThemes]);

  const loadSavedTheme = useCallback(
    async (theme: SavedTheme) => {
      try {
        await fetch(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: theme.name, theme: theme.theme }),
        });
        setSelectedTheme(theme.name);
        setThemeName(theme.name);
        engine.deserialize(theme.theme);
        engine.applyToDOM();
        await loadThemes();
      } catch (e) {
        console.error("Failed to load theme:", e);
      }
    },
    [engine, loadThemes],
  );

  const deleteTheme = useCallback(
    async (name: string) => {
      try {
        await fetch(`${API_BASE}/${encodeURIComponent(name)}`, {
          method: "DELETE",
        });
        if (selectedTheme === name) setSelectedTheme(null);
        await loadThemes();
      } catch (e) {
        console.error("Failed to delete theme:", e);
      }
    },
    [selectedTheme, loadThemes],
  );

  return (
    <div className="space-y-2">
      {/* Save */}
      <div className="flex gap-2">
        <Input
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          placeholder="Theme name…"
          className="h-7 text-xs flex-1"
        />
        <Button
          size="sm"
          className="h-7 text-xs gap-1 px-2"
          onClick={saveTheme}
          disabled={!themeName.trim()}
        >
          <Save className="h-3 w-3" />
          Save
        </Button>
      </div>

      {/* List */}
      {savedThemes.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-2">
          No saved themes yet.
        </p>
      ) : (
        <div className="space-y-1">
          {savedThemes.map((t) => {
            const isActive = t.name === selectedTheme;
            return (
              <div
                key={t.name}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius)] border text-xs cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                }`}
                onClick={() => loadSavedTheme(t)}
              >
                {isActive ? (
                  <Star className="h-3 w-3 text-primary fill-primary shrink-0" />
                ) : (
                  <StarOff className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <span className="flex-1 truncate">{t.name}</span>
                {isActive && (
                  <Check className="h-3 w-3 text-primary shrink-0" />
                )}
                <button
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTheme(t.name);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Theme Variables — custom field renderer.
 * Individual color overrides for each theme CSS variable.
 */
function ThemeVariablesFieldRenderer(_props: CustomFieldRendererProps) {
  const engine = getThemeEngine();
  const [colors, setColors] = useState<ThemeValues>(
    engine.resolveColorValues() as ThemeValues,
  );

  // Refresh when engine changes (e.g. after color wheel interaction)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = engine.resolveColorValues() as ThemeValues;
      setColors(current);
    }, 500);
    return () => clearInterval(interval);
  }, [engine]);

  const handleVariableChange = useCallback(
    (key: ThemeVariableKey, hexValue: string) => {
      const hslVal = hexToHSLString(hexValue);
      const next = { ...colors, [key]: hslVal };
      setColors(next);
      document.documentElement.style.setProperty(`--${key}`, hslVal);
    },
    [colors],
  );

  return (
    <div className="space-y-3">
      {GROUPS.map((group) => (
        <div key={group}>
          <h4 className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            {group}
          </h4>
          <div className="space-y-1">
            {THEME_VARIABLES.filter((v) => v.group === group).map((v) => {
              const hslVal = colors[v.key] || "0 0% 0%";
              const hexVal = hslStringToHex(hslVal);
              return (
                <div key={v.key} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={hexVal}
                    onChange={(e) =>
                      handleVariableChange(v.key, e.target.value)
                    }
                    className="w-5 h-5 rounded cursor-pointer border border-border bg-transparent shrink-0"
                  />
                  <Label className="text-[10px] flex-1 truncate">
                    {v.label}
                  </Label>
                  <span className="text-[9px] text-muted-foreground font-mono">
                    {hexVal}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// Registration
// ────────────────────────────────────────────────

function registerThemeSettings() {
  const api = window.__LAVARROCK_SETTINGS;
  if (!api) return;

  const engine = getThemeEngine();

  // Register custom field renderers
  const unregColorWheel = api.registerFieldRenderer(
    "color-wheel",
    ColorWheelFieldRenderer,
  );
  const unregLibrary = api.registerFieldRenderer(
    "theme-library",
    ThemeLibraryFieldRenderer,
  );
  const unregVariables = api.registerFieldRenderer(
    "theme-variables",
    ThemeVariablesFieldRenderer,
  );

  // Register the theme settings schema
  const unregSchema = api.register({
    id: THEME_SETTINGS_ID,
    pluginId: "lavarrock.theme-engine",
    label: "Theme",
    icon: "Palette",
    description: "Configure colours, mode, effects, and appearance",
    category: "appearance",
    searchKeywords: [
      "color",
      "colour",
      "theme",
      "dark",
      "light",
      "mode",
      "gradient",
      "glass",
      "vibrancy",
      "hue",
      "import",
    ],
    sections: [
      { label: "Colours", group: "Colours", icon: "Palette" },
      { label: "Effects", group: "Effects", icon: "Sliders" },
      { label: "Themes", group: "Themes", icon: "Save" },
      { label: "Variables", group: "Variables", icon: "Cog" },
      { label: "Import", group: "Import", icon: "Upload" },
    ],
    autosave: true,
    fields: [
      // ── Colours ──
      {
        key: "colorWheel",
        label: "Color Wheel",
        type: "custom" as const,
        rendererType: "color-wheel",
        default: {
          hues: engine.inputs.hues,
          harmony: engine.inputs.harmony,
          mode: engine.inputs.mode,
          vibrancy: engine.inputs.vibrancy,
          lightness: engine.inputs.lightness,
        },
        group: "Colours",
        description: "Pick hues and colour harmony",
      },
      // ── Effects ──
      {
        key: "gradientEnabled",
        label: "Background Gradient",
        type: "switch" as const,
        default: engine.inputs.gradient.enabled,
        group: "Effects",
        description: "Apply a subtle gradient to the background",
      },
      {
        key: "gradientStrength",
        label: "Gradient Strength",
        type: "slider" as const,
        default: engine.inputs.gradient.strength,
        min: 0,
        max: 1,
        step: 0.05,
        group: "Effects",
        formatValue: (v: number) => `${Math.round(v * 100)}%`,
      },
      {
        key: "textureOpacity",
        label: "Texture Opacity",
        type: "slider" as const,
        default: engine.inputs.texture.opacity,
        min: 0,
        max: 0.3,
        step: 0.01,
        group: "Effects",
        formatValue: (v: number) =>
          v === 0 ? "Off" : `${Math.round(v * 100)}%`,
      },
      {
        key: "glassEnabled",
        label: "Glass Effect",
        type: "switch" as const,
        default: engine.inputs.glass.enabled,
        group: "Effects",
        description: "Frosted glass effect on surfaces",
      },
      {
        key: "glassBlur",
        label: "Glass Blur",
        type: "slider" as const,
        default: engine.inputs.glass.blur,
        min: 2,
        max: 32,
        step: 1,
        unit: "px",
        group: "Effects",
      },
      {
        key: "glassOpacity",
        label: "Glass Opacity",
        type: "slider" as const,
        default: engine.inputs.glass.opacity,
        min: 0,
        max: 1,
        step: 0.05,
        group: "Effects",
        formatValue: (v: number) => `${Math.round(v * 100)}%`,
      },
      // ── Theme Library ──
      {
        key: "themeLibrary",
        label: "Saved Themes",
        type: "custom" as const,
        rendererType: "theme-library",
        default: null,
        group: "Themes",
        description: "Save, load, and delete named themes",
      },
      // ── Variables ──
      {
        key: "themeVariables",
        label: "Color Variables",
        type: "custom" as const,
        rendererType: "theme-variables",
        default: null,
        group: "Variables",
        description: "Fine-tune individual theme colours",
      },
      // ── Import ──
      {
        key: "themeImport",
        label: "Import Theme",
        type: "custom" as const,
        rendererType: "theme-import",
        default: null,
        group: "Import",
        description: "Import a VS Code theme file",
      },
    ],
    onChange: (values) => {
      const currentInputs = engine.inputs;
      engine.setInputs({
        ...currentInputs,
        gradient: {
          ...currentInputs.gradient,
          enabled: values.gradientEnabled ?? currentInputs.gradient.enabled,
          strength: values.gradientStrength ?? currentInputs.gradient.strength,
        },
        texture: {
          opacity: values.textureOpacity ?? currentInputs.texture.opacity,
        },
        glass: {
          enabled: values.glassEnabled ?? currentInputs.glass.enabled,
          blur: values.glassBlur ?? currentInputs.glass.blur,
          opacity: values.glassOpacity ?? currentInputs.glass.opacity,
        },
      });
      engine.resetToDefaults();
      engine.applyToDOM();
    },
  });

  return () => {
    unregColorWheel();
    unregLibrary();
    unregVariables();
    unregSchema();
  };
}

// ── Load active theme on startup ──

async function loadActiveTheme() {
  const engine = getThemeEngine();
  try {
    const resp = await fetch(API_BASE);
    if (!resp.ok) return;
    const list: SavedTheme[] = await resp.json();
    const active = list.find((t) => t.active);
    if (active) {
      engine.deserialize(active.theme);
      engine.applyToDOM();
    }
  } catch (e) {
    console.error("Failed to load active theme:", e);
  }
}

// ── Expose ThemeManagerAPI for extensions ──

function exposeThemeManagerAPI() {
  const engine = getThemeEngine();
  const extensionsRef: ThemeExtension[] = [];

  const api: ThemeManagerAPI = {
    getValues: () => engine.resolveColorValues() as ThemeValues,
    setVariable: (key: ThemeVariableKey, hslValue: string) => {
      document.documentElement.style.setProperty(`--${key}`, hslValue);
    },
    setAllVariables: (values: ThemeValues) => {
      applyThemeValues(values);
    },
    registerExtension: (ext: ThemeExtension) => {
      extensionsRef.push(ext);
      return () => {
        const idx = extensionsRef.indexOf(ext);
        if (idx >= 0) extensionsRef.splice(idx, 1);
      };
    },
    getExtensions: () => extensionsRef,
    getEngine: () => engine,
    registerAttributes: (defs: ThemeAttributeDefinition[]) =>
      engine.registerAttributes(defs),
  };

  (window as any).__LAVARROCK_THEME_MANAGER = api;
  window.dispatchEvent(new CustomEvent("lavarrock:theme-manager-ready"));
}

// ── Init ──

export function initThemeManager(): void {
  // Load the active theme first
  loadActiveTheme();

  // Expose the API for extensions
  exposeThemeManagerAPI();

  // Register settings
  if (window.__LAVARROCK_SETTINGS) {
    registerThemeSettings();
  } else {
    window.addEventListener(
      "lavarrock:settings-ready",
      () => {
        registerThemeSettings();
      },
      { once: true },
    );
  }
}

initThemeManager();
