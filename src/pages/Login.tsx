import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowLeft, Zap, MessageSquare, Globe } from "lucide-react";
import CrivoxIcon from "@/components/CrivoxIcon";
import { useState } from "react";
import { toast } from "sonner";
import { resetEmailSchema } from "@/lib/schemas";

const features = [
  { icon: Zap, text: "Generate comments in seconds" },
  { icon: MessageSquare, text: "8 tones · 11 platforms" },
  { icon: Globe, text: "9 languages supported" },
];

const AuthPanel = () => (
  <div className="hidden lg:flex lg:w-[420px] shrink-0 flex-col justify-between bg-[#1e4fd8] p-10 relative overflow-hidden">
    {/* Subtle dot texture */}
    <div className="absolute inset-0 opacity-[0.06]"
      style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
    {/* Top: brand */}
    <div className="relative flex items-center gap-2.5">
      <CrivoxIcon size={32} />
      <span className="font-display text-xl text-white font-semibold">Crivox</span>
    </div>
    {/* Middle: headline */}
    <div className="relative space-y-6">
      <p className="font-display text-3xl text-white leading-tight font-medium">
        Write better comments,<br />in seconds.
      </p>
      <ul className="space-y-3">
        {features.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-blue-100 text-sm">
            <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Icon className="h-3.5 w-3.5 text-white" />
            </div>
            {text}
          </li>
        ))}
      </ul>
    </div>
    {/* Bottom: tagline */}
    <p className="relative text-blue-200/60 text-xs">
      Free to start · No credit card required
    </p>
  </div>
);

const Login = () => {
  const [signingIn, setSigningIn] = useState(false);
  const [showEmailReset, setShowEmailReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      if (error) toast.error("Failed to sign in with Google");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSigningIn(false);
    }
  };

  const handlePasswordReset = async () => {
    const parsed = resetEmailSchema.safeParse({ email: resetEmail.trim() });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || "Enter a valid email address");
      return;
    }
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
        redirectTo: `${window.location.origin}/dashboard`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your email.");
      setShowEmailReset(false);
      setResetEmail("");
    } catch {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  if (showEmailReset) {
    return (
      <div className="min-h-screen flex bg-background">
        <AuthPanel />
        {/* Right: form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">
            {/* Mobile brand */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <CrivoxIcon size={28} />
              <span className="font-display text-xl font-semibold text-foreground">Crivox</span>
            </div>
            <button
              onClick={() => setShowEmailReset(false)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </button>
            <h1 className="text-2xl font-semibold text-foreground mb-1">Reset password</h1>
            <p className="text-sm text-muted-foreground mb-8">Enter your email and we'll send you a reset link.</p>
            <div className="space-y-3">
              <Input
                type="email"
                placeholder="you@example.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordReset()}
                className="h-10 text-sm"
              />
              <Button
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 font-medium text-sm"
                onClick={handlePasswordReset}
                disabled={sendingReset}
              >
                <Mail className="h-4 w-4" />
                {sendingReset ? "Sending…" : "Send Reset Link"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AuthPanel />

      {/* Right: sign-in form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <CrivoxIcon size={28} />
            <span className="font-display text-xl font-semibold text-foreground">Crivox</span>
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-8">Sign in to your Crivox account to continue.</p>

          {/* Google sign-in */}
          <Button
            className="w-full gap-3 bg-background border border-border text-foreground hover:bg-muted rounded-xl h-10 font-medium text-sm transition-colors"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={signingIn}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {signingIn ? "Signing in…" : "Continue with Google"}
          </Button>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowEmailReset(true)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8 leading-relaxed">
            By continuing you agree to our{" "}
            <span className="text-foreground cursor-pointer hover:underline">Terms of Service</span>
            {" "}and{" "}
            <span className="text-foreground cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
