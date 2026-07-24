import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <ScrollReveal className="max-w-4xl mx-auto">
        <div className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-white/15 text-white rounded-full px-3 py-1 text-xs font-medium mb-5">
              <Sparkles className="h-3 w-3" />
              Free to start, no credit card
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4 tracking-tight">
              Ready to write better comments?
            </h2>
            <p className="text-blue-200 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
              Sign up free and generate your first comment in under a minute.
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-700 hover:bg-white/90 rounded-xl px-8 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => navigate("/login")}
            >
              Get started free <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
};
