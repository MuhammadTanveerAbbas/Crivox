import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import {
  History, Settings, Menu, X,
  Zap, LayoutGrid, BookOpen, BarChart3, ChevronRight,
  PanelLeftClose, PanelLeft, CalendarClock, LogOut,
} from "lucide-react";
import CrivoxIcon from "@/components/CrivoxIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import OnboardingTour from "@/components/OnboardingTour";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { label: "Generator", icon: Zap, path: "/dashboard", tourId: "generator" },
  { label: "Bulk Generate", icon: LayoutGrid, path: "/dashboard/bulk", tourId: "bulk" },
  { label: "Queue", icon: CalendarClock, path: "/dashboard/queue", tourId: "queue" },
  { label: "Templates", icon: BookOpen, path: "/dashboard/templates", tourId: "templates" },
  { label: "Stats", icon: BarChart3, path: "/dashboard/stats", tourId: "stats" },
  { label: "History", icon: History, path: "/dashboard/history", tourId: "history" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings", tourId: "settings" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.email?.split("@")[0] || null);
      });
  }, [user]);

  const currentPage = navItems.find((item) => item.path === location.pathname);
  const breadcrumbs = [
    { label: "Dashboard", path: "/dashboard" },
    ...(currentPage && currentPage.path !== "/dashboard"
      ? [{ label: currentPage.label, path: currentPage.path }]
      : []),
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen flex bg-background">
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed md:static inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border transition-all duration-200 shrink-0",
            isMobile
              ? cn("w-64", mobileOpen ? "translate-x-0" : "-translate-x-full")
              : cn(collapsed ? "w-[60px]" : "w-56", "translate-x-0")
          )}
        >
          {/* Logo */}
          <div className={cn(
            "flex items-center border-b border-border h-14",
            collapsed && !isMobile ? "justify-center px-2" : "gap-2.5 px-5"
          )}>
            <CrivoxIcon size={collapsed && !isMobile ? 28 : 28} />
            {(!collapsed || isMobile) && (
              <span className="font-display text-lg text-foreground truncate">Crivox</span>
            )}
            {isMobile && (
              <Button variant="ghost" size="icon" className="ml-auto h-7 w-7" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Nav */}
          <nav className={cn("flex-1 py-3 space-y-0.5", collapsed && !isMobile ? "px-1.5" : "px-3")}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const btn = (
                <button
                  key={item.path}
                  data-tour={item.tourId}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={cn(
                    "flex items-center w-full rounded-xl text-sm",
                    collapsed && !isMobile ? "justify-center h-9 w-9 mx-auto" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-blue-600/10 text-blue-600 font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {(!collapsed || isMobile) && item.label}
                </button>
              );

              if (collapsed && !isMobile) {
                return (
                  <Tooltip key={item.path}>
                    <TooltipTrigger asChild>{btn}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return btn;
            })}
          </nav>

          {/* Collapse toggle */}
          {!isMobile && (
            <div className="px-3 pb-4 space-y-1">
              {/* Sign out */}
              {(!collapsed || isMobile) && (
                <button
                  onClick={async () => { await supabase.auth.signOut(); navigate("/", { replace: true }); }}
                  className="flex items-center gap-3 w-full rounded-xl text-sm text-muted-foreground px-3 py-2 hover:text-foreground transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Sign out</span>
                </button>
              )}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "flex items-center w-full rounded-xl text-sm text-muted-foreground",
                  collapsed ? "justify-center h-9 w-9 mx-auto" : "gap-3 px-3 py-2"
                )}
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /><span>Collapse</span></>}
              </button>
            </div>
          )}
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Topbar */}
          <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 border-b border-border bg-card shrink-0">
            <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setMobileOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>

            <nav className="hidden md:flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={cn(
                      i === breadcrumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </nav>

            <span className="text-sm font-medium text-foreground md:hidden">Crivox</span>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => navigate("/dashboard/settings")}
                className="flex items-center gap-2.5 text-left"
              >
                <div className="hidden sm:block min-w-0 text-right">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {displayName || user?.email?.split("@")[0] || "User"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate leading-tight">
                    {user?.email || ""}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 text-xs font-semibold shrink-0">
                  {(displayName || user?.email)?.[0]?.toUpperCase() ?? "U"}
                </div>
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-5 md:p-6 overflow-auto min-w-0">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        <OnboardingTour />
      </div>
    </TooltipProvider>
  );
};

export default DashboardLayout;
