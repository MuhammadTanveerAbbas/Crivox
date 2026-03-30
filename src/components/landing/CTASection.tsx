import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-24">
      <ScrollReveal className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-12 md:p-16 text-center shadow-xl">
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-4 tracking-tight">
            Ready to write better comments?
          </h2>
          <p className="text-blue-200 mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed text-sm sm:text-base">
            Sign up free and generate your first comment in under a minute.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-700 rounded-xl px-8 font-medium shadow-sm"
            onClick={() => navigate("/login")}
          >
            Get started free <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
          <p className="text-blue-300 text-xs mt-5">No credit card required</p>
        </div>
      </ScrollReveal>
    </section>
  );
};
