import { Link, Zap, MessageSquare } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const steps = [
  {
    icon: Link,
    step: "01",
    title: "Provide content",
    desc: "Paste text, a URL (as reference), or upload an image of any social media post.",
  },
  {
    icon: Zap,
    step: "02",
    title: "Choose your style",
    desc: "Pick a tone, length, and platform. Fine-tune exactly how you want to sound.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Get variations",
    desc: "AI generates multiple unique comments. Copy your favorite with one click.",
  },
];

export const HowItWorks = () => (
  <section id="how-it-works" className="px-4 sm:px-6 py-16 sm:py-24 max-w-6xl mx-auto">
    <ScrollReveal className="text-center mb-12 sm:mb-16">
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        How it works
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        From content to comment in under 10 seconds.
      </p>
    </ScrollReveal>

    <StaggerContainer className="grid sm:grid-cols-3 gap-8 relative">
      <div className="hidden sm:block absolute top-8 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] border-t border-dashed border-border" />

      {steps.map((s) => (
        <StaggerItem key={s.step}>
          <div className="text-center relative">
            <div className="relative inline-flex mb-5">
              <div className="h-14 w-14 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center">
                <s.icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-xs font-mono font-semibold text-blue-500 mb-2 tracking-wider">{s.step}</div>
            <h3 className="font-semibold text-foreground mb-2 text-base">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.desc}</p>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </section>
);
