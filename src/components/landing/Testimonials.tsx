import { MessageSquare } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

export const Testimonials = () => (
  <section className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/30">
    <div className="max-w-2xl mx-auto text-center">
      <ScrollReveal>
        <div className="h-12 w-12 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-medium tracking-tight text-foreground mb-4">
            Early access — be the first
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Crivox is new. We don't have testimonials yet — and we won't fake them.
            Try it yourself and see if it works for you.
          </p>
      </ScrollReveal>
    </div>
  </section>
);
