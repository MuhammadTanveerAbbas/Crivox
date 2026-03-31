import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageSquare } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const navLinks = [
  { label: "Features", id: "features", route: null },
  { label: "How It Works", id: "how-it-works", route: null },
  { label: "Pricing", id: "pricing", route: "/pricing" },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const handleNav = (item: typeof navLinks[0]) => {
    setOpen(false);
    if (item.route) {
      navigate(item.route);
    } else {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl text-foreground tracking-tight">Crivox</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/login")}>
            Log in
          </Button>
          <Button size="sm" className="bg-blue-600 text-white rounded-xl px-4 py-2 text-sm font-medium" onClick={() => navigate("/login")}>
            Get Started
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background border-border">
              <div className="flex flex-col gap-1 mt-8">
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className="text-left px-3 py-2.5 text-sm text-muted-foreground rounded-lg hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border mt-3 pt-3 space-y-2">
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => { navigate("/login"); setOpen(false); }}>
                    Log in
                  </Button>
                  <Button className="w-full bg-blue-600 text-white rounded-xl" onClick={() => { navigate("/login"); setOpen(false); }}>
                    Get Started
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
