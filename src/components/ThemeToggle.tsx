import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-11 w-11" />;

  const isDark = resolvedTheme === "dark";

  return (
    <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px]" onClick={() => setTheme(isDark ? "light" : "dark")} title="Toggle theme">
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
