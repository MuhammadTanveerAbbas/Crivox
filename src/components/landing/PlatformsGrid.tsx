import { Linkedin, Twitter, MessageSquare, ImageIcon, Users, Globe } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const platforms = [
  { name: "LinkedIn", icon: Linkedin, desc: "Professional networking" },
  { name: "Twitter/X", icon: Twitter, desc: "Short-form social" },
  { name: "Reddit", icon: MessageSquare, desc: "Community forums" },
  { name: "Instagram", icon: ImageIcon, desc: "Visual platform" },
  { name: "Facebook", icon: Users, desc: "Social engagement" },
  { name: "Blog/Website", icon: Globe, desc: "Content comments" },
];

export const PlatformsGrid = () => (
  <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 max-w-6xl mx-auto">
    <ScrollReveal className="text-center mb-10 sm:mb-14">
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Works everywhere you engage
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        Comments tailored to each platform's style and best practices.
      </p>
    </ScrollReveal>

    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {platforms.map((p) => (
        <StaggerItem key={p.name}>
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <p.icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
              </div>
            </div>
          </div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </section>
);
