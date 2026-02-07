/**
 * Parse VSCode theme colors and apply to CSS variables
 */

interface VSCodeTheme {
  colors?: Record<string, string>;
  tokenColors?: Array<{
    scope?: string | string[];
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }>;
}

interface ThemeColors {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  tabList: string;
  tabIcon: string;
  tabIconActive: string;
  border: string;
  card: string;
  destructive: string;
  destructiveForeground: string;
  mutedForeground: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  ring: string;
  input: string;
  inputForeground: string;
}

/**
 * Convert hex color to HSL
 */
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace("#", "");

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lRounded = Math.round(l * 100);

  return `${h} ${s}% ${lRounded}%`;
}

/**
 * Adjust lightness to ensure visibility
 */
function adjustBorderContrast(bgHex: string, borderHex: string): string {
  // Parse background RGB
  const bgR = parseInt(bgHex.substring(1, 3), 16) / 255;
  const bgG = parseInt(bgHex.substring(3, 5), 16) / 255;
  const bgB = parseInt(bgHex.substring(5, 7), 16) / 255;
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

  // Parse border RGB
  let borderR = parseInt(borderHex.substring(1, 3), 16);
  let borderG = parseInt(borderHex.substring(3, 5), 16);
  let borderB = parseInt(borderHex.substring(5, 7), 16);

  // If background is dark, lighten border; if light, darken border
  const adjustment = bgLum < 0.5 ? 60 : -60;
  borderR = Math.max(0, Math.min(255, borderR + adjustment));
  borderG = Math.max(0, Math.min(255, borderG + adjustment));
  borderB = Math.max(0, Math.min(255, borderB + adjustment));

  return `#${borderR.toString(16).padStart(2, "0")}${borderG.toString(16).padStart(2, "0")}${borderB.toString(16).padStart(2, "0")}`;
}

/**
 * Map VSCode theme colors to our CSS variables
 */
export function mapVSCodeThemeToCSS(vscodeTheme: VSCodeTheme): ThemeColors {
  const colors = vscodeTheme.colors || {};

  // Map VSCode color keys to create a more varied, VSCode-like palette
  const background =
    colors["editor.background"] || colors["background"] || "#ffffff";
  const foreground =
    colors["editor.foreground"] || colors["foreground"] || "#000000";

  const primary =
    colors["button.background"] ||
    colors["activityBarBadge.background"] ||
    colors["activityBar.background"] ||
    "#000000";
  const primaryForeground =
    colors["button.foreground"] ||
    colors["activityBarBadge.foreground"] ||
    colors["activityBar.foreground"] ||
    foreground;

  const secondary =
    colors["sideBar.background"] ||
    colors["editorGroupHeader.tabsBackground"] ||
    colors["panel.background"] ||
    colors["editor.lineHighlightBackground"] ||
    "#f5f5f5";
  const secondaryForeground =
    colors["sideBar.foreground"] || colors["panel.foreground"] || foreground;

  const accent =
    colors["list.activeSelectionBackground"] ||
    colors["list.inactiveSelectionBackground"] ||
    colors["button.hoverBackground"] ||
    colors["focusBorder"] ||
    primary;
  const accentForeground =
    colors["list.activeSelectionForeground"] ||
    colors["list.inactiveSelectionForeground"] ||
    colors["button.foreground"] ||
    foreground;

  const muted =
    colors["editorWidget.background"] ||
    colors["dropdown.background"] ||
    colors["list.hoverBackground"] ||
    colors["input.background"] ||
    "#f0f0f0";

  const tabList =
    colors["sideBarSectionHeader.background"] ||
    colors["editorGroupHeader.tabsBackground"] ||
    colors["tab.inactiveBackground"] ||
    colors["sideBar.background"] ||
    muted;

  const tabIcon =
    colors["tab.inactiveForeground"] ||
    colors["sideBar.foreground"] ||
    colors["editor.foreground"] ||
    foreground;
  const tabIconActive =
    colors["tab.activeForeground"] ||
    colors["list.activeSelectionForeground"] ||
    colors["editor.foreground"] ||
    foreground;

  // Try multiple border sources and ensure visibility
  let border =
    colors["panel.border"] ||
    colors["editorGroup.border"] ||
    colors["tab.border"] ||
    colors["sideBar.border"] ||
    colors["contrastBorder"] ||
    "#e0e0e0";

  // Ensure border has good contrast
  border = adjustBorderContrast(background, border);

  const card =
    colors["editorGroupHeader.tabsBackground"] ||
    colors["tab.inactiveBackground"] ||
    colors["sideBar.background"] ||
    secondary;
  const cardForeground =
    colors["tab.inactiveForeground"] ||
    colors["sideBar.foreground"] ||
    foreground;
  const destructive =
    colors["errorForeground"] || colors["editorError.foreground"] || "#ff0000";
  const destructiveForeground =
    colors["errorForeground"] || colors["foreground"] || foreground;

  // Extract muted foreground (for secondary text)
  const mutedForeground =
    colors["descriptionForeground"] ||
    colors["editorLineNumber.foreground"] ||
    colors["tab.inactiveForeground"] ||
    "#888888";

  const popover =
    colors["editorHoverWidget.background"] ||
    colors["editorWidget.background"] ||
    colors["dropdown.background"] ||
    card;
  const popoverForeground =
    colors["editorHoverWidget.foreground"] ||
    colors["editorWidget.foreground"] ||
    colors["dropdown.foreground"] ||
    foreground;

  const ring = colors["focusBorder"] || accent;

  const input =
    colors["input.background"] || colors["dropdown.background"] || muted;
  const inputForeground =
    colors["input.foreground"] || colors["dropdown.foreground"] || foreground;

  return {
    background: hexToHSL(background),
    foreground: hexToHSL(foreground),
    primary: hexToHSL(primary),
    primaryForeground: hexToHSL(primaryForeground),
    secondary: hexToHSL(secondary),
    secondaryForeground: hexToHSL(secondaryForeground),
    accent: hexToHSL(accent),
    accentForeground: hexToHSL(accentForeground),
    muted: hexToHSL(muted),
    tabList: hexToHSL(tabList),
    tabIcon: hexToHSL(tabIcon),
    tabIconActive: hexToHSL(tabIconActive),
    border: hexToHSL(border),
    card: hexToHSL(card),
    destructive: hexToHSL(destructive),
    destructiveForeground: hexToHSL(destructiveForeground),
    mutedForeground: hexToHSL(mutedForeground),
    cardForeground: hexToHSL(cardForeground),
    popover: hexToHSL(popover),
    popoverForeground: hexToHSL(popoverForeground),
    ring: hexToHSL(ring),
    input: hexToHSL(input),
    inputForeground: hexToHSL(inputForeground),
  };
}

/**
 * Apply theme colors to CSS variables
 */
export function applyThemeToDOM(themeColors: ThemeColors): void {
  const root = document.documentElement;

  // Apply base colors
  root.style.setProperty("--background", themeColors.background);
  root.style.setProperty("--foreground", themeColors.foreground);
  root.style.setProperty("--primary", themeColors.primary);
  root.style.setProperty("--primary-foreground", themeColors.primaryForeground);
  root.style.setProperty("--secondary", themeColors.secondary);
  root.style.setProperty(
    "--secondary-foreground",
    themeColors.secondaryForeground,
  );
  root.style.setProperty("--accent", themeColors.accent);
  root.style.setProperty("--accent-foreground", themeColors.accentForeground);
  root.style.setProperty("--muted", themeColors.muted);
  root.style.setProperty("--tablist", themeColors.tabList);
  root.style.setProperty("--tab-icon", themeColors.tabIcon);
  root.style.setProperty("--tab-icon-active", themeColors.tabIconActive);
  root.style.setProperty("--border", themeColors.border);
  root.style.setProperty("--card", themeColors.card);
  root.style.setProperty("--destructive", themeColors.destructive);
  root.style.setProperty(
    "--destructive-foreground",
    themeColors.destructiveForeground,
  );
  root.style.setProperty("--muted-foreground", themeColors.mutedForeground);
  root.style.setProperty("--card-foreground", themeColors.cardForeground);
  root.style.setProperty("--popover", themeColors.popover);
  root.style.setProperty("--popover-foreground", themeColors.popoverForeground);
  root.style.setProperty("--ring", themeColors.ring);
  root.style.setProperty("--input", themeColors.input);

  // Keep derived colors for any missing theme entries
  root.style.setProperty("--input-foreground", themeColors.inputForeground);
}

/**
 * Check whether a saved theme is a v2 engine-serialized format.
 */
function isSerializedThemeV2(theme: Record<string, any>): boolean {
  return theme && theme.version === 2 && !!theme.attributes;
}

/**
 * Check whether a theme object uses Lavarrock's native format
 * (CSS variable keys like "background", "foreground" with HSL string values)
 * vs VSCode format (keys like "editor.background" with hex values).
 */
function isNativeTheme(theme: Record<string, any>): boolean {
  const colors = theme.colors || theme;
  // Native themes have keys like "background", "foreground" with HSL strings ("H S% L%")
  // VSCode themes have dotted keys like "editor.background" with hex values
  return (
    typeof colors === "object" &&
    ("background" in colors || "foreground" in colors) &&
    !("editor.background" in colors)
  );
}

/**
 * Apply a Lavarrock native theme (CSS variable keys with HSL string values)
 * directly to the DOM without going through the VSCode mapping layer.
 */
function applyNativeThemeToDOM(colors: Record<string, string>): void {
  const root = document.documentElement;
  const knownVars = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "accent",
    "accent-foreground",
    "muted",
    "muted-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
    "tablist",
    "tab-icon",
    "tab-icon-active",
  ];
  for (const key of knownVars) {
    if (colors[key]) {
      root.style.setProperty(`--${key}`, colors[key]);
    }
  }
}

/**
 * Apply effects from a v2 serialized theme (gradient, texture).
 * This runs at startup before the theme-manager plugin loads, so we
 * handle it with inline DOM manipulation matching what the engine does.
 */
function applyV2Effects(theme: Record<string, any>): void {
  const attrs = theme.attributes || {};

  // ── Gradient ──
  const gradientBg = attrs["gradient-bg"]?.value ?? "none";
  const gradientAlpha = attrs["gradient-alpha"]?.value ?? "1";
  const appRoot = document.getElementById("lavarrock-root");

  if (gradientBg && gradientBg !== "none") {
    document.body.style.backgroundImage = gradientBg;
    document.body.style.backgroundAttachment = "fixed";
    if (appRoot) appRoot.setAttribute("data-gradient", "true");

    const alpha = parseFloat(gradientAlpha);
    const styleId = "lavarrock-gradient-style";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = `
      [data-gradient] { background-color: transparent !important; }
      [data-gradient] .bg-background { background-color: hsl(var(--background) / ${alpha}) !important; }
      [data-gradient] .bg-card { background-color: hsl(var(--card) / ${alpha}) !important; }
      [data-gradient] .bg-popover { background-color: hsl(var(--popover) / ${alpha}) !important; }
      [data-gradient] .bg-muted { background-color: hsl(var(--muted) / ${alpha}) !important; }
      [data-gradient] .bg-secondary { background-color: hsl(var(--secondary) / ${alpha}) !important; }
    `;
  }

  // ── Texture ──
  const textureOpacity = parseFloat(attrs["texture-opacity"]?.value ?? "0");
  if (textureOpacity > 0) {
    const overlayId = "lavarrock-texture-overlay";
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = overlayId;
      Object.assign(overlay.style, {
        position: "fixed",
        inset: "0",
        zIndex: "9999",
        pointerEvents: "none",
        backgroundRepeat: "repeat",
        backgroundSize: "128px 128px",
        mixBlendMode: "overlay",
        transition: "opacity 0.15s ease",
      });
      // Generate noise inline (same as engine)
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      overlay.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
      document.body.appendChild(overlay);
    }
    overlay.style.opacity = String(textureOpacity);
  }

  // ── Glass / frosted-glass ──
  const glassBlur = attrs["glass-blur"]?.value ?? "0px";
  const glassOpacity = attrs["glass-opacity"]?.value ?? "1";
  const glassEnabled = glassBlur && glassBlur !== "0px";

  if (glassEnabled) {
    if (appRoot) appRoot.setAttribute("data-glass", "true");

    const alpha = parseFloat(glassOpacity);
    const inputs = theme.inputs || {};
    const isDark = inputs.mode === "dark";
    const borderColor = isDark
      ? `rgba(255,255,255,${0.08 + alpha * 0.04})`
      : `rgba(0,0,0,${0.06 + alpha * 0.03})`;
    const highlightColor = isDark
      ? `rgba(255,255,255,${0.03 + (1 - alpha) * 0.05})`
      : `rgba(255,255,255,${0.4 + (1 - alpha) * 0.3})`;

    const glassStyleId = "lavarrock-glass-style";
    let glassStyleEl = document.getElementById(
      glassStyleId,
    ) as HTMLStyleElement | null;
    if (!glassStyleEl) {
      glassStyleEl = document.createElement("style");
      glassStyleEl.id = glassStyleId;
      document.head.appendChild(glassStyleEl);
    }
    glassStyleEl.textContent = `
      [data-glass] .bg-card,
      [data-glass] .bg-popover,
      [data-glass] .bg-muted,
      [data-glass] .bg-secondary {
        background-color: hsl(var(--card) / ${alpha}) !important;
        backdrop-filter: blur(${glassBlur}) saturate(1.4) !important;
        -webkit-backdrop-filter: blur(${glassBlur}) saturate(1.4) !important;
        border: 1px solid ${borderColor} !important;
        box-shadow: inset 0 1px 0 0 ${highlightColor} !important;
      }
      [data-glass] .bg-popover {
        background-color: hsl(var(--popover) / ${alpha}) !important;
      }
      [data-glass] .bg-muted {
        background-color: hsl(var(--muted) / ${alpha}) !important;
      }
      [data-glass] .bg-secondary {
        background-color: hsl(var(--secondary) / ${alpha}) !important;
      }
      [data-glass] .bg-background {
        background-color: hsl(var(--background) / ${Math.min(alpha + 0.15, 1)}) !important;
        backdrop-filter: blur(${glassBlur}) !important;
        -webkit-backdrop-filter: blur(${glassBlur}) !important;
      }
    `;
  }
}

/**
 * Load and apply theme from backend
 */
export async function loadActiveTheme(): Promise<void> {
  try {
    const response = await fetch("/api/themes/active");
    if (!response.ok) {
      console.log("No active theme found");
      return;
    }

    const data = await response.json();
    if (!data || !data.theme) {
      return;
    }

    const theme = data.theme;

    if (isSerializedThemeV2(theme)) {
      // V2 engine-serialized format — use the flat 'colors' compat field
      const colors: Record<string, string> = theme.colors || {};
      applyNativeThemeToDOM(colors);
      // Apply effects (gradient, texture) from attributes
      applyV2Effects(theme);
    } else if (isNativeTheme(theme)) {
      // V1 native Lavarrock theme — apply directly
      const colors = theme.colors || theme;
      applyNativeThemeToDOM(colors);
    } else {
      // VSCode-format theme — run through the mapping layer
      const themeColors = mapVSCodeThemeToCSS(theme);
      applyThemeToDOM(themeColors);
    }

    console.log("✓ Applied theme:", data.name);
  } catch (error) {
    console.error("Failed to load active theme:", error);
  }
}

/**
 * Parse and apply VSCode theme directly
 */
export function applyVSCodeTheme(vscodeTheme: VSCodeTheme): void {
  const themeColors = mapVSCodeThemeToCSS(vscodeTheme);
  applyThemeToDOM(themeColors);
}
