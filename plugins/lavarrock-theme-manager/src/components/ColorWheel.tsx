import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import { Slider } from "@lavarrock/ui";
import { Sun, Moon, Sparkles, Layers, GlassWater } from "lucide-react";
import {
  hslToHex,
  type HarmonyMode,
  HARMONY_MODES,
  computeHarmonyHues,
  generateThemeFromColors,
} from "@lavarrock/plugin-theme-engine";

interface ColorWheelProps {
  hues: number[];
  onHuesChange: (hues: number[]) => void;
  harmony: HarmonyMode;
  onHarmonyChange: (h: HarmonyMode) => void;
  mode: "dark" | "light";
  onModeChange: (mode: "dark" | "light") => void;
  vibrancy: number;
  onVibrancyChange: (v: number) => void;
  lightness: number;
  onLightnessChange: (l: number) => void;
  /** Hide the inline effect controls (when effects are managed elsewhere) */
  hideEffects?: boolean;
  /** Gradient enabled */
  gradientEnabled?: boolean;
  onGradientEnabledChange?: (v: boolean) => void;
  /** Gradient strength 0–1 */
  gradientStrength?: number;
  onGradientStrengthChange?: (v: number) => void;
  /** Texture opacity 0–1 */
  textureOpacity?: number;
  onTextureOpacityChange?: (v: number) => void;
  /** Glass enabled */
  glassEnabled?: boolean;
  onGlassEnabledChange?: (v: boolean) => void;
  /** Glass blur px */
  glassBlur?: number;
  onGlassBlurChange?: (v: number) => void;
  /** Glass opacity 0–1 */
  glassOpacity?: number;
  onGlassOpacityChange?: (v: number) => void;
  /** Called on every drag tick for live preview */
  onLiveUpdate?: (
    hues: number[],
    mode: "dark" | "light",
    vibrancy: number,
    lightness: number,
  ) => void;
}

const TAU = Math.PI * 2;

const HANDLE_LABELS = ["P", "S", "T", "Q"];

/** Minimum vibrancy when handle is at dead-centre */
const MIN_VIBRANCY = 0.05;

/** Width of the lightness sidebar in CSS px */
const BAR_WIDTH = 20;
/** Gap between disc and bar */
const BAR_GAP = 10;

/**
 * 2D colour wheel with a lightness sidebar.
 *
 * Disc:  angle → hue (0–360°),  radius → saturation (centre = grey, edge = vivid)
 * Bar:   vertical slider → lightness (top = light, bottom = dark)
 */
export function ColorWheel({
  hues,
  onHuesChange,
  harmony,
  onHarmonyChange,
  mode,
  onModeChange,
  vibrancy,
  onVibrancyChange,
  lightness,
  onLightnessChange,
  hideEffects = false,
  gradientEnabled = false,
  onGradientEnabledChange,
  gradientStrength = 0.5,
  onGradientStrengthChange,
  textureOpacity = 0,
  onTextureOpacityChange,
  glassEnabled = false,
  onGlassEnabledChange,
  glassBlur = 12,
  onGlassBlurChange,
  glassOpacity = 0.7,
  onGlassOpacityChange,
  onLiveUpdate,
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"disc" | "bar" | false>(false);
  const huesRef = useRef(hues);
  huesRef.current = hues;

  // Responsive size — disc diameter based on container
  const [containerW, setContainerW] = useState(320);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setContainerW(entries[0]?.contentRect.width ?? 320);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Disc fills available width, capped sensibly
  const size = Math.min(
    Math.max(containerW - BAR_WIDTH - BAR_GAP - 16, 120),
    280,
  );

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const handleR = Math.max(8, size * 0.038);

  // Canvas: just the disc + lightness bar
  const canvasW = size + BAR_GAP + BAR_WIDTH;
  const canvasH = size;

  // Bar geometry — to the right of the disc
  const barX = size + BAR_GAP;
  const barY = 6;
  const barH = size - 12;
  const barR = BAR_WIDTH / 2; // corner radius

  // ── Draw ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasW * dpr);
    canvas.height = Math.round(canvasH * dpr);
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Display lightness: map d.l (0–1) to HSL L% for the disc preview
    const displayL = 20 + lightness * 60; // 20–80% range

    // ─── 1. Filled HSL disc via ImageData ───
    // angle = hue, radius = saturation (0 at centre, 100 at edge)
    // Lightness is fixed from the bar value
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;
    const pxW = canvas.width;
    const pxH = canvas.height;

    for (let py = 0; py < pxH; py++) {
      for (let px = 0; px < pxW; px++) {
        const cssX = px / dpr;
        const cssY = py / dpr;

        // ── Disc pixels ──
        const dx = cssX - cx;
        const dy = cssY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= outerR + 0.5) {
          const frac = Math.min(dist / outerR, 1);
          let hue = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          if (hue < 0) hue += 360;

          const sat = frac * 100; // 0 at centre → 100 at edge
          const [r, g, b] = hslToRgb(hue, sat, displayL);

          let alpha = 255;
          if (dist > outerR - 0.5) {
            alpha = Math.round(Math.max(0, outerR + 0.5 - dist) * 255);
          }
          const idx = (py * pxW + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = alpha;
          continue;
        }

        // ── Lightness bar pixels ──
        if (
          cssX >= barX &&
          cssX <= barX + BAR_WIDTH &&
          cssY >= barY &&
          cssY <= barY + barH
        ) {
          // Check rounded rect bounds
          const bx = cssX - barX;
          const by = cssY - barY;
          const inRoundedRect = isInsideRoundedRect(
            bx,
            by,
            BAR_WIDTH,
            barH,
            barR,
          );
          if (inRoundedRect) {
            const t = by / barH; // 0 = top (light) → 1 = bottom (dark)
            const barL = 100 - t * 100; // 100% at top, 0% at bottom
            const primaryHue = hues[0] ?? 220;
            const barSat = vibrancy * 100;
            const [r, g, b] = hslToRgb(primaryHue, barSat, barL);
            const idx = (py * pxW + px) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // ─── 2. Disc border ───
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, TAU);
    ctx.strokeStyle =
      mode === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ─── 3. Centre dot ───
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, TAU);
    ctx.fillStyle =
      mode === "dark" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)";
    ctx.fill();

    // ─── 4. Connecting lines between handles ───
    const handleDist = vibrancy * outerR;
    if (hues.length > 1) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      for (let i = 0; i < hues.length; i++) {
        for (let j = i + 1; j < hues.length; j++) {
          const a1 = ((hues[i] - 90) * Math.PI) / 180;
          const a2 = ((hues[j] - 90) * Math.PI) / 180;
          ctx.beginPath();
          ctx.moveTo(
            cx + Math.cos(a1) * handleDist,
            cy + Math.sin(a1) * handleDist,
          );
          ctx.lineTo(
            cx + Math.cos(a2) * handleDist,
            cy + Math.sin(a2) * handleDist,
          );
          ctx.stroke();
        }
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // ─── 5. Disc handles ───
    const sat = vibrancy * 100;
    hues.forEach((hue, i) => {
      const angle = ((hue - 90) * Math.PI) / 180;
      const hx = cx + Math.cos(angle) * handleDist;
      const hy = cy + Math.sin(angle) * handleDist;
      const isPrimary = i === 0;
      const thisHandleR = isPrimary ? handleR * 1.25 : handleR;

      // Glow
      const glow = ctx.createRadialGradient(
        hx,
        hy,
        thisHandleR * 0.4,
        hx,
        hy,
        thisHandleR * 2.5,
      );
      glow.addColorStop(0, hslToHex(hue, sat, displayL) + "88");
      glow.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(hx, hy, thisHandleR * 2.5, 0, TAU);
      ctx.fillStyle = glow;
      ctx.fill();

      // Body
      ctx.beginPath();
      ctx.arc(hx, hy, thisHandleR, 0, TAU);
      ctx.fillStyle = hslToHex(hue, sat, displayL);
      ctx.fill();

      // Border
      ctx.strokeStyle = isPrimary
        ? "rgba(255,255,255,0.95)"
        : "rgba(255,255,255,0.6)";
      ctx.lineWidth = isPrimary ? 2.5 : 1.5;
      ctx.stroke();

      // Label
      ctx.fillStyle =
        displayL > 60 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
      ctx.font = `bold ${Math.round(thisHandleR * 0.85)}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(HANDLE_LABELS[i] || "", hx, hy + 0.5);
    });

    // ─── 6. Bar border + handle indicator ───
    ctx.beginPath();
    roundRect(ctx, barX, barY, BAR_WIDTH, barH, barR);
    ctx.strokeStyle =
      mode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bar handle — horizontal line + circle at current lightness position
    const barHandleY = barY + (1 - lightness) * barH; // l=1 → top, l=0 → bottom
    const primaryHue = hues[0] ?? 220;
    const barHandleColor = hslToHex(primaryHue, vibrancy * 100, displayL);

    // Line across bar
    ctx.beginPath();
    ctx.moveTo(barX + 2, barHandleY);
    ctx.lineTo(barX + BAR_WIDTH - 2, barHandleY);
    ctx.strokeStyle =
      displayL > 60 ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Triangle indicators on sides
    const triSize = 4;
    ctx.fillStyle = displayL > 60 ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.8)";
    // Left triangle
    ctx.beginPath();
    ctx.moveTo(barX - 1, barHandleY);
    ctx.lineTo(barX - 1 - triSize, barHandleY - triSize);
    ctx.lineTo(barX - 1 - triSize, barHandleY + triSize);
    ctx.closePath();
    ctx.fill();
    // Right triangle
    ctx.beginPath();
    ctx.moveTo(barX + BAR_WIDTH + 1, barHandleY);
    ctx.lineTo(barX + BAR_WIDTH + 1 + triSize, barHandleY - triSize);
    ctx.lineTo(barX + BAR_WIDTH + 1 + triSize, barHandleY + triSize);
    ctx.closePath();
    ctx.fill();
  }, [
    hues,
    mode,
    vibrancy,
    lightness,
    size,
    canvasW,
    canvasH,
    barX,
    barY,
    barH,
    barR,
    cx,
    cy,
    outerR,
    handleR,
  ]);

  // ── Pointer interaction ──
  const getHueAndVibrancyFromXY = useCallback(
    (clientX: number, clientY: number): { hue: number; vib: number } => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const x = clientX - rect.left - cx;
      const y = clientY - rect.top - cy;
      let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      const hue = Math.round(angle) % 360;
      const dist = Math.sqrt(x * x + y * y);
      const vib = Math.min(1, Math.max(MIN_VIBRANCY, dist / outerR));
      return { hue, vib };
    },
    [cx, cy, outerR],
  );

  const getLightnessFromY = useCallback(
    (clientY: number): number => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const y = clientY - rect.top;
      const t = (y - barY) / barH; // 0 = top, 1 = bottom
      return Math.min(1, Math.max(0, 1 - t)); // invert: top = 1 (light)
    },
    [barY, barH],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      canvas.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;

      // Check if clicking on the lightness bar
      if (
        cssX >= barX - 6 &&
        cssX <= barX + BAR_WIDTH + 6 &&
        cssY >= barY - 4 &&
        cssY <= barY + barH + 4
      ) {
        draggingRef.current = "bar";
        const l = getLightnessFromY(e.clientY);
        onLightnessChange(l);
        onLiveUpdate?.(hues, mode, vibrancy, l);
        return;
      }

      // Check if clicking on the disc
      const dx = cssX - cx;
      const dy = cssY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= outerR * 1.15) {
        draggingRef.current = "disc";
        const { hue, vib } = getHueAndVibrancyFromXY(e.clientX, e.clientY);
        const newHues = computeHarmonyHues(hue, harmony);
        onHuesChange(newHues);
        onVibrancyChange(vib);
        onLiveUpdate?.(newHues, mode, vib, lightness);
        return;
      }
    },
    [
      getHueAndVibrancyFromXY,
      getLightnessFromY,
      onHuesChange,
      onVibrancyChange,
      onLightnessChange,
      onLiveUpdate,
      mode,
      harmony,
      hues,
      vibrancy,
      lightness,
      cx,
      cy,
      outerR,
      barX,
      barY,
      barH,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!draggingRef.current) return;

      if (draggingRef.current === "bar") {
        const l = getLightnessFromY(e.clientY);
        onLightnessChange(l);
        onLiveUpdate?.(hues, mode, vibrancy, l);
        return;
      }

      // disc
      const { hue, vib } = getHueAndVibrancyFromXY(e.clientX, e.clientY);
      const newHues = computeHarmonyHues(hue, harmony);
      onHuesChange(newHues);
      onVibrancyChange(vib);
      onLiveUpdate?.(newHues, mode, vib, lightness);
    },
    [
      getHueAndVibrancyFromXY,
      getLightnessFromY,
      onHuesChange,
      onVibrancyChange,
      onLightnessChange,
      onLiveUpdate,
      mode,
      harmony,
      hues,
      vibrancy,
      lightness,
    ],
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Generate preview colors
  const previewTheme = useMemo(
    () => generateThemeFromColors(hues, mode, vibrancy, lightness),
    [hues, mode, vibrancy, lightness],
  );
  const pv = useMemo(() => {
    const p = (k: string) => {
      const v = (previewTheme as Record<string, string>)[k] ?? "0 0% 0%";
      return `hsl(${v})`;
    };
    return {
      bg: p("background"),
      fg: p("foreground"),
      card: p("card"),
      primary: p("primary"),
      primaryFg: p("primary-foreground"),
      secondary: p("secondary"),
      accent: p("accent"),
      muted: p("muted"),
      mutedFg: p("muted-foreground"),
      border: p("border"),
    };
  }, [previewTheme]);

  return (
    <div ref={containerRef} className="flex flex-col gap-3 w-full">
      {/* Harmony mode selector */}
      <div className="flex gap-0.5 bg-muted/50 rounded-[var(--radius-lg)] p-0.5 w-full">
        {HARMONY_MODES.map((h) => (
          <button
            key={h.value}
            className={`flex-1 rounded-[var(--radius)] px-1 py-1 text-[10px] font-medium transition-all ${
              harmony === h.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground/70"
            }`}
            onClick={() => {
              onHarmonyChange(h.value);
              const newHues = computeHarmonyHues(hues[0] ?? 220, h.value);
              onHuesChange(newHues);
              onLiveUpdate?.(newHues, mode, vibrancy, lightness);
            }}
            title={h.label}
          >
            {h.label}
          </button>
        ))}
      </div>

      {/* Wheel canvas — centered */}
      <div className="flex justify-center w-full">
        <canvas
          ref={canvasRef}
          style={{ width: canvasW, height: canvasH }}
          className="cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Swatches + mode toggle */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          {hues.map((hue, i) => {
            const displayL = 20 + lightness * 60;
            return (
              <div
                key={i}
                className="h-4 w-4 rounded-full border transition-all"
                style={{
                  backgroundColor: hslToHex(hue, vibrancy * 100, displayL),
                  borderColor:
                    i === 0 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)",
                  boxShadow: `0 0 6px ${hslToHex(hue, 60, 50)}66`,
                }}
                title={`${HANDLE_LABELS[i]}: ${hue}°`}
              />
            );
          })}
        </div>
        <div className="flex gap-0.5 bg-muted rounded-full p-0.5">
          <button
            className={`rounded-full p-1.5 transition-all ${mode === "dark" ? "bg-background shadow-sm" : "opacity-50 hover:opacity-75"}`}
            onClick={() => {
              onModeChange("dark");
              onLiveUpdate?.(hues, "dark", vibrancy, lightness);
            }}
            title="Dark mode"
          >
            <Moon className="h-3 w-3" />
          </button>
          <button
            className={`rounded-full p-1.5 transition-all ${mode === "light" ? "bg-background shadow-sm" : "opacity-50 hover:opacity-75"}`}
            onClick={() => {
              onModeChange("light");
              onLiveUpdate?.(hues, "light", vibrancy, lightness);
            }}
            title="Light mode"
          >
            <Sun className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Mini UI preview (div-based, fully responsive) ── */}
      <div
        className="w-full rounded-[var(--radius-lg)] overflow-hidden flex flex-col transition-colors"
        style={{
          background: pv.bg,
          border: `1px solid ${pv.border}`,
          height: 160,
        }}
      >
        {/* Title bar */}
        <div
          className="flex items-center gap-1.5 px-2 shrink-0"
          style={{
            height: 16,
            background: pv.card,
            borderBottom: `1px solid ${pv.border}`,
          }}
        >
          <div className="flex gap-1">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: pv.accent, opacity: 0.7 }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: pv.muted }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: pv.muted }}
            />
          </div>
          <div
            className="h-1.5 rounded-[var(--radius-sm)] flex-1 mx-2"
            style={{ background: pv.mutedFg, opacity: 0.15, maxWidth: 80 }}
          />
        </div>

        {/* Body: sidebar + main */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar */}
          <div
            className="shrink-0 flex flex-col gap-1.5 py-2.5 px-2"
            style={{
              width: "22%",
              background: pv.card,
              borderRight: `1px solid ${pv.border}`,
            }}
          >
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.accent, width: "85%" }}
            />
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.muted, width: "70%" }}
            />
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.muted, width: "60%" }}
            />
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.muted, width: "78%" }}
            />
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.muted, width: "50%" }}
            />
            <div className="flex-1" />
            <div
              className="h-1.5 rounded-[var(--radius-sm)]"
              style={{ background: pv.mutedFg, opacity: 0.2, width: "65%" }}
            />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col gap-2 p-2.5 min-w-0">
            {/* Breadcrumb + action row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-[var(--radius-sm)]"
                  style={{ background: pv.fg, opacity: 0.6, width: 28 }}
                />
                <div
                  className="h-1.5 rounded-[var(--radius-sm)]"
                  style={{ background: pv.mutedFg, opacity: 0.3, width: 16 }}
                />
              </div>
              <div className="flex gap-1">
                <div
                  className="h-3.5 rounded-[var(--radius-sm)] px-1"
                  style={{ background: pv.secondary, width: 18 }}
                />
                <div
                  className="h-3.5 rounded-[var(--radius-sm)] px-1"
                  style={{ background: pv.primary, width: 24 }}
                />
              </div>
            </div>

            {/* Card grid */}
            <div className="flex gap-2 flex-1 min-h-0">
              {[pv.accent, pv.primary, pv.secondary].map((topColor, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[var(--radius)] flex flex-col overflow-hidden"
                  style={{
                    background: pv.card,
                    border: `1px solid ${pv.border}`,
                  }}
                >
                  {/* Colored header stripe */}
                  <div
                    className="shrink-0"
                    style={{ height: 3, background: topColor }}
                  />
                  <div className="flex flex-col gap-1 p-1.5 flex-1">
                    {/* Title line */}
                    <div
                      className="h-1.5 rounded-[var(--radius-sm)]"
                      style={{ background: pv.fg, opacity: 0.5, width: "75%" }}
                    />
                    {/* Text lines */}
                    <div
                      className="h-1 rounded-[var(--radius-sm)]"
                      style={{
                        background: pv.mutedFg,
                        opacity: 0.25,
                        width: "95%",
                      }}
                    />
                    <div
                      className="h-1 rounded-[var(--radius-sm)]"
                      style={{
                        background: pv.mutedFg,
                        opacity: 0.2,
                        width: "80%",
                      }}
                    />
                    <div
                      className="h-1 rounded-[var(--radius-sm)]"
                      style={{
                        background: pv.mutedFg,
                        opacity: 0.15,
                        width: "60%",
                      }}
                    />
                    <div className="flex-1" />
                    {/* Card footer */}
                    {i === 0 ? (
                      <div
                        className="h-3 rounded-[var(--radius-sm)] flex items-center justify-center"
                        style={{ background: pv.primary }}
                      >
                        <div
                          className="h-0.5 rounded-[var(--radius-sm)]"
                          style={{ background: pv.primaryFg, width: "45%" }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div
                          className="h-1 rounded-[var(--radius-sm)]"
                          style={{
                            background: pv.fg,
                            opacity: 0.35,
                            width: "30%",
                          }}
                        />
                        <div
                          className="h-1 rounded-[var(--radius-sm)]"
                          style={{
                            background: pv.accent,
                            opacity: 0.5,
                            width: "15%",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between px-2 shrink-0"
          style={{ height: 12, background: pv.primary }}
        >
          <div
            className="h-1 rounded-[var(--radius-sm)]"
            style={{ background: pv.primaryFg, opacity: 0.6, width: 24 }}
          />
          <div
            className="h-1 rounded-[var(--radius-sm)]"
            style={{ background: pv.primaryFg, opacity: 0.4, width: 16 }}
          />
        </div>
      </div>

      {/* ── Effect controls ── */}
      {!hideEffects && (
        <div className="w-full space-y-2.5">
          {/* Gradient */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <button
                className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${gradientEnabled ? "text-foreground" : "text-muted-foreground"}`}
                onClick={() => onGradientEnabledChange?.(!gradientEnabled)}
              >
                <Sparkles className="h-3 w-3" />
                Gradient
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {gradientEnabled
                  ? `${Math.round(gradientStrength * 100)}%`
                  : "Off"}
              </span>
            </div>
            {gradientEnabled && (
              <div className="relative">
                <div
                  className="absolute inset-0 h-1.5 rounded-full my-auto"
                  style={{
                    background: (() => {
                      const h1 = hues[0] ?? 220;
                      if (mode === "dark")
                        return `linear-gradient(to right, ${hslToHex(h1, 15, 8)}, ${hslToHex(h1, 25, 14)})`;
                      return `linear-gradient(to right, ${hslToHex(h1, 15, 98)}, ${hslToHex(h1, 30, 94)})`;
                    })(),
                  }}
                />
                <Slider
                  value={[gradientStrength]}
                  min={0}
                  max={1}
                  step={0.01}
                  className="relative"
                  onValueChange={([v]) => onGradientStrengthChange?.(v)}
                />
              </div>
            )}
          </div>

          {/* Glass */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <button
                className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${glassEnabled ? "text-foreground" : "text-muted-foreground"}`}
                onClick={() => onGlassEnabledChange?.(!glassEnabled)}
              >
                <GlassWater className="h-3 w-3" />
                Glass
              </button>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {glassEnabled ? `${Math.round(glassBlur)}px` : "Off"}
              </span>
            </div>
            {glassEnabled && (
              <div className="space-y-1">
                <div className="relative">
                  <div
                    className="absolute inset-0 h-1.5 rounded-full my-auto"
                    style={{
                      background:
                        mode === "dark"
                          ? "linear-gradient(to right, hsl(0 0% 15%), hsl(0 0% 30%))"
                          : "linear-gradient(to right, hsl(0 0% 85%), hsl(0 0% 70%))",
                      filter: "blur(1px)",
                    }}
                  />
                  <Slider
                    value={[glassBlur]}
                    min={2}
                    max={28}
                    step={1}
                    className="relative"
                    onValueChange={([v]) => onGlassBlurChange?.(v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">
                    Opacity
                  </span>
                  <span className="text-[9px] text-muted-foreground tabular-nums">
                    {Math.round(glassOpacity * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <div
                    className="absolute inset-0 h-1.5 rounded-full my-auto overflow-hidden"
                    style={{
                      background:
                        mode === "dark"
                          ? "linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.25))"
                          : "linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.15))",
                    }}
                  />
                  <Slider
                    value={[glassOpacity]}
                    min={0.3}
                    max={0.95}
                    step={0.01}
                    className="relative"
                    onValueChange={([v]) => onGlassOpacityChange(v)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Texture */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                <Layers className="h-3 w-3" />
                Texture
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {textureOpacity > 0
                  ? `${Math.round(textureOpacity * 100)}%`
                  : "Off"}
              </span>
            </div>
            <div className="relative">
              <div
                className="absolute inset-0 h-1.5 rounded-full my-auto overflow-hidden"
                style={{
                  background:
                    mode === "dark"
                      ? "linear-gradient(to right, hsl(0 0% 10%), hsl(0 0% 20%))"
                      : "linear-gradient(to right, hsl(0 0% 90%), hsl(0 0% 80%))",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundSize: "60px 60px",
                    mixBlendMode: "overlay",
                    opacity: 0.6,
                  }}
                />
              </div>
              <Slider
                value={[textureOpacity]}
                min={0}
                max={0.15}
                step={0.005}
                className="relative"
                onValueChange={([v]) => onTextureOpacityChange?.(v)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers ──

/** Fast HSL → RGB (h in 0–360, s/l in 0–100) → [r, g, b] each 0–255 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const s1 = s / 100;
  const l1 = l / 100;
  const c = (1 - Math.abs(2 * l1 - 1)) * s1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l1 - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

/** Draw a rounded rectangle path (does not fill/stroke) */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Check if a point (local coords) is inside a rounded rect */
function isInsideRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): boolean {
  if (x < 0 || x > w || y < 0 || y > h) return false;
  // Check corners
  if (x < r && y < r) return (x - r) ** 2 + (y - r) ** 2 <= r * r;
  if (x > w - r && y < r) return (x - (w - r)) ** 2 + (y - r) ** 2 <= r * r;
  if (x < r && y > h - r) return (x - r) ** 2 + (y - (h - r)) ** 2 <= r * r;
  if (x > w - r && y > h - r)
    return (x - (w - r)) ** 2 + (y - (h - r)) ** 2 <= r * r;
  return true;
}
