import {
  Briefcase, Coffee, Laugh, Heart, Flame, GraduationCap, Lightbulb, Shield,
} from "lucide-react";

export const TONES = [
  { label: "Professional", icon: Briefcase },
  { label: "Casual", icon: Coffee },
  { label: "Witty", icon: Laugh },
  { label: "Supportive", icon: Heart },
  { label: "Bold", icon: Flame },
  { label: "Educational", icon: GraduationCap },
  { label: "Insightful", icon: Lightbulb },
  { label: "Authoritative", icon: Shield },
] as const;

export const TONE_LABELS = TONES.map((t) => t.label);

export const LENGTHS = ["Short", "Medium", "Long", "AI Decides"] as const;

export const PLATFORMS = [
  "LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit",
  "Blog/Website", "Hacker News", "Indie Hackers", "GitHub Discussions",
  "Threads", "Medium",
] as const;

export const LANGUAGES = [
  { value: "en", label: "English" }, { value: "es", label: "Spanish" },
  { value: "fr", label: "French" }, { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" }, { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" }, { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
] as const;
