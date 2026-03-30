import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Try it out, no commitment",
    featured: false,
    features: [
      "Up to 3 comment variations",
      "8 tone styles",
      "6 platforms supported",
      "English only",
      "Comment history",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    price: "$9",
    period: "per month",
    description: "For people who comment regularly",
    featured: true,
    features: [
      "Up to 5 comment variations",
      "8 tone styles",
      "9 languages",
      "Bulk generation (up to 5 posts)",
      "Templates & queue",
      "Full comment history",
    ],
    cta: "Upgrade to Pro",
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Start free, upgrade when you need more.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={cn(
                  "bg-card rounded-2xl p-6 sm:p-8 h-full flex flex-col transition-all duration-200",
                  plan.featured
                    ? "border-2 border-blue-500 shadow-lg scale-[1.02]"
                    : "border border-border shadow-sm"
                )}
              >
                <h3 className="font-display text-2xl font-medium text-foreground">{plan.name}</h3>
                <div className="mt-3 mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-7">{plan.description}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-blue-500 shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full rounded-xl font-medium",
                    plan.featured
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-card border border-border text-foreground hover:bg-accent"
                  )}
                  onClick={() => navigate("/login")}
                >
                  {plan.cta}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
