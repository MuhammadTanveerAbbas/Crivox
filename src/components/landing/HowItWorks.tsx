import { Link, Zap, MessageSquare } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: Link,
    step: "01",
    title: "Provide content",
    desc: "Paste text, a URL, or upload an image of any social media post.",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    border: "border-blue-200 dark:border-blue-900",
    glow: "shadow-blue-500/10",
  },
  {
    icon: Zap,
    step: "02",
    title: "Choose your style",
    desc: "Pick a tone, length, and platform. Fine-tune exactly how you want to sound.",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    border: "border-violet-200 dark:border-violet-900",
    glow: "shadow-violet-500/10",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Get variations",
    desc: "AI generates multiple unique comments. Copy your favorite with one click.",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    border: "border-amber-200 dark:border-amber-900",
    glow: "shadow-amber-500/10",
  },
];

export const HowItWorks = () => (
  <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24 max-w-7xl mx-auto">
    <ScrollReveal className="text-center mb-12 sm:mb-16">
      <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-4">
        <Zap className="h-3 w-3" />
        3 simple steps
      </div>
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        From content to comment in seconds
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        No learning curve. Just paste, pick, and publish.
      </p>
    </ScrollReveal>

    <StaggerContainer className="grid sm:grid-cols-3 gap-5 sm:gap-8 relative">
      <div className="hidden sm:block absolute top-12 left-[calc(16.67%+2.5rem)] right-[calc(16.67%+2.5rem)] h-px bg-gradient-to-r from-blue-500/40 via-violet-500/40 to-amber-500/40" />

      {steps.map((s) => (
        <StaggerItem key={s.step}>
          <motion.div
            whileHover={{ y: -4 }}
            className="relative group h-full"
          >
            <div className={cn(
              "relative bg-card border rounded-2xl p-6 sm:p-7 h-full flex flex-col items-center text-center transition-all duration-300",
              s.border,
              "shadow-sm hover:shadow-md",
              s.glow
            )}>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "h-14 w-14 rounded-2xl bg-gradient-to-br shadow-sm flex items-center justify-center mb-4",
                  s.gradient,
                  s.border,
                  "border"
                )}>
                  <s.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="text-xs font-mono font-semibold tracking-wider mb-2 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                  {s.step}
                </div>
                <h3 className="font-semibold text-foreground mb-2 text-base">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            </div>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </section>
);
