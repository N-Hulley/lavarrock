import type { ReactNode } from "react";
import { TooltipProvider } from "@lavarrock/ui";

export interface TooltipWrapperProps {
  children: ReactNode;
}

/**
 * Global tooltip wrapper.
 *
 * Renders a Radix TooltipProvider around the entire application
 * so that any descendant can use <Tooltip> without needing its
 * own provider.
 */
export default function TooltipWrapper({ children }: TooltipWrapperProps) {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipProvider>
  );
}
