import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Shield, Zap, Clock } from "lucide-react";
import { motion } from "framer-motion";

const sampleComments = [
  "Great analysis — the data on retention really stands out. Have you seen similar patterns in B2C?",
  "This resonates. We tried a similar approach last quarter and the results were surprisingly positive.",
  "Bookmarking this. The framework you outlined in point 3 is exactly what our team needs right now.",
];

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--accent)),transparent)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 md:pt-28 pb-16 sm:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium mb-5 sm:mb-6">
              <Zap className="h-3 w-3" />
              AI-powered comment generation
            </div>

            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-foreground leading-[1.08] mb-4 sm:mb-5">
              Write better comments,{" "}
              <span className="text-blue-600">in seconds.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-md leading-relaxed mb-7 sm:mb-8">
              Paste any social media post and get thoughtful, platform-aware
              comments tailored to your voice. No more blank reply boxes.
            </p>

            <div className="flex flex-wrap gap-3 mb-8 sm:mb-10">
              <Button
                size="lg"
                className="bg-blue-600 text-white rounded-xl px-5 sm:px-6 font-medium shadow-sm"
                onClick={() => navigate("/login")}
              >
                Start for free <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl px-5 sm:px-6 font-medium"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
              >
                See how it works
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              {[
                { icon: Zap, text: "Up to 5 variations per generation" },
                { icon: Shield, text: "Free to start" },
                { icon: Clock, text: "Results in seconds" },
              ].map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-blue-400" />
                  {text}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: Demo card */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-4 lg:mt-0"
          >
            <div className="bg-card border border-border rounded-2xl shadow-md p-4 sm:p-6">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 mb-4 sm:mb-5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <div className="ml-3 flex-1 h-6 rounded-md bg-muted border border-border flex items-center px-3 min-w-0">
                  <span className="text-xs text-muted-foreground truncate">linkedin.com/posts/...</span>
                </div>
              </div>

              {/* Input area */}
              <div className="h-14 sm:h-16 rounded-xl bg-muted border border-border ring-2 ring-blue-100 dark:ring-blue-900 flex items-start p-3 mb-4">
                <span className="text-sm text-muted-foreground">Paste post content here...</span>
              </div>

              {/* Generated comments */}
              <div className="space-y-2 sm:space-y-2.5">
                {sampleComments.map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                    className="flex items-start gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-muted border border-border hover:shadow-sm transition-all duration-200"
                  >
                    <span className="text-xs font-semibold text-blue-600 mt-0.5 shrink-0 w-4">{i + 1}</span>
                    <p className="text-xs text-foreground leading-relaxed flex-1 min-w-0">{text}</p>
                    <Copy className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0 hover:text-foreground cursor-pointer transition-colors" />
                  </motion.div>
                ))}
              </div>

              {/* Platform pills */}
              <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                {["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit" ].map((p, i) => (
                  <span
                    key={p}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${i === 0 ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground"}`}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
