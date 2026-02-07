import * as React from "react";

import { cn } from "./utils";
import { Label } from "./label";

/* ─── Form layout primitives ──────────────────────
 *
 * Lightweight wrappers for laying out form fields consistently.
 * These do NOT depend on react-hook-form — they are purely
 * structural / presentational.
 *
 *   <FormField>
 *     <FormLabel>Name</FormLabel>
 *     <FormControl><Input /></FormControl>
 *     <FormDescription>Your display name.</FormDescription>
 *     <FormMessage>Required</FormMessage>
 *   </FormField>
 */

const FormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
));
FormField.displayName = "FormField";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn("text-sm font-medium", className)}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] text-muted-foreground", className)}
    {...props}
  />
));
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] font-medium text-destructive", className)}
    {...props}
  />
));
FormMessage.displayName = "FormMessage";

/* ─── Settings-oriented form layout ──────────────────────
 *
 * Higher-level layout primitives for settings / preference pages.
 *
 *   <SettingsForm>
 *     <SettingsGroup title="Appearance">
 *       <SettingsItem>…</SettingsItem>
 *     </SettingsGroup>
 *   </SettingsForm>
 */

/**
 * Page-level settings container.
 * Establishes a CSS container-query context so all children can
 * respond to the available inline-size rather than the viewport.
 */
const SettingsForm = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("@container w-full space-y-4", className)}
    {...props}
  />
));
SettingsForm.displayName = "SettingsForm";

/**
 * Section wrapper — groups related fields under a heading.
 * Renders a subtle separator before each group (except the first).
 */
const SettingsGroup = React.forwardRef<
  HTMLFieldSetElement,
  React.FieldsetHTMLAttributes<HTMLFieldSetElement> & {
    /** Section heading text */
    legend?: string;
  }
>(({ className, legend, children, ...props }, ref) => (
  <fieldset
    ref={ref}
    className={cn("space-y-3 border-0 p-0 m-0", className)}
    {...props}
  >
    {legend && (
      <legend className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pb-1">
        {legend}
      </legend>
    )}
    {children}
  </fieldset>
));
SettingsGroup.displayName = "SettingsGroup";

/**
 * Individual settings field wrapper.
 *
 *  • `orientation="vertical"` (default) — label on top, control below.
 *    Good for sliders, textareas, custom renderers.
 *
 *  • `orientation="horizontal"` — label + description on the left,
 *    control anchored to the right.  Good for switches, checkboxes.
 *    Automatically stacks vertically when the container is narrow (<280px).
 */
const SettingsItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "vertical" | "horizontal";
  }
>(({ className, orientation = "vertical", ...props }, ref) => (
  <div
    ref={ref}
    data-orientation={orientation}
    className={cn(
      "group/settings-item",
      orientation === "horizontal"
        ? "flex flex-col gap-1.5 @min-[280px]:flex-row @min-[280px]:items-center @min-[280px]:justify-between @min-[280px]:gap-4"
        : "space-y-1.5",
      className,
    )}
    {...props}
  />
));
SettingsItem.displayName = "SettingsItem";

/**
 * Label + optional description block for a settings item.
 * Inside a horizontal item this takes up the left side.
 */
const SettingsItemLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 flex-1 space-y-0.5", className)}
    {...props}
  />
));
SettingsItemLabel.displayName = "SettingsItemLabel";

/**
 * Control slot for a settings item.
 * In horizontal layout, this is shrink-wrapped on the right.
 * In vertical layout, this is full-width.
 */
const SettingsItemControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("shrink-0", className)} {...props} />
));
SettingsItemControl.displayName = "SettingsItemControl";

export {
  FormField,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  SettingsForm,
  SettingsGroup,
  SettingsItem,
  SettingsItemLabel,
  SettingsItemControl,
};
