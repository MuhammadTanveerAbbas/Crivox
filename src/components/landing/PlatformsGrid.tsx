import { Linkedin, Twitter, MessageSquare, ImageIcon, Users, Globe, Github, Hash, ExternalLink, MessageCircle } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const platforms = [
  { name: "LinkedIn", icon: Linkedin, desc: "Professional networking" },
  { name: "Twitter/X", icon: Twitter, desc: "Short-form social" },
  { name: "Reddit", icon: MessageSquare, desc: "Community forums" },
  { name: "Instagram", icon: ImageIcon, desc: "Visual platform" },
  { name: "Facebook", icon: Users, desc: "Social engagement" },
  { name: "Blog/Website", icon: Globe, desc: "Content comments" },
  { name: "Hacker News", icon: ExternalLink, desc: "Tech discussions" },
  { name: "Indie Hackers", icon: MessageCircle, desc: "Maker community" },
  { name: "GitHub", icon: Github, desc: "Code collaboration" },
  { name: "Threads", icon: Hash, desc: "Conversational posts" },
];

export const PlatformsGrid = () => (
  <section id="features" className="px-4 sm:px-6 py-16 sm:py-24 max-w-6xl mx-auto">
    <ScrollReveal className="text-center mb-10 sm:mb-14">
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        Works on all 10 platforms you engage on
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        Comments tailored to each platform's culture, norms, and best practices.
      </p>
    </ScrollReveal>

    <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {platforms.map((p) => (
        <StaggerItem key={p.name}>
          <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 hover:border-primary/20 transition-all duration-200 cursor-default">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                <p.icon className="h-5 w-5 text-primary" />
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
