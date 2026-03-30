import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessageSquare, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/dashboard" },
      });
      if (error) toast.error("Failed to sign in with Google");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white translate-x-1/3 translate-y-1/3" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl text-white">Crivox</span>
        </div>

        {/* Quote */}
        <div className="relative">
          <p className="font-display text-3xl text-white leading-snug font-medium mb-6">
            "Write better comments, in seconds."
          </p>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            AI-powered comment generation for every platform and tone. Join thousands of professionals saving hours every week.
          </p>
        </div>

        {/* Social proof */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["S", "J", "P", "M"].map((initial) => (
                <div
                  key={initial}
                  className="h-8 w-8 rounded-full bg-white/20 border-2 border-blue-600 flex items-center justify-center text-white text-xs font-semibold"
                >
                  {initial}
                </div>
              ))}
            </div>
            <div>
              <div className="flex gap-0.5 mb-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-3 w-3 fill-yellow-300 text-yellow-300" />
                ))}
              </div>
              <p className="text-blue-200 text-xs">Join 10k+ professionals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-background px-6 py-12 min-h-screen md:min-h-0">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 md:hidden">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl text-foreground">Crivox</span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your Crivox account</p>

          <Button
            className="w-full gap-3 bg-background border border-border text-foreground hover:bg-accent rounded-xl h-11 font-medium shadow-sm transition-all duration-150"
            variant="outline"
            size="lg"
            onClick={handleGoogleLogin}
            disabled={signingIn}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {signingIn ? "Signing in..." : "Continue with Google"}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-6">
            By continuing, you agree to our{" "}
            <span className="text-foreground hover:text-foreground/80 cursor-pointer transition-colors">Terms of Service</span>
            {" "}and{" "}
            <span className="text-foreground hover:text-foreground/80 cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
