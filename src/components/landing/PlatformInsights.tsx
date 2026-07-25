import { Linkedin, Twitter, Instagram, Facebook, MessageSquare, Globe, ExternalLink, MessageCircle, Hash, PenLine, FileText, Zap, Copy, ArrowRight, Sparkles } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const platforms = [
  { name: "LinkedIn", icon: Linkedin, detail: "Thoughtful, professional replies" },
  { name: "Twitter/X", icon: Twitter, detail: "Concise, punchy responses" },
  { name: "Instagram", icon: Instagram, detail: "Engaging, visual-friendly comments" },
  { name: "Facebook", icon: Facebook, detail: "Conversational community tone" },
  { name: "Reddit", icon: MessageSquare, detail: "Thread-aware, authentic replies" },
  { name: "Blog/Website", icon: Globe, detail: "Long-form, substantive feedback" },
  { name: "Hacker News", icon: ExternalLink, detail: "Tech-savvy, insightful takes" },
  { name: "Indie Hackers", icon: MessageCircle, detail: "Maker-to-maker, builder energy" },
  { name: "GitHub Discussions", icon: MessageSquare, detail: "Code-aware, technical discussions" },
  { name: "Threads", icon: Hash, detail: "Casual, conversational replies" },
  { name: "Medium", icon: PenLine, detail: "Long-form, editorial comments" },
];

const tones = [
  "Professional", "Casual", "Witty", "Supportive",
  "Bold", "Educational", "Insightful", "Authoritative",
];

const steps = [
  { step: "1", icon: FileText, label: "Paste post", desc: "Text, URL, or image" },
  { step: "2", icon: Zap, label: "Pick style", desc: "Tone, length, platform" },
  { step: "3", icon: Sparkles, label: "AI generates", desc: "Multiple variations" },
  { step: "4", icon: Copy, label: "Copy & post", desc: "One click, done" },
];

export const PlatformInsights = () => (
  <section className="px-4 sm:px-6 py-16 sm:py-24 bg-background" id="features">
    <div className="max-w-6xl mx-auto">
      <ScrollReveal className="text-center mb-10 sm:mb-14">
        <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
          Works where you work
        </h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Eleven platforms and eight tone styles built in. Pick the combo that fits each post.
        </p>
      </ScrollReveal>

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <ScrollReveal direction="left">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm h-full">
            <p className="text-sm font-medium text-foreground mb-1">Supported platforms</p>
            <p className="text-xs text-muted-foreground mb-5">Each platform gets tailored prompt guidance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {platforms.map((platform) => (
                <div key={platform.name} className="flex items-start gap-3 min-h-[44px]">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <platform.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{platform.name}</p>
                    <p className="text-xs text-muted-foreground">{platform.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-sm h-full">
            <p className="text-sm font-medium text-foreground mb-1">Built-in tone styles</p>
            <p className="text-xs text-muted-foreground mb-5">Switch tone per comment without rewriting from scratch</p>
            <div className="flex flex-wrap gap-2">
              {tones.map((tone) => (
                <span
                  key={tone}
                  className="text-xs px-3 py-2 rounded-full bg-muted text-foreground font-medium min-h-[36px] inline-flex items-center"
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

      {/* Workflow - seamlessly connected */}
      <ScrollReveal>
        <div className="bg-gradient-to-br from-card to-muted/30 border border-border rounded-2xl p-5 sm:p-7 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-3 items-start">
            {steps.map((item, i) => (
              <div key={item.step} className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-semibold text-sm shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                {i < 3 && <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </div>
  </section>
);
