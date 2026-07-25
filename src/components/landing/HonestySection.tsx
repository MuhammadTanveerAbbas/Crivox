import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, AlertTriangle, ArrowRight } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const pros = [
  "Writing platform-appropriate comments in seconds",
  "Matching your personal voice from samples you provide",
  "Generating 3-5 variations so you can pick the best one",
  "Bulk generating dozens of comments at once",
];

const cons = [
  "No auto-posting, you copy paste manually to each platform",
  "AI can occasionally sound generic, always review before posting",
  "Early stage with some rough edges and missing features",
  "Not built for long-form content, essays, or articles",
];

export const HonestySection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/20">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal className="text-center mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-xs font-medium text-amber-700 dark:text-amber-400 mb-4">
            <AlertTriangle className="h-3 w-3" />
            Real talk
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            The honest truth
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
            No fluff, no fake promises. Here is what Crivox actually does well, and what it does not.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 gap-5 sm:gap-7">
          <StaggerItem>
            <motion.div
              whileHover={{ y: -3 }}
              className="relative bg-card border-2 border-green-200/70 dark:border-green-800/40 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                    <ThumbsUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">Good at</span>
                </div>
                <ul className="space-y-3.5">
                  {pros.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/85 leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div
              whileHover={{ y: -3 }}
              className="relative bg-card border-2 border-red-200/70 dark:border-red-800/40 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-950/10 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-sm">
                    <ThumbsDown className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">Not for</span>
                </div>
                <ul className="space-y-3.5">
                  {cons.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-foreground/85 leading-relaxed">
                      <span className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mt-0.5 shrink-0">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        <ScrollReveal className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-2xl px-6 py-3.5 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/login")}>
            <p className="text-sm text-muted-foreground">
              We would rather lose a sale than have you buy something that does not fit.
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-primary ml-1">
              Try it free <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
