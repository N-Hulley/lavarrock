import { useState, useEffect, useCallback, useRef } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Slider,
  Switch,
} from "@lavarrock/ui";
import {
  Paintbrush,
  Save,
  Trash2,
  Check,
  Upload,
  Palette,
  Star,
  StarOff,
  Sun,
  Moon,
} from "lucide-react";
import { ColorWheel } from "./ColorWheel";
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
  mapVSCodeTheme,
  computeHarmonyHues,
  HARMONY_MODES,
} from "@lavarrock/plugin-theme-engine";
import {
  getThemeEngine,
  type ThemeAttributeDefinition,
} from "@lavarrock/plugin-theme-engine";
import type {
  SettingsEngineAPI,
  CustomFieldRendererProps,
} from "@lavarrock/plugin-settings-engine";

// ── Constants ──

const API_BASE = "/api/themes";
const GROUPS = [...new Set(THEME_VARIABLES.map((v) => v.group))];
const THEME_SETTINGS_ID = "lavarrock.theme-engine";

// ── Color Wheel custom field renderer ──
// This wraps a mini version of the color wheel as a custom field
// so it renders inside the Settings Manager pane.

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

  // Sync back to the engine
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
      // Signal to the settings engine
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
      gradientEnabled={engine.inputs.gradient.enabled}
      onGradientEnabledChange={() => {}}
      gradientStrength={engine.inputs.gradient.strength}
      onGradientStrengthChange={() => {}}
      textureOpacity={engine.inputs.texture.opacity}
      onTextureOpacityChange={() => {}}
      glassEnabled={engine.inputs.glass.enabled}
      onGlassEnabledChange={() => {}}
      glassBlur={engine.inputs.glass.blur}
      onGlassBlurChange={() => {}}
      glassOpacity={engine.inputs.glass.opacity}
      onGlassOpacityChange={() => {}}
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

// ── Register settings with settings engine ──

function registerThemeSettings(engine: ReturnType<typeof getThemeEngine>) {
  const api = window.__LAVARROCK_SETTINGS;
  if (!api) return;

  // Register the color-wheel custom field renderer
  const unregisterRenderer = api.registerFieldRenderer(
    "color-wheel",
    ColorWheelFieldRenderer,
  );

  // Register the theme settings schema
  const unregisterSchema = api.register({
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
    ],
    autosave: true,
    fields: [
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
    ],
    onChange: (values) => {
      // Apply effects from settings
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
    unregisterRenderer();
    unregisterSchema();
  };
}

// ── Component ──

export default function ThemeManagerPane() {
  const engine = getThemeEngine();

  // ── React state (mirrors engine.inputs) ──
  const [hues, setHues] = useState<number[]>(engine.inputs.hues);
  const [harmony, setHarmony] = useState<HarmonyMode>(engine.inputs.harmony);
  const [mode, setMode] = useState<"dark" | "light">(engine.inputs.mode);
  const [vibrancy, setVibrancy] = useState(engine.inputs.vibrancy);
  const [lightness, setLightness] = useState(engine.inputs.lightness);
  const [gradientEnabled, setGradientEnabled] = useState(
    engine.inputs.gradient.enabled,
  );
  const [gradientStrength, setGradientStrength] = useState(
    engine.inputs.gradient.strength,
  );
  const [textureOpacity, setTextureOpacity] = useState(
    engine.inputs.texture.opacity,
  );
  const [glassEnabled, setGlassEnabled] = useState(engine.inputs.glass.enabled);
  const [glassBlur, setGlassBlur] = useState(engine.inputs.glass.blur);
  const [glassOpacity, setGlassOpacity] = useState(engine.inputs.glass.opacity);

  // ── Working colour values ──
  const [colors, setColors] = useState<ThemeValues>(
    engine.resolveColorValues() as ThemeValues,
  );

  // ── Saved themes ──
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [themeName, setThemeName] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  // ── Import ──
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // ── Extensions ──
  const [extensions, setExtensions] = useState<ThemeExtension[]>([]);
  const extensionsRef = useRef<ThemeExtension[]>([]);

  // ── Helpers ──

  const syncFromEngine = useCallback(() => {
    const inp = engine.inputs;
    setHues([...inp.hues]);
    setHarmony(inp.harmony);
    setMode(inp.mode);
    setVibrancy(inp.vibrancy);
    setLightness(inp.lightness);
    setGradientEnabled(inp.gradient.enabled);
    setGradientStrength(inp.gradient.strength);
    setTextureOpacity(inp.texture.opacity);
    setGlassEnabled(inp.glass.enabled);
    setGlassBlur(inp.glass.blur);
    setGlassOpacity(inp.glass.opacity);
    setColors(engine.resolveColorValues() as ThemeValues);
  }, [engine]);

  const applyFromCurrentState = useCallback(
    (
      h: number[] = hues,
      m: "dark" | "light" = mode,
      v: number = vibrancy,
      gradEnabled: boolean = gradientEnabled,
      gradStr: number = gradientStrength,
      texOp: number = textureOpacity,
      glEnabled: boolean = glassEnabled,
      glBlur: number = glassBlur,
      glOpacity: number = glassOpacity,
      har: HarmonyMode = harmony,
      lt: number = lightness,
    ) => {
      engine.setInputs({
        hues: h,
        harmony: har,
        mode: m,
        vibrancy: v,
        lightness: lt,
        gradient: {
          enabled: gradEnabled,
          angle: engine.inputs.gradient.angle,
          strength: gradStr,
        },
        texture: { opacity: texOp },
        glass: { enabled: glEnabled, blur: glBlur, opacity: glOpacity },
      });
      engine.resetToDefaults();
      engine.applyToDOM();
      setColors(engine.resolveColorValues() as ThemeValues);
    },
    [
      engine,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      textureOpacity,
      glassEnabled,
      glassBlur,
      glassOpacity,
      harmony,
      lightness,
    ],
  );

  // ── Load saved themes on mount ──

  const loadThemes = useCallback(async () => {
    try {
      const resp = await fetch(API_BASE);
      if (!resp.ok) return;
      const list: SavedTheme[] = await resp.json();
      setSavedThemes(list);

      const active = list.find((t) => t.active);
      if (active) {
        setSelectedTheme(active.name);
        engine.deserialize(active.theme);
        engine.applyToDOM();
        syncFromEngine();
      }
    } catch (e) {
      console.error("Failed to load themes:", e);
    }
  }, [engine, syncFromEngine]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  // ── Register with settings engine ──

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    function init() {
      cleanup = registerThemeSettings(engine);
    }

    if (window.__LAVARROCK_SETTINGS) {
      init();
    } else {
      const handler = () => init();
      window.addEventListener("lavarrock:settings-ready", handler);
      return () => {
        window.removeEventListener("lavarrock:settings-ready", handler);
        cleanup?.();
      };
    }

    return () => {
      cleanup?.();
    };
  }, [engine]);

  // ── Expose the ThemeManager API ──

  useEffect(() => {
    const api: ThemeManagerAPI = {
      getValues: () => ({ ...colors }),
      setVariable: (key: ThemeVariableKey, hslValue: string) => {
        const next = { ...colors, [key]: hslValue };
        setColors(next);
        applyThemeValues(next);
      },
      setAllVariables: (values: ThemeValues) => {
        setColors(values);
        applyThemeValues(values);
      },
      registerExtension: (ext: ThemeExtension) => {
        extensionsRef.current = [...extensionsRef.current, ext];
        setExtensions([...extensionsRef.current]);
        return () => {
          extensionsRef.current = extensionsRef.current.filter(
            (e) => e.id !== ext.id,
          );
          setExtensions([...extensionsRef.current]);
        };
      },
      getExtensions: () => extensionsRef.current,
      getEngine: () => getThemeEngine(),
      registerAttributes: (defs: ThemeAttributeDefinition[]) =>
        getThemeEngine().registerAttributes(defs),
    };
    (window as any).__LAVARROCK_THEME_MANAGER = api;
    return () => {
      (window as any).__LAVARROCK_THEME_MANAGER = undefined;
    };
  }, [colors]);

  // ── Event handlers ──

  const handleWheelLiveUpdate = useCallback(
    (h: number[], m: "dark" | "light", v: number, lt: number) => {
      setHues(h);
      setMode(m);
      setVibrancy(v);
      setLightness(lt);
      applyFromCurrentState(
        h,
        m,
        v,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        lt,
      );
    },
    [applyFromCurrentState],
  );

  const handleHuesChange = useCallback(
    (h: number[]) => {
      setHues(h);
      applyFromCurrentState(h);
    },
    [applyFromCurrentState],
  );

  const handleHarmonyChange = useCallback(
    (h: HarmonyMode) => {
      setHarmony(h);
      const newHues = computeHarmonyHues(hues[0] ?? 220, h);
      setHues(newHues);
      applyFromCurrentState(
        newHues,
        mode,
        vibrancy,
        gradientEnabled,
        gradientStrength,
        textureOpacity,
        glassEnabled,
        glassBlur,
        glassOpacity,
        h,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      textureOpacity,
      glassEnabled,
      glassBlur,
      glassOpacity,
    ],
  );

  const handleModeChange = useCallback(
    (m: "dark" | "light") => {
      setMode(m);
      applyFromCurrentState(hues, m);
    },
    [applyFromCurrentState, hues],
  );

  const handleVibrancyChange = useCallback(
    (v: number) => {
      setVibrancy(v);
      applyFromCurrentState(hues, mode, v);
    },
    [applyFromCurrentState, hues, mode],
  );

  const handleLightnessChange = useCallback(
    (l: number) => {
      setLightness(l);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        l,
      );
    },
    [applyFromCurrentState, hues, mode, vibrancy],
  );

  const handleGradientEnabledChange = useCallback(
    (enabled: boolean) => {
      setGradientEnabled(enabled);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        enabled,
        gradientStrength,
        textureOpacity,
        glassEnabled,
        glassBlur,
        glassOpacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientStrength,
      textureOpacity,
      glassEnabled,
      glassBlur,
      glassOpacity,
    ],
  );

  const handleGradientStrengthChange = useCallback(
    (strength: number) => {
      setGradientStrength(strength);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        gradientEnabled,
        strength,
        textureOpacity,
        glassEnabled,
        glassBlur,
        glassOpacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      textureOpacity,
      glassEnabled,
      glassBlur,
      glassOpacity,
    ],
  );

  const handleTextureOpacityChange = useCallback(
    (opacity: number) => {
      setTextureOpacity(opacity);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        gradientEnabled,
        gradientStrength,
        opacity,
        glassEnabled,
        glassBlur,
        glassOpacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      glassEnabled,
      glassBlur,
      glassOpacity,
    ],
  );

  const handleGlassEnabledChange = useCallback(
    (enabled: boolean) => {
      setGlassEnabled(enabled);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        gradientEnabled,
        gradientStrength,
        textureOpacity,
        enabled,
        glassBlur,
        glassOpacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      textureOpacity,
      glassBlur,
      glassOpacity,
    ],
  );

  const handleGlassBlurChange = useCallback(
    (blur: number) => {
      setGlassBlur(blur);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        gradientEnabled,
        gradientStrength,
        textureOpacity,
        glassEnabled,
        blur,
        glassOpacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      textureOpacity,
      glassEnabled,
      glassOpacity,
    ],
  );

  const handleGlassOpacityChange = useCallback(
    (opacity: number) => {
      setGlassOpacity(opacity);
      applyFromCurrentState(
        hues,
        mode,
        vibrancy,
        gradientEnabled,
        gradientStrength,
        textureOpacity,
        glassEnabled,
        glassBlur,
        opacity,
      );
    },
    [
      applyFromCurrentState,
      hues,
      mode,
      vibrancy,
      gradientEnabled,
      gradientStrength,
      textureOpacity,
      glassEnabled,
      glassBlur,
    ],
  );

  const handleVariableChange = useCallback(
    (key: ThemeVariableKey, hexValue: string) => {
      const hslVal = hexToHSLString(hexValue);
      const next = { ...colors, [key]: hslVal };
      setColors(next);
      document.documentElement.style.setProperty(`--${key}`, hslVal);
    },
    [colors],
  );

  // ── Save / Load / Delete ──

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
        syncFromEngine();
        await loadThemes();
      } catch (e) {
        console.error("Failed to load theme:", e);
      }
    },
    [engine, syncFromEngine, loadThemes],
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

  const handleImport = useCallback(() => {
    try {
      const parsed = JSON.parse(importText);
      const mapped = mapVSCodeTheme(parsed);
      setColors(mapped);
      applyThemeValues(mapped);
      setImportStatus("Theme imported! Adjust & save.");
    } catch {
      setImportStatus("Invalid JSON — paste a VSCode theme file.");
    }
  }, [importText]);

  // ── Render ──

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <Tabs
        defaultValue="wheel"
        className="flex-1 flex flex-col overflow-hidden"
      >
        <TabsList className="mx-2 mt-2 shrink-0 bg-muted/50 p-0.5 h-8">
          <TabsTrigger value="wheel" className="text-xs gap-1 h-7 px-2">
            <Palette className="h-3 w-3" />
            Wheel
          </TabsTrigger>
          <TabsTrigger value="variables" className="text-xs gap-1 h-7 px-2">
            <Paintbrush className="h-3 w-3" />
            Variables
          </TabsTrigger>
          <TabsTrigger value="themes" className="text-xs gap-1 h-7 px-2">
            <Star className="h-3 w-3" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="import" className="text-xs gap-1 h-7 px-2">
            <Upload className="h-3 w-3" />
            Import
          </TabsTrigger>
          {extensions.map((ext) => (
            <TabsTrigger
              key={ext.id}
              value={ext.id}
              className="text-xs gap-1 h-7 px-2"
            >
              {ext.icon && <ext.icon className="h-3 w-3" />}
              {ext.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Wheel tab ── */}
        <TabsContent value="wheel" className="flex-1 overflow-y-auto px-3 py-2">
          <ColorWheel
            hues={hues}
            onHuesChange={handleHuesChange}
            harmony={harmony}
            onHarmonyChange={handleHarmonyChange}
            mode={mode}
            onModeChange={handleModeChange}
            vibrancy={vibrancy}
            onVibrancyChange={handleVibrancyChange}
            lightness={lightness}
            onLightnessChange={handleLightnessChange}
            gradientEnabled={gradientEnabled}
            onGradientEnabledChange={handleGradientEnabledChange}
            gradientStrength={gradientStrength}
            onGradientStrengthChange={handleGradientStrengthChange}
            textureOpacity={textureOpacity}
            onTextureOpacityChange={handleTextureOpacityChange}
            glassEnabled={glassEnabled}
            onGlassEnabledChange={handleGlassEnabledChange}
            glassBlur={glassBlur}
            onGlassBlurChange={handleGlassBlurChange}
            glassOpacity={glassOpacity}
            onGlassOpacityChange={handleGlassOpacityChange}
            onLiveUpdate={handleWheelLiveUpdate}
          />

          {/* Quick save */}
          <div className="flex gap-2 mt-3">
            <Input
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Theme name…"
              className="h-8 text-xs flex-1"
            />
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={saveTheme}
              disabled={!themeName.trim()}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          </div>
        </TabsContent>

        {/* ── Variables tab ── */}
        <TabsContent
          value="variables"
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          {GROUPS.map((group) => (
            <div key={group} className="mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group}
              </h3>
              <div className="space-y-1.5">
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
                        className="w-6 h-6 rounded cursor-pointer border border-border bg-transparent shrink-0"
                      />
                      <Label className="text-xs flex-1 truncate">
                        {v.label}
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {hexVal}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── Themes tab ── */}
        <TabsContent
          value="themes"
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          <div className="flex gap-2 mb-3">
            <Input
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              placeholder="Theme name…"
              className="h-8 text-xs flex-1"
            />
            <Button
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={saveTheme}
              disabled={!themeName.trim()}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
          </div>

          {savedThemes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-6">
              No saved themes yet.
            </p>
          ) : (
            <div className="space-y-1.5">
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
        </TabsContent>

        {/* ── Import tab ── */}
        <TabsContent
          value="import"
          className="flex-1 overflow-y-auto px-3 py-2"
        >
          <p className="text-xs text-muted-foreground mb-2">
            Paste a VS Code theme JSON to import colours.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"colors":{"editor.background":"#1e1e1e",...}}'
            className="w-full h-40 rounded-[var(--radius)] border border-border bg-muted/30 p-2 text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button
            size="sm"
            className="mt-2 h-8 text-xs gap-1"
            onClick={handleImport}
          >
            <Upload className="h-3 w-3" />
            Import
          </Button>
          {importStatus && (
            <p className="text-xs mt-1 text-muted-foreground">{importStatus}</p>
          )}
        </TabsContent>

        {/* ── Extension tabs ── */}
        {extensions.map((ext) => (
          <TabsContent
            key={ext.id}
            value={ext.id}
            className="flex-1 overflow-y-auto px-3 py-2"
          >
            {ext.render()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
