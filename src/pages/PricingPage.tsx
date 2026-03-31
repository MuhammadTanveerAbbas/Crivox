import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/landing/ScrollReveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to get started",
    featured: false,
    comingSoon: false,
    icon: Zap,
    color: "text-blue-500",
    features: [
      "Up to 3 comment variations",
      "8 tone styles",
      "6 platforms supported",
      "English only",
      "Comment history",
      "Basic analytics",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For power users who comment at scale",
    featured: true,
    comingSoon: true,
    icon: Sparkles,
    color: "text-violet-500",
    features: [
      "Up to 5 comment variations",
      "8 tone styles",
      "9 languages supported",
      "Bulk generation (up to 5 posts)",
      "Templates & comment queue",
      "Full comment history",
      "Priority AI generation",
      "Advanced analytics",
    ],
    cta: "Coming Soon",
  },
];

const freeHighlights = [
  { label: "No credit card", icon: "💳" },
  { label: "No time limit", icon: "⏱️" },
  { label: "No hidden fees", icon: "🔒" },
];

// Floating orb animation
const FloatingOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    className={cn("absolute rounded-full blur-3xl opacity-20 pointer-events-none", className)}
    animate={{ y: [0, -24, 0], scale: [1, 1.08, 1] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: "easeInOut", delay }}
  />
);

export default function PricingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-20 pb-10 text-center">
        {/* Background orbs */}
        <FloatingOrb className="w-96 h-96 bg-blue-500 -top-32 -left-32" delay={0} />
        <FloatingOrb className="w-80 h-80 bg-violet-500 -top-20 -right-24" delay={2} />
        <FloatingOrb className="w-64 h-64 bg-blue-400 bottom-0 left-1/2 -translate-x-1/2" delay={1} />

        {/* Dot grid */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

        <div className="relative max-w-2xl mx-auto">
          <ScrollReveal>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Simple, transparent pricing
            </motion.div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl font-medium tracking-tight text-foreground mb-4">
              Start free.{" "}
              <span className="gradient-text">Scale when ready.</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
              No surprises. Pick the plan that fits your workflow and upgrade anytime.
            </p>
          </ScrollReveal>

          {/* Free highlights */}
          <ScrollReveal delay={0.3}>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {freeHighlights.map((h) => (
                <span
                  key={h.label}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full"
                >
                  <span>{h.icon}</span>
                  {h.label}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Plans */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <StaggerContainer className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <StaggerItem key={plan.name}>
                <motion.div
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={cn(
                    "relative bg-card rounded-2xl p-7 h-full flex flex-col transition-shadow duration-200",
                    plan.featured
                      ? "border-2 border-violet-500 shadow-xl shadow-violet-500/10"
                      : "border border-border shadow-sm hover:shadow-md"
                  )}
                >
                  {/* Popular badge */}
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-violet-600 text-white text-xs px-3 py-0.5 rounded-full shadow-sm">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {/* Coming soon ribbon */}
                  {plan.comingSoon && (
                    <div className="absolute top-4 right-4">
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                        <Clock className="h-3 w-3" />
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className={cn("p-2 rounded-xl bg-muted", plan.featured && "bg-violet-100 dark:bg-violet-950/40")}>
                      <Icon className={cn("h-4 w-4", plan.color)} />
                    </div>
                    <h3 className="font-display text-xl font-medium text-foreground">{plan.name}</h3>
                  </div>

                  {/* Price */}
                  <div className="mb-1 flex items-baseline gap-1">
                    <motion.span
                      className="text-5xl font-bold text-foreground"
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      {plan.price}
                    </motion.span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-7">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <motion.li
                        key={feature}
                        className="flex items-center gap-2.5 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 0.1 * i }}
                      >
                        <Check className={cn("h-4 w-4 shrink-0", plan.featured ? "text-violet-500" : "text-blue-500")} />
                        <span className="text-foreground">{feature}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    disabled={plan.comingSoon}
                    className={cn(
                      "w-full rounded-xl font-medium transition-all duration-200",
                      plan.featured
                        ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm cursor-not-allowed opacity-70"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                    onClick={() => !plan.comingSoon && navigate("/login")}
                  >
                    {plan.comingSoon ? (
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {plan.cta}
                      </span>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </section>

      {/* Animated feature comparison strip */}
      <section className="px-4 sm:px-6 py-12 bg-muted/30">
        <ScrollReveal className="text-center mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-foreground mb-2">
            What's included
          </h2>
          <p className="text-muted-foreground text-sm">A quick look at what each plan covers</p>
        </ScrollReveal>

        <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-3 px-5 py-3 text-xs font-semibold uppercase tracking-wider bg-muted/60 border-b border-border">
            <span className="text-muted-foreground">Feature</span>
            <span className="text-center text-blue-500">Free</span>
            <span className="text-center text-violet-500">Pro</span>
          </div>
          {[
            { feature: "Comment variations", free: "3", pro: "5" },
            { feature: "Tone styles", free: "8", pro: "8" },
            { feature: "Platforms", free: "6", pro: "9" },
            { feature: "Languages", free: "English only", pro: "9 languages" },
            { feature: "Bulk generation", free: "", pro: "Up to 5 posts" },
            { feature: "Templates & queue", free: "", pro: "✓" },
            { feature: "Comment history", free: "✓", pro: "✓ Full" },
            { feature: "Analytics", free: "Basic", pro: "Advanced" },
          ].map((row, i) => (
            <motion.div
              key={row.feature}
              className={cn(
                "grid grid-cols-3 px-5 py-3.5 text-sm",
                i % 2 === 0 ? "bg-muted/30" : "bg-card"
              )}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <span className="text-muted-foreground">{row.feature}</span>
              <span className="text-center text-foreground">{row.free}</span>
              <span className="text-center text-violet-500 font-medium">{row.pro}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Notify me section for Pro */}
      <section className="px-4 sm:px-6 py-16 text-center">
        <ScrollReveal>
          <motion.div
            className="max-w-md mx-auto bg-card border border-border rounded-2xl p-8 shadow-sm"
            whileHover={{ scale: 1.01 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex justify-center mb-4">
              <motion.div
                className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-950/40"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-6 w-6 text-violet-500" />
              </motion.div>
            </div>
            <h3 className="font-display text-xl font-medium text-foreground mb-2">
              Pro is on its way
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              We're putting the finishing touches on Pro. Start with Free today and we'll let you know the moment it launches.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium"
              onClick={() => navigate("/login")}
            >
              Get Started Free
            </Button>
          </motion.div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
