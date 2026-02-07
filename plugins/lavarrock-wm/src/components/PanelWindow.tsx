import { ReactNode } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@lavarrock/ui";
import { X, Minus, Maximize2 } from "lucide-react";

interface PanelWindowProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  headerActions?: ReactNode;
  className?: string;
}

export function PanelWindow({
  title,
  children,
  onClose,
  onMinimize,
  onMaximize,
  headerActions,
  className = "",
}: PanelWindowProps) {
  return (
    <Card className={`border-border bg-card flex flex-col ${className}`}>
      <CardHeader className="panel-drag-handle flex-row items-center justify-between space-y-0 border-b border-border pb-2 pt-2">
        <CardTitle className="text-sm text-card-foreground">{title}</CardTitle>
        <div className="flex items-center gap-1">
          {headerActions}
          {onMinimize && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onMinimize}
            >
              <Minus className="h-3 w-3" />
            </Button>
          )}
          {onMaximize && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onMaximize}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
          {onClose && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-3">{children}</CardContent>
    </Card>
  );
}
