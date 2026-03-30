import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Trash2, User, Save, Languages, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const platforms = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit", "Blog/Website", "Other"] as const;
const toneOptions = ["Professional", "Casual", "Witty", "Supportive", "Bold", "Educational", "Insightful", "Authoritative"] as const;
const languages = [
  { value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" },
  { value: "de", label: "German" }, { value: "pt", label: "Portuguese" }, { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" }, { value: "zh", label: "Chinese" }, { value: "ja", label: "Japanese" },
] as const;

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [deleting, setDeleting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [defaultTone, setDefaultTone] = useState("Professional");
  const [defaultPlatform, setDefaultPlatform] = useState("LinkedIn");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, default_tone, default_platform, default_language")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name || "");
          setDefaultTone(data.default_tone || "Professional");
          setDefaultPlatform(data.default_platform || "LinkedIn");
          setDefaultLanguage(data.default_language || "en");
        } else {
          setDisplayName(user.email?.split("@")[0] || "");
        }
        setProfileLoading(false);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user!.id, display_name: displayName,
      default_tone: defaultTone, default_platform: defaultPlatform,
      default_language: defaultLanguage, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) toast.error("Failed to save");
    else toast.success("Saved!");
    setSaving(false);
  };

  const handleDeleteHistory = async () => {
    setDeleting(true);
    const { error } = await supabase.from("comment_history").delete().eq("user_id", user!.id);
    if (error) toast.error("Failed to delete");
    else toast.success("History deleted");
    setDeleting(false);
  };

  const handleDeleteTemplates = async () => {
    const { error } = await supabase.from("comment_templates").delete().eq("user_id", user!.id);
    if (error) toast.error("Failed to delete");
    else toast.success("Templates deleted");
  };

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
  ];

  const card = "bg-card border border-border rounded-xl shadow-sm p-5 space-y-3";

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
        </div>

        {/* Profile */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Profile
          </h3>
          {profileLoading ? (
            <div className="h-16 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center text-blue-700 text-sm font-semibold shrink-0">
                {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 space-y-1">
                <Input placeholder="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Defaults */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground">Default preferences</h3>
          <p className="text-xs text-muted-foreground">Pre-fills when you open the generator.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Tone</label>
              <Select value={defaultTone} onValueChange={setDefaultTone}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{toneOptions.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Platform</label>
              <Select value={defaultPlatform} onValueChange={setDefaultPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                <Languages className="h-3 w-3 text-muted-foreground" /> Language
              </label>
              <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5 bg-blue-600 text-white">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Theme */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sun className="h-4 w-4 text-muted-foreground" /> Appearance
          </h3>
          <div className="flex gap-2">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium flex-1 justify-center border",
                  theme === t.value
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-card text-muted-foreground border-border hover:bg-accent"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" /> Data
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Delete history</p>
                <p className="text-xs text-muted-foreground">Remove all generated comment history</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500" disabled={deleting}>
                    {deleting ? "..." : "Delete"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" /> Delete all history?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove all your generated comment history. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteHistory}>
                      Delete history
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Delete templates</p>
                <p className="text-xs text-muted-foreground">Remove all custom templates</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" /> Delete all templates?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove all your custom templates. Built-in presets will remain. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteTemplates}>
                      Delete templates
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground">Sign out</p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={signOut}>
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
