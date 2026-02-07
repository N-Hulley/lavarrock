import { ReactNode } from "react";

/**
 * Standard content area with consistent padding
 */
export function ContentArea({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Standard text content area with consistent padding and spacing
 */
export function TextArea({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`px-4 py-2 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Section header with standard spacing
 */
export function SectionHeader({ 
  children, 
  className = "" 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${className}`}>
      {children}
    </div>
  );
}
