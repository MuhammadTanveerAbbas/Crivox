import { Sparkles, Palette, Globe, Layers, Mic, ImageIcon, Timer, Shield, Zap } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Comments",
    desc: "Generate platform-aware comments in seconds. Just paste a post and let AI do the heavy lifting.",
    gradient: "from-blue-500 to-blue-600",
    border: "border-blue-200 dark:border-blue-900",
    bg: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    icon: Palette,
    title: "8 Tone Styles",
    desc: "Professional, Casual, Witty, Supportive, Bold, Educational, Insightful, Authoritative. Pick your voice.",
    gradient: "from-violet-500 to-violet-600",
    border: "border-violet-200 dark:border-violet-900",
    bg: "bg-violet-50 dark:bg-violet-950/20",
  },
  {
    icon: Globe,
    title: "11 Platforms",
    desc: "LinkedIn, Twitter/X, Instagram, Facebook, Reddit, Hacker News, Indie Hackers, GitHub, Medium, Threads, Blog.",
    gradient: "from-emerald-500 to-emerald-600",
    border: "border-emerald-200 dark:border-emerald-900",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
  },
  {
    icon: Layers,
    title: "Bulk Generation",
    desc: "Generate comments for up to 5 posts at once. Save hours of manual writing.",
    gradient: "from-amber-500 to-amber-600",
    border: "border-amber-200 dark:border-amber-900",
    bg: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    icon: Mic,
    title: "Voice Profile",
    desc: "Train AI on your past comments so every output sounds like you, not a robot.",
    gradient: "from-rose-500 to-rose-600",
    border: "border-rose-200 dark:border-rose-900",
    bg: "bg-rose-50 dark:bg-rose-950/20",
  },
  {
    icon: ImageIcon,
    title: "Image & URL Input",
    desc: "Upload a screenshot or paste a URL. Crivox extracts context and generates relevant comments.",
    gradient: "from-cyan-500 to-cyan-600",
    border: "border-cyan-200 dark:border-cyan-900",
    bg: "bg-cyan-50 dark:bg-cyan-950/20",
  },
];

const colorMap: Record<string, string> = {
  "from-blue-500 to-blue-600": "text-blue-500",
  "from-violet-500 to-violet-600": "text-violet-500",
  "from-emerald-500 to-emerald-600": "text-emerald-500",
  "from-amber-500 to-amber-600": "text-amber-500",
  "from-rose-500 to-rose-600": "text-rose-500",
  "from-cyan-500 to-cyan-600": "text-cyan-500",
};

export const FeaturesSection = () => (
  <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto">
    <ScrollReveal className="text-center mb-12 sm:mb-16">
      <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-4">
        <Zap className="h-3 w-3" />
        Everything you need
      </div>
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Built for people who comment daily
      </h2>
      <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
        Crivox combines AI with deep platform knowledge to help you write comments that actually fit in.
      </p>
    </ScrollReveal>

    <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {features.map((f) => {
        const textColor = colorMap[f.gradient] || "text-primary";
        return (
          <StaggerItem key={f.title}>
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              className={cn(
                "group relative bg-card border rounded-2xl p-5 sm:p-6 h-full transition-all duration-300",
                f.border,
                "shadow-sm hover:shadow-lg"
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                f.bg
              )} />
              <div className="relative">
                <div className={cn(
                  "h-10 w-10 rounded-xl bg-gradient-to-br shadow-sm flex items-center justify-center mb-4",
                  f.gradient,
                  "text-white"
                )}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className={cn("font-semibold text-foreground mb-2 text-base", textColor)}>
                  {f.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  </section>
);
