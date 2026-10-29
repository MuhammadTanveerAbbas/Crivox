import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, User, Save, Languages, AlertTriangle, Sparkles, Mic, Plus, X, Loader2, CreditCard, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { profileSchema, aiMemorySchema } from "@/lib/schemas";
import { TONE_LABELS, PLATFORMS, LANGUAGES } from "@/lib/constants";

const SettingsPage = () => {
  const { user, signOut } = useAuth();
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
    const result = profileSchema.safeParse({ display_name: displayName, default_tone: defaultTone, default_platform: defaultPlatform, default_language: defaultLanguage });
    if (!result.success) { toast.error(result.error.errors[0]?.message || "Invalid input"); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user!.id, display_name: displayName, default_tone: defaultTone, default_platform: defaultPlatform, default_language: defaultLanguage, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error("Failed to save"); else toast.success("Saved!");
    setSaving(false);
  };

  const handleSaveMemory = async () => {
    if (!user) return;
    const result = aiMemorySchema.safeParse(memory);
    if (!result.success) { toast.error(result.error.errors[0]?.message || "Invalid input"); return; }
    setSavingMemory(true);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, full_name: memory.full_name || null, profession: memory.profession || null, industry: memory.industry || null, target_audience: memory.target_audience || null, use_case: memory.use_case || null, has_onboarded: true, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) toast.error("Failed to save memory: " + error.message); else toast.success("Memory saved!");
    setSavingMemory(false);
    setEditingMemory(false);
  };

  const handleDeleteHistory = async () => {
    setDeleting(true);
    const { error } = await supabase.from("comment_history").delete().eq("user_id", user!.id);
    if (error) toast.error("Failed to delete"); else toast.success("History deleted");
    setDeleting(false);
  };

  const handleDeleteTemplates = async () => {
    const { error } = await supabase.from("comment_templates").delete().eq("user_id", user!.id);
    if (error) toast.error("Failed to delete"); else toast.success("Templates deleted");
  };

  // Card wrapper fixed max width, clean border
  const card = "bg-card border border-border rounded-xl p-5 space-y-4";
  // Consistent input width for all settings inputs
  const inputCls = "w-full max-w-sm h-9 text-sm";

  return (
    <DashboardLayout>
      {/* Center the settings in the available space with correct scroll */}
      <div className="min-h-full flex flex-col items-center py-2">
        <div className="w-full max-w-lg space-y-4">

          {/* Page header */}
          <div className="pb-1">
            <h1 className="text-xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage your account and preferences</p>
          </div>

          {/* ── Profile ── */}
          <div className={card}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Profile
            </h3>
            {profileLoading ? (
              <div className="h-14 flex items-center text-muted-foreground text-sm">Loading…</div>
            ) : (
              <div className="space-y-2">
                {/* Single row: avatar + name input perfectly aligned */}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted border border-border flex items-center justify-center text-sm font-semibold text-foreground shrink-0">
                    {(displayName?.[0] || user?.email?.[0] || "U").toUpperCase()}
                  </div>
                  <Input
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-9 text-sm flex-1 max-w-sm"
                  />
                </div>
                {/* Email sits below the row, indented to align with the input */}
                <div className="flex items-center gap-1.5 pl-12">
                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>
            )}
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>

          {/* ── Default preferences ── */}
          <div className={card}>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Default preferences</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pre-fills when you open the generator.</p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Tone</label>
                <Select value={defaultTone} onValueChange={setDefaultTone}>
                  <SelectTrigger className="w-full max-w-sm h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{TONE_LABELS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground">Platform</label>
                <Select value={defaultPlatform} onValueChange={setDefaultPlatform}>
                  <SelectTrigger className="w-full max-w-sm h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Languages className="h-3 w-3 text-muted-foreground" /> Language
                </label>
                <Select value={defaultLanguage} onValueChange={setDefaultLanguage}>
                  <SelectTrigger className="w-full max-w-sm h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={saving} size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs">
              <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
            </Button>
          </div>

          {/* ── AI Memory ── */}
          <div className={card}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-muted-foreground" /> AI Memory
              </h3>
              {!editingMemory && (
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditingMemory(true)}>Edit</Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Helps the AI generate more relevant comments for you.</p>
            {editingMemory ? (
              <div className="space-y-3">
                {([
                  { key: "full_name", label: "Name", placeholder: "Your name" },
                  { key: "profession", label: "Profession", placeholder: "e.g., Marketer, Founder" },
                  { key: "industry", label: "Industry", placeholder: "e.g., Tech, E-commerce" },
                  { key: "target_audience", label: "Target Audience", placeholder: "e.g., Customers, Peers" },
                  { key: "use_case", label: "Why Crivox", placeholder: "e.g., Save time, Grow audience" },
                ] as const).map((field) => (
                  <div key={field.key} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-foreground">{field.label}</label>
                    <Input
                      placeholder={field.placeholder}
                      value={memory[field.key]}
                      onChange={(e) => setMemory({ ...memory, [field.key]: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={handleSaveMemory} disabled={savingMemory} className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs gap-1.5">
                    <Save className="h-3.5 w-3.5" /> {savingMemory ? "Saving…" : "Save"}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setEditingMemory(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                {Object.entries(memory).map(([key, value]) => value && (
                  <div key={key} className="flex gap-2 min-w-0">
                    <span className="text-muted-foreground capitalize shrink-0">{key.replace(/_/g, " ")}:</span>
                    <span className="text-foreground truncate">{value}</span>
                  </div>
                ))}
                {!Object.values(memory).some(v => v) && <p className="text-muted-foreground text-xs">No memory set yet.</p>}
              </div>
            )}
          </div>

          {/* ── Voice Profile ── */}
          <div className={card}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" /> Voice Profile
            </h3>
            <p className="text-xs text-muted-foreground">Paste 2–3 comments you've written before. Crivox will match your natural voice.</p>
            {voiceSamples.length > 0 && (
              <div className="space-y-2">
                {voiceSamples.map((sample) => (
                  <div key={sample.id} className="flex items-start gap-2 bg-muted/50 border border-border rounded-lg p-3">
                    <p className="flex-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed line-clamp-3">{sample.content}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground"
                      disabled={deletingSample === sample.id}
                      onClick={async () => {
                        setDeletingSample(sample.id);
                        const { error } = await supabase.from("voice_samples").delete().eq("id", sample.id);
                        if (error) toast.error("Failed to remove");
                        else { setVoiceSamples((prev) => prev.filter((s) => s.id !== sample.id)); toast.success("Sample removed"); }
                        setDeletingSample(null);
                      }}>
                      {deletingSample === sample.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {voiceSamples.length < 3 && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste a comment you've written before…"
                  value={newVoiceSample}
                  onChange={(e) => setNewVoiceSample(e.target.value)}
                  rows={3}
                  className="text-sm w-full max-w-sm resize-none"
                />
                <Button size="sm" className="gap-1.5 h-8 text-xs" disabled={!newVoiceSample.trim() || voiceSaving}
                  onClick={async () => {
                    setVoiceSaving(true);
                    const { data, error } = await supabase.from("voice_samples").insert({ user_id: user!.id, content: newVoiceSample.trim() }).select("id, content").single();
                    if (error) toast.error("Failed to save");
                    else if (data) { setVoiceSamples((prev) => [...prev, data as { id: string; content: string }]); setNewVoiceSample(""); toast.success("Voice sample saved"); }
                    setVoiceSaving(false);
                  }}>
                  <Plus className="h-3.5 w-3.5" /> {voiceSaving ? "Saving…" : "Add Sample"}
                </Button>
              </div>
            )}
            {voiceSamples.length >= 3 && (
              <p className="text-xs text-muted-foreground">3 samples maximum. Remove one to add a new one.</p>
            )}
          </div>

          {/* ── Billing ── */}
          <div className={card}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" /> Billing
            </h3>
            <p className="text-xs text-muted-foreground">Manage your subscription and payment details.</p>
            <Button size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs" onClick={() => navigate("/pricing")}>
              View Plans
            </Button>
          </div>

          {/* ── Data ── */}
          <div className={card}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-muted-foreground" /> Data
            </h3>
            <div className="space-y-3">
              {[
                {
                  title: "Delete history",
                  desc: "Remove all generated comment history",
                  action: handleDeleteHistory,
                  loading: deleting,
                  dialog: "Delete all history?",
                  dialogDesc: "This will permanently remove all your generated comment history. This cannot be undone.",
                  actionLabel: "Delete history",
                },
                {
                  title: "Delete templates",
                  desc: "Remove all custom templates",
                  action: handleDeleteTemplates,
                  loading: false,
                  dialog: "Delete all templates?",
                  dialogDesc: "This will permanently remove all your custom templates. Built-in presets will remain.",
                  actionLabel: "Delete templates",
                },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-500 shrink-0 h-8 text-xs" disabled={item.loading}>
                        {item.loading ? "…" : "Delete"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />{item.dialog}</AlertDialogTitle>
                        <AlertDialogDescription>{item.dialogDesc}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={item.action}>{item.actionLabel}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>

          {/* ── Account ── */}
          <div className={card}>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" /> Account
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">Sign out</p>
                  <p className="text-xs text-muted-foreground">Sign out of your account</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs shrink-0" onClick={async () => { await signOut(); navigate("/", { replace: true }); }}>
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </Button>
              </div>
              <div className="border-t border-border pt-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-red-500 shrink-0 h-8 text-xs">Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" />Delete account?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete your account, profile, comment history, templates, and shared comments. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={async () => {
                        if (!user) return;
                        const { error } = await supabase.rpc("delete_user_account");
                        if (error) toast.error("Failed to delete account. Please contact support.");
                        else { await signOut(); navigate("/", { replace: true }); toast.success("Account deleted."); }
                      }}>Delete my account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
