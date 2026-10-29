import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import PageTransition from "@/components/PageTransition";
import {
  History, Settings, Zap, LayoutGrid, BookOpen, BarChart3, ChevronRight,
  PanelLeftClose, PanelLeft, LogOut,
} from "lucide-react";
import CrivoxIcon from "@/components/CrivoxIcon";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import OnboardingQuestionnaire from "@/components/OnboardingQuestionnaire";

// Nav sections for the sidebar
const mainNav = [
  { label: "Dashboard", icon: BarChart3, path: "/dashboard", tourId: "dashboard", color: "sky" },
  { label: "Generator", icon: Zap, path: "/dashboard/generate", tourId: "generator", color: "violet" },
  { label: "Bulk", icon: LayoutGrid, path: "/dashboard/bulk", tourId: "bulk", color: "emerald" },
];

const contentNav = [
  { label: "Templates", icon: BookOpen, path: "/dashboard/templates", tourId: "templates", color: "amber" },
  { label: "History", icon: History, path: "/dashboard/history", tourId: "history", color: "rose" },
];

const accountNav = [
  { label: "Settings", icon: Settings, path: "/dashboard/settings", tourId: "settings", color: "slate" },
];

const allNavItems = [...mainNav, ...contentNav, ...accountNav];

const bottomBarItems = [
  { label: "Dashboard", icon: BarChart3, path: "/dashboard", color: "sky" },
  { label: "Generator", icon: Zap, path: "/dashboard/generate", color: "violet" },
  { label: "Bulk", icon: LayoutGrid, path: "/dashboard/bulk", color: "emerald" },
  { label: "History", icon: History, path: "/dashboard/history", color: "rose" },
  { label: "Settings", icon: Settings, path: "/dashboard/settings", color: "slate" },
];

// Full Tailwind class strings (purge-safe)
const colorMap: Record<string, { bg: string; text: string }> = {
  sky:     { bg: "bg-sky-500/10",     text: "text-sky-500" },
  violet:  { bg: "bg-violet-500/10",  text: "text-violet-500" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  amber:   { bg: "bg-amber-500/10",   text: "text-amber-500" },
  rose:    { bg: "bg-rose-500/10",    text: "text-rose-500" },
  slate:   { bg: "bg-slate-500/10",   text: "text-slate-500" },
};

interface NavItemProps {
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  tourId?: string;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}

const SidebarNavItem = ({ label, icon: Icon, color, tourId, isActive, collapsed, onClick }: NavItemProps) => {
  const colors = colorMap[color] ?? colorMap["slate"]!;
  const { bg, text } = colors;
  const btn = (
    <button
      data-tour={tourId}
      onClick={onClick}
      className={cn(
        "group flex items-center w-full rounded-xl text-sm transition-all duration-150",
        collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5 min-h-[42px]",
        isActive
          ? "bg-white shadow-sm ring-1 ring-[#e2e4e9]"
          : "hover:bg-white/80"
      )}
    >
      <div className={cn(
        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
        bg,
        isActive
          ? "scale-110 shadow-[inset_0_1px_0_rgba(255,255,255,0.40),0_2px_4px_rgba(0,0,0,0.20)]"
          : "shadow-[inset_0_1px_0_rgba(255,255,255,0.20),0_1px_2px_rgba(0,0,0,0.15)] group-hover:scale-105"
      )}>
        <Icon className={cn("h-4 w-4", text)} />
      </div>
      {!collapsed && (
        <span className={cn(
          "transition-colors duration-150 text-sm",
          isActive ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"
        )}>
          {label}
        </span>
      )}
    </button>
  );

  if (collapsed) {
    return (
      <Tooltip key={label}>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8} className="text-xs font-medium">{label}</TooltipContent>
      </Tooltip>
    );
  }
  return btn;
};

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

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

  useEffect(() => {
    if (!user || (location.pathname !== "/dashboard" && location.pathname !== "/dashboard/generate")) return;
    supabase
      .from("profiles")
      .select("has_onboarded")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data: profile }) => {
        if (!profile?.has_onboarded) setShowQuestionnaire(true);
      });
  }, [user, location.pathname]);

  const currentPage = allNavItems.find((item) => item.path === location.pathname);
  const breadcrumbs = [
    { label: "Dashboard", path: "/dashboard" },
    ...(currentPage && currentPage.path !== "/dashboard"
      ? [{ label: currentPage.label, path: currentPage.path }]
      : []),
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  // Render a section only ONE divider above section label (no double lines)
  const renderSection = (items: typeof mainNav, label?: string, withDivider = false) => (
    <>
      {withDivider && <div className="my-2 border-t border-[#e2e4e9] dark:border-[#2a2f3a] mx-1" />}
      {label && !collapsed && (
        <p className="px-3 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-foreground select-none">
          {label}
        </p>
      )}
      <div className="space-y-0.5">
        {items.map((item) => (
          <SidebarNavItem
            key={item.path}
            {...item}
            isActive={location.pathname === item.path}
            collapsed={collapsed}
            onClick={() => navigate(item.path)}
          />
        ))}
      </div>
    </>
  );

  return (
    <TooltipProvider delayDuration={0}>
      {/* Full viewport container no overflow on root */}
      <div className="h-screen flex overflow-hidden bg-background">

        {/* ── Desktop Sidebar ── */}
        <aside
          className={cn(
            "hidden md:flex flex-col shrink-0 transition-all duration-200 overflow-hidden",
            "bg-[#f4f5f7] dark:bg-[#161b22]",
            "border-r border-[#e2e4e9] dark:border-[#2a2f3a]",
            collapsed ? "w-[60px]" : "w-[220px]"
          )}
        >
          {/* Logo */}
          <div className={cn(
            "flex items-center h-14 border-b border-[#e2e4e9] dark:border-[#2a2f3a] shrink-0",
            collapsed ? "justify-center px-2" : "gap-2.5 px-5"
          )}>
            <CrivoxIcon size={26} />
            {!collapsed && (
              <span className="font-display text-base font-semibold text-foreground truncate">Crivox</span>
            )}
          </div>

          {/* Menu label */}
          {!collapsed && (
            <div className="px-5 pt-4 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-foreground select-none">
                Menu
              </p>
            </div>
          )}

          {/* Nav scrollable */}
          <nav className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-1",
            collapsed ? "px-1.5" : "px-3"
          )}>
            {renderSection(mainNav)}
            {renderSection(contentNav, "Content", true)}
            {renderSection(accountNav, "Account", true)}
          </nav>

          {/* Collapse toggle only */}
          <div className={cn(
            "pb-4 pt-2 border-t border-[#e2e4e9] dark:border-[#2a2f3a]",
            collapsed ? "px-1.5 flex justify-center" : "px-3"
          )}>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "flex items-center rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-white/80 transition-all duration-150",
                collapsed ? "justify-center h-10 w-10" : "gap-3 px-3 py-2.5 w-full"
              )}
            >
              {collapsed
                ? <PanelLeft className="h-4 w-4" />
                : <><PanelLeftClose className="h-4 w-4" /><span className="text-sm">Collapse</span></>
              }
            </button>
          </div>
        </aside>

        {/* ── Main content column ── */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden"
        )}>
          {/* Topbar */}
          <header className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 h-14 border-b border-border bg-card shrink-0">
            {/* Mobile: Crivox brand */}
            <div className="flex items-center gap-2 md:hidden">
              <CrivoxIcon size={24} />
              <span className="font-display text-base font-semibold text-foreground">Crivox</span>
            </div>

            {/* Desktop: Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.path} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                  <button
                    onClick={() => navigate(crumb.path)}
                    className={cn(
                      "hover:text-foreground transition-colors",
                      i === breadcrumbs.length - 1
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </nav>

            {/* Right: Avatar dropdown */}
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-all duration-150 hover:scale-105
                    bg-muted border border-border hover:bg-muted/80">
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="7" r="3.2" fill="currentColor" opacity="0.7" className="text-muted-foreground"/>
                      <path d="M3.5 17c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" className="text-muted-foreground" opacity="0.6"/>
                    </svg>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Scrollable main area */}
          <main className={cn(
            "flex-1 overflow-x-hidden scrollbar-none",
            // Generator page: no scroll, no padding component owns its own layout
            location.pathname === "/dashboard/generate"
              ? "overflow-hidden p-0"
              : "overflow-y-auto p-4 sm:p-5 md:p-6 pb-20 md:pb-6"
          )}>
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        {/* ── Mobile Bottom Bar ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="flex items-stretch h-16">
            {bottomBarItems.map((item) => {
              const isActive = location.pathname === item.path;
              const colors = colorMap[item.color] ?? colorMap["slate"]!;
              const { bg, text } = colors;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 active:scale-95 transition-transform duration-100 relative"
                >
                  {/* Active: white pill background around icon */}
                  <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-200",
                    bg,
                    "shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.10)]",
                    isActive && [
                      "scale-110",
                      "ring-1 ring-border",
                      "bg-white dark:bg-white/10",
                      "shadow-sm",
                    ]
                  )}>
                    <item.icon className={cn(
                      "h-3.5 w-3.5 transition-colors duration-150",
                      isActive ? text : "text-muted-foreground"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[9px] leading-none font-medium transition-colors duration-150",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {showQuestionnaire && user && (
          <OnboardingQuestionnaire
            user={user}
            onComplete={() => setShowQuestionnaire(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default DashboardLayout;
