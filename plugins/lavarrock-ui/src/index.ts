// ─── Re-export everything for direct imports ─────
// Other plugins should use namespace-as-component (<lavarrock.ui.Button />)
// but this barrel export is available for the host app and tests.

export {
  Badge,
  badgeVariants,
  type BadgeProps,
} from "./resources/components/Badge";
export {
  Button,
  buttonVariants,
  type ButtonProps,
} from "./resources/components/Button";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./resources/components/Card";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./resources/components/Dialog";
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "./resources/components/Drawer";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./resources/components/DropdownMenu";
export { Input } from "./resources/components/Input";
export { Label } from "./resources/components/Label";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./resources/components/Select";
export { Separator } from "./resources/components/Separator";
export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./resources/components/Tabs";
export { Textarea } from "./resources/components/Textarea";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./resources/components/Tooltip";

// Utility
export { cn } from "./lib/utils";

// Theme
export {
  mapVSCodeThemeToCSS,
  applyThemeToDOM,
  loadActiveTheme,
  applyVSCodeTheme,
} from "./lib/theme";
export type { ThemeColors } from "./lib/theme";
