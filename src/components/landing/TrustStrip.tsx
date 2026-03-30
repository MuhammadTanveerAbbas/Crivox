import { Shield, Zap, Globe, Type } from "lucide-react";

const items = [
  { icon: Zap, text: "Powered by Groq AI" },
  { icon: Type, text: "8 tone styles" },
  { icon: Globe, text: "9 languages" },
  { icon: Shield, text: "Free to start" },
];

export const TrustStrip = () => (
  <section className="border-y border-border bg-muted/50 py-4">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {items.map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-sm text-muted-foreground">
            <item.icon className="h-4 w-4 text-blue-500" />
            <span className="font-medium">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);
