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

export interface ThemeColors {
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

    const themeColors = mapVSCodeThemeToCSS(data.theme);
    applyThemeToDOM(themeColors);

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
