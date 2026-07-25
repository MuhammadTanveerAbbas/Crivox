import { useState } from "react";
import { Check, X, Minus, Sparkles, Palette, Camera, Layers, Globe, Mic, Timer, Calendar, Gift, ImageIcon, BarChart3 } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  { feature: "AI-generated comments", us: "yes", manual: "no", generic: "partial", icon: Sparkles },
  { feature: "Tone & platform matching", us: "yes", manual: "no", generic: "no", icon: Palette },
  { feature: "Screenshot-to-comment", us: "yes", manual: "no", generic: "no", icon: Camera },
  { feature: "Bulk generation", us: "yes", manual: "no", generic: "partial", icon: Layers },
  { feature: "11 platforms supported", us: "yes", manual: "no", generic: "no", icon: Globe },
  { feature: "Voice matching (AI Memory)", us: "yes", manual: "no", generic: "no", icon: Mic },
  { feature: "Image/URL input", us: "yes", manual: "yes", generic: "partial", icon: ImageIcon },
  { feature: "Time per comment", us: "~5 sec", manual: "2-5 min", generic: "~15 sec", icon: Timer },
  { feature: "Queue & scheduling", us: "yes", manual: "no", generic: "no", icon: Calendar },
  { feature: "Free tier", us: "yes", manual: "yes", generic: "partial", icon: Gift },
];

const cellVal = (v: string) => {
  if (v === "yes") return { icon: Check, cls: "text-green-500 bg-green-50 dark:bg-green-950/20" };
  if (v === "no") return { icon: X, cls: "text-muted-foreground bg-muted/30" };
  if (v === "partial") return { icon: Minus, cls: "text-muted-foreground bg-muted/30" };
  return null;
};

const renderIcon = (v: string) => {
  const m = cellVal(v);
  if (!m) return <span className="text-xs sm:text-sm text-foreground font-medium">{v}</span>;
  const Icon = m.icon;
  return (
    <div className={cn("inline-flex items-center justify-center h-6 w-6 rounded-full", m.cls)}>
      <Icon className="h-3 w-3" />
    </div>
  );
};

export const ComparisonTable = () => {
  const [mobileView, setMobileView] = useState<"crivox" | "manual" | "generic">("crivox");

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-5xl mx-auto">
      <ScrollReveal className="text-center mb-10 sm:mb-12">
        <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-4">
          <BarChart3 className="h-3 w-3" />
          Side-by-side
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
          How we compare
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          An honest look at Crivox vs. doing it yourself or using generic AI tools.
        </p>
      </ScrollReveal>

      {/* Desktop table */}
      <ScrollReveal className="hidden sm:block">
        <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="text-foreground font-medium text-xs min-w-[140px] py-4">Feature</TableHead>
                <TableHead className="text-center text-xs font-semibold text-white bg-primary py-4 min-w-[80px]">Crivox</TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground py-4 min-w-[80px]">Manual</TableHead>
                <TableHead className="text-center text-xs font-medium text-muted-foreground py-4 min-w-[90px]">Generic AI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
          {features.map((row, i) => {
                const Icon = row.icon;
                return (
                  <TableRow key={row.feature} className={cn(i % 2 === 0 ? "bg-card hover:bg-accent/50" : "bg-muted/30 hover:bg-accent/50", "transition-colors")}>
                    <TableCell className="text-xs sm:text-sm text-foreground font-medium py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                        {row.feature}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-3.5 bg-blue-50/10 dark:bg-blue-900/10">{renderIcon(row.us)}</TableCell>
                    <TableCell className="text-center py-3.5">{renderIcon(row.manual)}</TableCell>
                    <TableCell className="text-center py-3.5">{renderIcon(row.generic)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </ScrollReveal>

      {/* Mobile tabbed view */}
      <ScrollReveal className="sm:hidden">
        <div className="flex bg-muted rounded-xl p-1 mb-4">
          {([
            { key: "crivox" as const, label: "Crivox" },
            { key: "manual" as const, label: "Manual" },
            { key: "generic" as const, label: "Generic AI" },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMobileView(tab.key)}
              className={cn(
                "flex-1 text-xs font-medium py-2.5 rounded-lg transition-all duration-150 min-h-[38px]",
                mobileView === tab.key
                  ? "bg-card text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          {features.map((row, i) => {
            const Icon = row.icon;
            const vals = { crivox: row.us, manual: row.manual, generic: row.generic };
            const currentVal = vals[mobileView];
            const isBest = mobileView === "crivox" && currentVal === "yes";
            const isWorst = currentVal === "no";

            return (
              <motion.div
                key={row.feature}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: i * 0.02 }}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-150",
                  isBest
                    ? "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20"
                    : isWorst
                      ? "border-border bg-card/50"
                      : "border-border bg-card"
                )}
              >
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{row.feature}</p>
                </div>
                <div className="shrink-0">
                  {renderIcon(currentVal)}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> Yes
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /> No
          </span>
          <span className="flex items-center gap-1">
            <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" /> Partial
          </span>
        </div>
      </ScrollReveal>
    </section>
  );
};
