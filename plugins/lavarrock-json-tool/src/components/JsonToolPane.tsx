import { useState, useCallback } from "react";
import { Button, Textarea, Badge } from "@lavarrock/ui";
import {
  Braces,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clipboard,
  Trash2,
} from "lucide-react";

/**
 * Sort all keys in a JSON value recursively.
 */
function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortKeysDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export interface JsonToolPaneProps {
  pluginId?: string;
  isActive?: boolean;
}

/**
 * JSON Tool pane component.
 *
 * Provides a textarea for raw JSON input with buttons to
 * format (pretty-print), minify, validate, copy output,
 * paste from clipboard, and clear.
 */
export default function JsonToolPane(_props: JsonToolPaneProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [indentSize] = useState(2);
  const [sortKeys] = useState(false);

  const handleFormat = useCallback(() => {
    try {
      let parsed = JSON.parse(input);
      if (sortKeys) parsed = sortKeysDeep(parsed);
      setOutput(JSON.stringify(parsed, null, indentSize));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }, [input, indentSize, sortKeys]);

  const handleMinify = useCallback(() => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }, [input]);

  const handleValidate = useCallback(() => {
    try {
      JSON.parse(input);
      setError(null);
      setOutput("✓ Valid JSON");
    } catch (e) {
      setError((e as Error).message);
      setOutput("");
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    const text = output || input;
    if (text) {
      await navigator.clipboard.writeText(text);
    }
  }, [input, output]);

  const handlePaste = useCallback(async () => {
    const text = await navigator.clipboard.readText();
    setInput(text);
    setError(null);
    setOutput("");
  }, []);

  const handleClear = useCallback(() => {
    setInput("");
    setOutput("");
    setError(null);
  }, []);

  return (
    <div className="flex h-full flex-col gap-2 p-3 overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleFormat}
        >
          <Braces className="h-3.5 w-3.5" />
          Format
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleMinify}
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Minify
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={handleValidate}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Validate
        </Button>

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handlePaste}
          title="Paste from clipboard"
        >
          <Clipboard className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleCopy}
          title="Copy output"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleClear}
          title="Clear"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── Input ── */}
      <div className="flex-1 min-h-0 flex flex-col gap-2">
        <Textarea
          className="flex-1 min-h-0 resize-none font-mono text-xs"
          placeholder="Paste or type JSON here…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
          }}
          spellCheck={false}
        />

        {/* ── Error ── */}
        {error && (
          <div className="flex items-start gap-2 rounded-[var(--radius)] border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="break-all">{error}</span>
          </div>
        )}

        {/* ── Output ── */}
        {output && !error && (
          <div className="relative flex-1 min-h-0">
            <Badge
              variant="secondary"
              className="absolute right-2 top-2 text-[10px]"
            >
              Output
            </Badge>
            <Textarea
              className="h-full min-h-0 resize-none font-mono text-xs bg-muted/30"
              value={output}
              readOnly
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
