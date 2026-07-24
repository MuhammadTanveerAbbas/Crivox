import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Sun, Moon, LogOut, Trash2, User, Save, Languages, AlertTriangle, Sparkles, Mic, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { profileSchema, aiMemorySchema } from "@/lib/schemas";

const platforms = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit", "Blog/Website", "Hacker News", "Indie Hackers", "GitHub", "Threads", "Other"] as const;
const toneOptions = ["Professional", "Casual", "Witty", "Supportive", "Bold", "Educational", "Insightful", "Authoritative"] as const;
const languages = [
  { value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" },
  { value: "de", label: "German" }, { value: "pt", label: "Portuguese" }, { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" }, { value: "zh", label: "Chinese" }, { value: "ja", label: "Japanese" },
] as const;

const SettingsPage = () => {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [defaultTone, setDefaultTone] = useState("Professional");
  const [defaultPlatform, setDefaultPlatform] = useState("LinkedIn");
  const [defaultLanguage, setDefaultLanguage] = useState("en");
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [memory, setMemory] = useState({ full_name: "", profession: "", industry: "", target_audience: "", use_case: "" });
  const [editingMemory, setEditingMemory] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [voiceSamples, setVoiceSamples] = useState<{ id: string; content: string }[]>([]);
  const [newVoiceSample, setNewVoiceSample] = useState("");
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [deletingSample, setDeletingSample] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name, default_tone, default_platform, default_language, full_name, profession, industry, target_audience, use_case")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        supabase.from("voice_samples").select("id, content").eq("user_id", user!.id).order("created_at", { ascending: true })
          .then(({ data: samples }) => {
            if (samples) setVoiceSamples(samples as { id: string; content: string }[]);
          });
        if (data) {
          setDisplayName(data.display_name || "");
          setDefaultTone(data.default_tone || "Professional");
          setDefaultPlatform(data.default_platform || "LinkedIn");
          setDefaultLanguage(data.default_language || "en");
          setMemory({
            full_name: data.full_name || "",
            profession: data.profession || "",
            industry: data.industry || "",
            target_audience: data.target_audience || "",
            use_case: data.use_case || "",
          });
        } else {
          setDisplayName(user.email?.split("@")[0] || "");
        }
        setProfileLoading(false);
      });
  }, [user]);

  const handleSaveProfile = async () => {
    const result = profileSchema.safeParse({
      display_name: displayName,
      default_tone: defaultTone,
      default_platform: defaultPlatform,
      default_language: defaultLanguage,
    });
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Invalid input");
      return;
    }
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

  const handleSaveMemory = async () => {
    if (!user) return;
    const result = aiMemorySchema.safeParse(memory);
    if (!result.success) {
      toast.error(result.error.errors[0]?.message || "Invalid input");
      return;
    }
    setSavingMemory(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: memory.full_name || null,
      profession: memory.profession || null,
      industry: memory.industry || null,
      target_audience: memory.target_audience || null,
      use_case: memory.use_case || null,
      has_onboarded: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    
    if (error) {
      toast.error("Failed to save memory: " + error.message);
    } else {
      toast.success("Memory saved!");
    }
    setSavingMemory(false);
    setEditingMemory(false);
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
          <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* AI Memory */}
        <div className={card}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" /> AI Memory
            </h3>
            {!editingMemory && (
              <Button variant="outline" size="sm" onClick={() => setEditingMemory(true)}>Edit</Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Helps generate more relevant comments</p>
          {editingMemory ? (
            <div className="space-y-3">
              {[
                { key: "full_name", label: "Name", placeholder: "Your name" },
                { key: "profession", label: "Profession", placeholder: "e.g., Marketer, Founder" },
                { key: "industry", label: "Industry", placeholder: "e.g., Tech, E-commerce" },
                { key: "target_audience", label: "Target Audience", placeholder: "e.g., Customers, Peers" },
                { key: "use_case", label: "Why Crivox", placeholder: "e.g., Save time, Grow audience" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-medium text-foreground mb-1 block">{field.label}</label>
                  <Input
                    placeholder={field.placeholder}
                    value={memory[field.key as keyof typeof memory]}
                    onChange={(e) => setMemory({ ...memory, [field.key]: e.target.value })}
                  />
                </div>
              ))}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveMemory} disabled={savingMemory} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Save className="h-3.5 w-3.5 mr-1" /> {savingMemory ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingMemory(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(memory).map(([key, value]) => value && (
                <div key={key} className="flex gap-2">
                  <span className="text-muted-foreground capitalize">{key.replace("_", " ")}:</span>
                  <span className="text-foreground">{value}</span>
                </div>
              ))}
              {!Object.values(memory).some(v => v) && <p className="text-muted-foreground text-xs">No memory set yet</p>}
            </div>
          )}
        </div>

        {/* Voice Profile */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mic className="h-4 w-4 text-muted-foreground" /> Voice Profile
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Paste 2-3 examples of comments you have written before. Crivox will match your natural voice and rhythm.</p>

          {voiceSamples.length > 0 && (
            <div className="space-y-2 mb-3">
              {voiceSamples.map((sample) => (
                <div key={sample.id} className="flex items-start gap-2 bg-accent rounded-lg p-3">
                  <p className="flex-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">{sample.content}</p>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground"
                    disabled={deletingSample === sample.id}
                    onClick={async () => {
                      setDeletingSample(sample.id);
                      const { error } = await supabase.from("voice_samples").delete().eq("id", sample.id);
                      if (error) toast.error("Failed to remove");
                      else {
                        setVoiceSamples((prev) => prev.filter((s) => s.id !== sample.id));
                        toast.success("Sample removed");
                      }
                      setDeletingSample(null);
                    }}>
                    {deletingSample === sample.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {voiceSamples.length < 3 && (
            <div className="space-y-2">
              <Textarea placeholder="Paste a comment you have written before..." value={newVoiceSample} onChange={(e) => setNewVoiceSample(e.target.value)} rows={3} className="text-sm" />
              <Button size="sm" className="gap-1.5" disabled={!newVoiceSample.trim() || voiceSaving}
                onClick={async () => {
                  setVoiceSaving(true);
                  const { data, error } = await supabase.from("voice_samples").insert({ user_id: user!.id, content: newVoiceSample.trim() }).select("id, content").single();
                  if (error) toast.error("Failed to save");
                  else if (data) {
                    setVoiceSamples((prev) => [...prev, data as { id: string; content: string }]);
                    setNewVoiceSample("");
                    toast.success("Voice sample saved");
                  }
                  setVoiceSaving(false);
                }}>
                <Plus className="h-3.5 w-3.5" /> Add Sample
              </Button>
            </div>
          )}
          {voiceSamples.length >= 3 && (
            <p className="text-xs text-muted-foreground">3 samples maximum. Remove one to add a new one.</p>
          )}
        </div>

        {/* Billing */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" /> Billing
          </h3>
          <p className="text-xs text-muted-foreground mb-3">Manage your subscription and payment details</p>
          <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => navigate("/pricing")}>
            <Sparkles className="h-3.5 w-3.5" /> View Plans
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
                    ? "bg-primary text-primary-foreground border-primary"
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

        {/* Account */}
        <div className={card}>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-red-400" /> Account
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Sign out</p>
                <p className="text-xs text-muted-foreground">Sign out of your account</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={async () => { await signOut(); navigate("/", { replace: true }); }}>
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </Button>
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" /> Delete account?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account, profile, comment history, templates, queue items, and shared comments. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-red-600 text-white hover:bg-red-700"
                        onClick={async () => {
                          if (!user) return;
                          const { error } = await supabase.rpc("delete_user_account");
                          if (error) {
                            toast.error("Failed to delete account. Please contact support.");
                          } else {
                            await signOut();
                            navigate("/", { replace: true });
                            toast.success("Account deleted permanently.");
                          }
                        }}
                      >
                        Delete my account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
