import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
      className="relative overflow-hidden"
    >
      <div className="relative w-5 h-5">
        <Sun 
          className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
            theme === "dark" 
              ? "rotate-0 scale-100 opacity-100" 
              : "rotate-90 scale-0 opacity-0"
          }`} 
        />
        <Moon 
          className={`h-5 w-5 absolute inset-0 transition-all duration-300 ${
            theme === "light" 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-90 scale-0 opacity-0"
          }`} 
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
