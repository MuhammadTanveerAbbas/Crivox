import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import CrivoxIcon from "@/components/CrivoxIcon";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "How it works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Pricing", id: "pricing", route: "/pricing" },
];

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
    <nav
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-background/50 backdrop-blur-md"
      )}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 max-w-6xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigate("/")}>
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CrivoxIcon size={20} />
          </div>
          <span className="font-display text-xl text-foreground tracking-tight">Crivox</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 bg-accent/30 backdrop-blur-sm rounded-2xl px-2 py-1 border border-border/50">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item)}
              className="relative px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-background/80 transition-all duration-200 font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-xl"
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 rounded-xl px-5 py-2 text-sm font-medium shadow-sm"
            onClick={() => navigate("/login")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-1 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-xl">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-background/95 backdrop-blur-xl border-border">
              <div className="flex flex-col gap-1 mt-8">
                <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <CrivoxIcon size={20} />
                  </div>
                  <span className="font-display text-base text-foreground">Crivox</span>
                </div>
                {navLinks.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item)}
                    className="text-left px-3 py-3 min-h-[44px] text-sm text-muted-foreground rounded-xl hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="border-t border-border mt-3 pt-3 space-y-2 px-1">
                  <Button variant="outline" className="w-full rounded-xl" onClick={() => { navigate("/login"); setOpen(false); }}>
                    Log in
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 rounded-xl shadow-sm" onClick={() => { navigate("/login"); setOpen(false); }}>
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
