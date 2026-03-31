import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustStrip } from "@/components/landing/TrustStrip";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { PlatformsGrid } from "@/components/landing/PlatformsGrid";
import { ToneExamples } from "@/components/landing/ToneExamples";
import { StatsBar } from "@/components/landing/StatsBar";
import { EngagementMetrics } from "@/components/landing/EngagementMetrics";
import { Testimonials } from "@/components/landing/Testimonials";
import { PlatformInsights } from "@/components/landing/PlatformInsights";
import { ComparisonTable } from "@/components/landing/ComparisonTable";
import { CTASection } from "@/components/landing/CTASection";
import { FAQSection } from "@/components/landing/FAQSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { Footer } from "@/components/landing/Footer";

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <TrustStrip />
      <HowItWorks />
      <PlatformsGrid />
      <ToneExamples />
      <StatsBar />
      <EngagementMetrics />
      <Testimonials />
      <PlatformInsights />
      <ComparisonTable />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Landing;
