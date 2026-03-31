import { useState } from "react";
import { Briefcase, Coffee, Smile, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";

const examples = [
  {
    tone: "Professional",
    Icon: Briefcase,
    text: "This is a compelling analysis. The data-driven approach really resonates with my experience in the industry.",
  },
  {
    tone: "Casual",
    Icon: Coffee,
    text: "Love this take! Totally agree  keeping it simple is the way to go. Shared it with my team!",
  },
  {
    tone: "Witty",
    Icon: Smile,
    text: "Finally, someone who gets it. If only my last startup had this memo pinned to the wall...",
  },
  {
    tone: "Supportive",
    Icon: Heart,
    text: "What an inspiring journey! Thanks for sharing  this will help so many people just starting out.",
  },
];

export const ToneExamples = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Same post, different voices
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            See how the tone changes everything about a comment.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8">
            {examples.map((e, i) => (
              <button
                key={e.tone}
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  active === i
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-card border border-border text-foreground hover:bg-accent"
                )}
              >
                <e.Icon className="h-3.5 w-3.5" />
                {e.tone}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                {(() => { const Icon = examples[active].Icon; return <Icon className="h-4 w-4 text-blue-500" />; })()}
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                  {examples[active].tone}
                </span>
              </div>
              <p className="text-foreground leading-relaxed text-sm sm:text-base">
                "{examples[active].text}"
              </p>
            </motion.div>
          </AnimatePresence>
        </ScrollReveal>
      </div>
    </section>
  );
};
