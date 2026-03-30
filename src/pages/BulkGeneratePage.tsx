import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus, Trash2, Sparkles, Copy, Check, Download, X,
  Briefcase, Coffee, Laugh, Heart, Flame, GraduationCap, Lightbulb, Shield,
  Hash, SmilePlus, MousePointerClick, Languages, CopyPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateComments } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const tones = [
  { label: "Professional", icon: Briefcase },
  { label: "Casual", icon: Coffee },
  { label: "Witty", icon: Laugh },
  { label: "Supportive", icon: Heart },
  { label: "Bold", icon: Flame },
  { label: "Educational", icon: GraduationCap },
  { label: "Insightful", icon: Lightbulb },
  { label: "Authoritative", icon: Shield },
] as const;

const platforms = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit", "Blog/Website", "Other"] as const;
const languages = [
  { value: "en", label: "English" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" },
  { value: "de", label: "German" }, { value: "pt", label: "Portuguese" }, { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" }, { value: "zh", label: "Chinese" }, { value: "ja", label: "Japanese" },
] as const;

interface BulkRow {
  id: number;
  type: "url" | "text";
  content: string;
  loading: boolean;
  comments: string[];
}

let rowIdCounter = 1;

const BulkGeneratePage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BulkRow[]>([{ id: rowIdCounter++, type: "text", content: "", loading: false, comments: [] }]);
  const [tone, setTone] = useState("Professional");
  const [platform, setPlatform] = useState("LinkedIn");
  const [language, setLanguage] = useState("en");
  const [includeEmoji, setIncludeEmoji] = useState(false);
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [includeCTA, setIncludeCTA] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const addRow = () => {
    if (rows.length >= 5) { toast.error("Maximum 5 posts at once"); return; }
    setRows((prev) => [...prev, { id: rowIdCounter++, type: "text", content: "", loading: false, comments: [] }]);
  };

  const removeRow = (id: number) => { if (rows.length <= 1) return; setRows((prev) => prev.filter((r) => r.id !== id)); };
  const updateRow = (id: number, updates: Partial<BulkRow>) => setRows((prev) => prev.map((r) => r.id === id ? { ...r, ...updates } : r));

  const generateAll = async () => {
    const validRows = rows.filter((r) => r.content.trim());
    if (validRows.length === 0) { toast.error("Add at least one post"); return; }
    setRows((prev) => prev.map((r) => r.content.trim() ? { ...r, loading: true, comments: [] } : r));
    await Promise.all(validRows.map(async (row) => {
      try {
          const comments = await generateComments({
            content: row.content, tone, platform, length: "Medium", language,
            input_type: row.type,
            include_emoji: includeEmoji, include_hashtags: includeHashtags, include_cta: includeCTA,
          });
          updateRow(row.id, { comments, loading: false });
          await supabase.from("comment_history").insert({ user_id: user!.id, input_type: row.type, input_content: row.content.slice(0, 500), platform, tone, length: "Medium", generated_comments: comments });
      } catch { updateRow(row.id, { loading: false }); toast.error("Failed to generate for row"); }
    }));
    toast.success("All done!");
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id); toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAllForRow = async (comments: string[]) => {
    await navigator.clipboard.writeText(comments.map((c, i) => `--- #${i + 1} ---\n${c}`).join("\n\n"));
    toast.success("All comments copied!");
  };

  const exportCSV = () => {
    const headers = ["Post Content", "Type", "Comment 1", "Comment 2", "Comment 3"];
    const csvRows = rows.filter((r) => r.comments.length > 0).map((r) => [r.content.replace(/"/g, '""'), r.type, ...r.comments.map((c) => c.replace(/"/g, '""'))]);
    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crivox-bulk-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported!");
  };

  const anyLoading = rows.some((r) => r.loading);
  const anyResults = rows.some((r) => r.comments.length > 0);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Bulk Generate</h1>
            <p className="text-muted-foreground text-sm mt-1">Generate comments for up to 5 posts at once</p>
          </div>
          {anyResults && (
            <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={exportCSV}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        </div>

        {/* Global controls */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2.5 block">Tone (all rows)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {tones.map((t) => (
                <button key={t.label} onClick={() => setTone(t.label)}
                  className={cn("flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-medium border",
                    tone === t.label ? "bg-blue-600 text-white border-blue-600" : "bg-card text-foreground border-border hover:bg-accent"
                  )}>
                  <t.icon className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Platform</label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Language
              </label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex items-center gap-2">
              <Switch id="bulk-emoji" checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
              <Label htmlFor="bulk-emoji" className="flex items-center gap-1.5 text-sm cursor-pointer"><SmilePlus className="h-3.5 w-3.5 text-muted-foreground" /> Emojis</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="bulk-hashtags" checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
              <Label htmlFor="bulk-hashtags" className="flex items-center gap-1.5 text-sm cursor-pointer"><Hash className="h-3.5 w-3.5 text-muted-foreground" /> Hashtags</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="bulk-cta" checked={includeCTA} onCheckedChange={setIncludeCTA} />
              <Label htmlFor="bulk-cta" className="flex items-center gap-1.5 text-sm cursor-pointer"><MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" /> CTA</Label>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id} className="bg-card border border-border rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Post {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <Select value={row.type} onValueChange={(v) => updateRow(row.id, { type: v as "url" | "text" })}>
                    <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  {rows.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeRow(row.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {row.type === "url" ? (
                <Input placeholder="https://..." value={row.content} onChange={(e) => updateRow(row.id, { content: e.target.value })} />
              ) : (
                <Textarea placeholder="Paste post content..." value={row.content} onChange={(e) => updateRow(row.id, { content: e.target.value })} rows={3} />
              )}

              {row.loading && <div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>}

              {row.comments.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => handleCopyAllForRow(row.comments)}>
                      <CopyPlus className="h-3.5 w-3.5" /> Copy All
                    </Button>
                  </div>
                  {row.comments.map((c, ci) => (
                    <div key={ci} className="flex items-start gap-2 bg-accent rounded-lg p-3">
                      <span className="text-xs font-semibold text-blue-600 shrink-0 mt-0.5">#{ci + 1}</span>
                      <p className="flex-1 text-sm text-foreground whitespace-pre-wrap">{c}</p>
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => handleCopy(c, `${row.id}-${ci}`)}>
                        {copiedId === `${row.id}-${ci}` ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {rows.length < 5 && (
          <Button variant="outline" className="w-full gap-1.5" onClick={addRow}>
            <Plus className="h-4 w-4" /> Add Post ({rows.length}/5)
          </Button>
        )}

        <Button className="w-full gap-2 bg-blue-600 text-white" size="lg" onClick={generateAll} disabled={anyLoading}>
          <Sparkles className="h-4 w-4" />
          {anyLoading ? "Generating..." : "Generate All"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default BulkGeneratePage;
