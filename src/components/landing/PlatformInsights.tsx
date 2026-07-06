import { Linkedin, Twitter, Instagram, Facebook, MessageSquare, Globe } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const platforms = [
  { name: "LinkedIn", icon: Linkedin, detail: "Thoughtful, professional replies" },
  { name: "Twitter/X", icon: Twitter, detail: "Concise, punchy responses" },
  { name: "Instagram", icon: Instagram, detail: "Engaging, visual-friendly comments" },
  { name: "Facebook", icon: Facebook, detail: "Conversational community tone" },
  { name: "Reddit", icon: MessageSquare, detail: "Thread-aware, authentic replies" },
  { name: "Blog/Website", icon: Globe, detail: "Long-form, substantive feedback" },
];

const tones = [
  "Professional",
  "Casual",
  "Witty",
  "Supportive",
  "Bold",
  "Educational",
  "Insightful",
  "Authoritative",
];

export const PlatformInsights = () => (
  <section className="px-4 sm:px-6 py-16 sm:py-24 bg-background">
    <div className="max-w-5xl mx-auto">
      <ScrollReveal className="text-center mb-10 sm:mb-14">
        <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
          Works where you work
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Six platforms and eight tone styles built in. Pick the combo that fits each post.
        </p>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <ScrollReveal direction="left">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm h-full">
            <p className="text-sm font-medium text-foreground mb-1">Supported platforms</p>
            <p className="text-xs text-muted-foreground mb-5">Each platform gets tailored prompt guidance</p>
            <StaggerContainer className="space-y-3">
              {platforms.map((platform) => (
                <StaggerItem key={platform.name}>
                  <div className="flex items-start gap-3 min-h-[44px]">
                    <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <platform.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">{platform.detail}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm h-full">
            <p className="text-sm font-medium text-foreground mb-1">Built-in tone styles</p>
            <p className="text-xs text-muted-foreground mb-5">Switch tone per comment without rewriting from scratch</p>
            <div className="flex flex-wrap gap-2">
              {tones.map((tone) => (
                <span
                  key={tone}
                  className="text-xs px-3 py-2 rounded-full bg-muted text-foreground font-medium min-h-[44px] inline-flex items-center"
                >
                  {tone}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
              Pro adds nine output languages. Free tier includes English only.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  </section>
);
