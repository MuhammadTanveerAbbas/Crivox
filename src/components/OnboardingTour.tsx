import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Zap, LayoutGrid, CalendarClock, BookOpen, History,
  ChevronRight, ChevronLeft, X, Sparkles,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const STORAGE_KEY = "commentcraft_onboarding_done";

interface TourStep {
  selector: string;
  title: string;
  description: string;
  icon: React.ElementType;
}

const tourSteps: TourStep[] = [
  {
    selector: '[data-tour="generator"]',
    title: "Comment Generator",
    description: "Paste any social media post and generate AI-powered comments with customizable tone, language, and style options.",
    icon: Zap,
  },
  {
    selector: '[data-tour="bulk"]',
    title: "Bulk Generate",
    description: "Generate comments for multiple posts at once. Perfect for managing engagement across many conversations.",
    icon: LayoutGrid,
  },
  {
    selector: '[data-tour="queue"]',
    title: "Comment Queue",
    description: "Save generated comments to a queue with scheduling notes. Organize when and where to post them.",
    icon: CalendarClock,
  },
  {
    selector: '[data-tour="templates"]',
    title: "Templates",
    description: "Save and reuse your best comment templates. Create categories to stay organized.",
    icon: BookOpen,
  },
  {
    selector: '[data-tour="history"]',
    title: "History & Favorites",
    description: "All your generated comments are saved here. Star your favorites and re-generate from any past session.",
    icon: History,
  },
];

const OnboardingTour = () => {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done && location.pathname === "/dashboard") {
      const timer = setTimeout(() => setActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  const updateTargetRect = useCallback(() => {
    if (!active) return;
    const el = document.querySelector(tourSteps[step].selector);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
      requestAnimationFrame(() => {
        setTargetRect(el.getBoundingClientRect());
      });
    } else {
      setTargetRect(null);
    }
  }, [active, step]);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(updateTargetRect, 100);
    window.addEventListener("resize", updateTargetRect);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateTargetRect);
    };
  }, [updateTargetRect, active]);

  const handleNext = () => {
    if (step < tourSteps.length - 1) setStep(step + 1);
    else handleFinish();
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleFinish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setActive(false);
  };

  if (!active) return null;

  const currentStep = tourSteps[step];
  const StepIcon = currentStep.icon;

  const TooltipContent = () => (
    <div className="bg-card rounded-xl border border-border shadow-xl p-5 w-80 relative">
      <button
        onClick={handleFinish}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2.5 mb-2">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <StepIcon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {tourSteps.length}</p>
          <h3 className="font-semibold text-foreground text-sm">{currentStep.title}</h3>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {currentStep.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step ? "w-5 bg-primary" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          {step > 0 && (
            <Button variant="outline" size="sm" onClick={handlePrev} className="h-8 px-2.5">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" onClick={handleNext} className="h-8 px-3 gap-1 bg-blue-600 text-white">
            {step === tourSteps.length - 1 ? (
              <><Sparkles className="h-3.5 w-3.5" /> Get Started</>
            ) : (
              <>Next <ChevronRight className="h-3.5 w-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Mobile: centered modal
  if (isMobile) {
    return createPortal(
      <>
        <div className="fixed inset-0 z-[10000] bg-black/60" onClick={handleFinish} />
        <div className="fixed z-[10002] inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto">
          <TooltipContent />
        </div>
      </>,
      document.body
    );
  }

  // Desktop: positioned tooltip next to highlighted element
  let tooltipStyle: React.CSSProperties = { position: "fixed", zIndex: 10002 };
  if (targetRect) {
    const tooltipWidth = 320;
    const spaceRight = window.innerWidth - targetRect.right;
    if (spaceRight > tooltipWidth + 20) {
      tooltipStyle.top = Math.max(8, targetRect.top - 8);
      tooltipStyle.left = targetRect.right + 16;
    } else {
      tooltipStyle.top = targetRect.bottom + 12;
      tooltipStyle.left = Math.max(16, Math.min(targetRect.left, window.innerWidth - tooltipWidth - 16));
    }
  } else {
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return createPortal(
    <>
      {/* Dark overlay  no blur */}
      <div
        className="fixed inset-0 z-[10000] bg-black/60"
        onClick={handleFinish}
      />

      {/* Highlight cutout  sits above overlay */}
      {targetRect && (
        <div
          className="fixed z-[10001] rounded-lg ring-2 ring-blue-500 ring-offset-2 pointer-events-none bg-transparent"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />
      )}

      <div className="relative" style={tooltipStyle}>
        <TooltipContent />
      </div>
    </>,
    document.body
  );
};

export default OnboardingTour;
