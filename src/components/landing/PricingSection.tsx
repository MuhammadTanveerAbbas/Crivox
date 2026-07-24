import { useState } from "react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
      "10 platforms supported",
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
      "Voice Profile & AI Memory",
      "Priority AI generation",
    ],
    cta: "Subscribe",
  },
];

export const PricingSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleProClick = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, email: user.email }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to start checkout. Please try again.");
      }
    } catch {
      toast.error("Failed to connect to payment service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pricing" className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Simple pricing
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            Start free. Upgrade when you need more power.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <div
                className={cn(
                  "relative bg-card rounded-2xl p-6 sm:p-8 h-full flex flex-col transition-all duration-200",
                  plan.featured
                    ? "border-2 border-blue-500 shadow-lg"
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
                    "w-full rounded-xl font-medium min-h-[44px]",
                    plan.featured
                      ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                      : "bg-card border border-border text-foreground hover:bg-accent"
                  )}
                  onClick={plan.featured ? handleProClick : () => navigate("/login")}
                  disabled={loading}
                >
                  {loading && plan.featured ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};
