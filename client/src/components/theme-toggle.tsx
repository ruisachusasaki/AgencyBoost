import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="p-2"
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          ) : (
            <Sun className="h-5 w-5 text-slate-600 dark:text-slate-300" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Switch to {theme === "light" ? "dark" : "light"} mode</p>
      </TooltipContent>
    </Tooltip>
  );
}
