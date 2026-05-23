import { useState } from "react";
import { createPortal } from "react-dom";
import { User, Briefcase, Building2, Users, Sparkles, ArrowRight, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface OnboardingQuestionnaireProps {
  user: SupabaseUser;
  onComplete: () => void;
}

interface FormData {
  full_name: string;
  profession: string;
  industry: string;
  target_audience: string;
  use_case: string;
}

const questions = [
  {
    key: "full_name",
    label: "What's your name?",
    placeholder: "Your name",
    icon: User,
  },
  {
    key: "profession",
    label: "What's your profession or role?",
    placeholder: "e.g., Marketer, Founder, Content Creator",
    icon: Briefcase,
  },
  {
    key: "industry",
    label: "What industry are you in?",
    placeholder: "e.g., Tech, E-commerce, Finance, Healthcare",
    icon: Building2,
  },
  {
    key: "target_audience",
    label: "Who do you typically engage with?",
    placeholder: "e.g., Potential customers, Industry peers, Thought leaders",
    icon: Users,
  },
  {
    key: "use_case",
    label: "Why are you using Crivox?",
    placeholder: "e.g., Save time, Grow audience, Engage consistently",
    icon: Sparkles,
  },
] as const;

const OnboardingQuestionnaire = ({ user, onComplete }: OnboardingQuestionnaireProps) => {
  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    profession: "",
    industry: "",
    target_audience: "",
    use_case: "",
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ has_onboarded: true })
      .eq("user_id", user.id);
    setSaving(false);
    onComplete();
  };

  const handleSubmit = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: formData.full_name || null,
      profession: formData.profession || null,
      industry: formData.industry || null,
      target_audience: formData.target_audience || null,
      use_case: formData.use_case || null,
      has_onboarded: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    
    setSaving(false);
    onComplete();
  };

  const currentQuestion = questions[currentStep];
  const Icon = currentQuestion.icon;
  const currentValue = formData[currentQuestion.key as keyof FormData];
  const isLastStep = currentStep === questions.length - 1;

  const content = (
    <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-card border-border shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Question {currentStep + 1} of {questions.length}</p>
            <h3 className="font-semibold text-foreground text-sm">{currentQuestion.label}</h3>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder={currentQuestion.placeholder}
            value={currentValue}
            onChange={(e) => handleChange(currentQuestion.key as keyof FormData, e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLastStep && handleNext()}
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={saving}
            className="text-muted-foreground"
          >
            <SkipForward className="h-4 w-4 mr-1" />
            Skip
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            {isLastStep ? (
              <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-blue-600 text-white">
                {saving ? "Saving..." : "Complete"}
              </Button>
            ) : (
              <Button size="sm" onClick={handleNext} className="bg-blue-600 text-white">
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-1 mt-4 justify-center">
          {questions.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentStep ? "w-5 bg-primary" : "w-1.5 bg-border"
              )}
            />
          ))}
        </div>
      </Card>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return null;
};

export default OnboardingQuestionnaire;