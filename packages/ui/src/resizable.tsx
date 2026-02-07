"use client";

import React from "react";
import { GripVertical } from "lucide-react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { cn } from "./utils";

/**
 * Wrapper around react-resizable-panels v4 `Group`.
 * Accepts a `direction` prop (for backward compat with shadcn
 * naming) and maps it to the v4 `orientation` prop.
 */
const ResizablePanelGroup = ({
  className,
  direction,
  orientation,
  ...props
}: React.ComponentProps<typeof Group> & {
  direction?: "horizontal" | "vertical";
}) => (
  <Group
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className,
    )}
    {...props}
    orientation={direction ?? orientation ?? "horizontal"}
  />
);

/**
 * Wrapper around react-resizable-panels v4 `Panel`.
 * Automatically converts bare numeric `defaultSize`, `minSize`,
 * `maxSize` to percentage strings for v4 compatibility
 * (v4 treats bare numbers as pixels).
 */
function toSizeStr(v: number | string | undefined) {
  return typeof v === "number" ? `${v}%` : v;
}

const ResizablePanel = ({
  defaultSize,
  minSize,
  maxSize,
  ...props
}: React.ComponentProps<typeof Panel>) => (
  <Panel
    defaultSize={toSizeStr(defaultSize)}
    minSize={toSizeStr(minSize)}
    maxSize={toSizeStr(maxSize)}
    {...props}
  />
);

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof Separator> & {
  withHandle?: boolean;
}) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-[var(--radius-sm)] border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
