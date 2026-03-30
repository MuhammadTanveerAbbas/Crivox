import { ScrollReveal } from "./ScrollReveal";

const stats = [
  { value: "8", label: "Tone styles" },
  { value: "6", label: "Platforms" },
  { value: "9", label: "Languages" },
  { value: "5", label: "Variations per generation" },
];

export const StatsBar = () => (
  <section className="border-y border-border py-12 sm:py-16 bg-background">
    <ScrollReveal className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-foreground tracking-tight">
              {s.value}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-2">{s.label}</div>
          </div>
        ))}
      </div>
    </ScrollReveal>
  </section>
);
