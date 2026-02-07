/**
 * Type declarations for @lavarrock/plugin-tooltips
 *
 * Provides the global TooltipProvider wrapper so every component
 * in the tree can use <Tooltip> without its own provider.
 */

export interface TooltipWrapperProps {
  children: React.ReactNode;
}
