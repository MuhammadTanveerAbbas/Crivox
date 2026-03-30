import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Link, Type, ImageIcon, Copy, Check, Sparkles, RefreshCw, Pencil, Share2, BookmarkPlus,
  Briefcase, Coffee, Laugh, Heart, Flame, GraduationCap, Lightbulb, Shield,
  Hash, SmilePlus, MousePointerClick, Languages, Command, CopyPlus, CalendarPlus,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateComments } from "@/lib/groq";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

const lengths = ["Short", "Medium", "Long", "AI Decides"] as const;
const platforms = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit", "Blog/Website", "Other"] as const;
const languages = [
  { value: "en", label: "English" }, { value: "es", label: "Spanish" },
  { value: "fr", label: "French" }, { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" }, { value: "hi", label: "Hindi" },
  { value: "ar", label: "Arabic" }, { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
] as const;

interface PrefillProps {
  tone?: string;
  platform?: string;
  length?: string;
  inputType?: string;
  content?: string;
}

const CommentGenerator = ({ prefill }: { prefill?: PrefillProps }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(prefill?.inputType ?? "text");
  const [url, setUrl] = useState(prefill?.inputType === "url" ? (prefill?.content ?? "") : "");
  const [text, setText] = useState(prefill?.inputType !== "url" ? (prefill?.content ?? "") : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [tone, setTone] = useState<string>(prefill?.tone ?? "Professional");
  const [length, setLength] = useState<string>(prefill?.length ?? "Medium");
  const [platform, setPlatform] = useState<string>(prefill?.platform ?? "LinkedIn");
  const [language, setLanguage] = useState<string>("en");
  const [includeEmoji, setIncludeEmoji] = useState(false);
  const [includeHashtags, setIncludeHashtags] = useState(false);
  const [includeCTA, setIncludeCTA] = useState(false);
  const [commentCount, setCommentCount] = useState(3);

  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!user || prefill) return;
    supabase.from("profiles").select("default_tone, default_platform, default_language")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.default_tone) setTone(data.default_tone);
          if (data.default_platform) setPlatform(data.default_platform);
          if (data.default_language) setLanguage(data.default_language);
        }
      });
  }, [user]);

  const getInputContent = (): string => {
    if (tab === "url") return url;
    if (tab === "text") return text;
    if (tab === "image" && imageFile) return "[Image uploaded]";
    return "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGenerate = useCallback(async () => {
    const content = getInputContent();
    if (!content && tab !== "image") { toast.error("Please provide some content first"); return; }
    if (tab === "image" && !imageFile) { toast.error("Please upload an image first"); return; }

    setLoading(true);
    setComments([]);

    try {
      const generated = await generateComments({
        content: tab === "image" ? "" : content,
        image_base64: tab === "image" ? imagePreview ?? undefined : undefined,
        input_type: tab as "url" | "text" | "image",
        tone, length, platform, language,
        include_emoji: includeEmoji, include_hashtags: includeHashtags,
        include_cta: includeCTA, count: commentCount,
      });

      setComments(generated);
      await supabase.from("comment_history").insert({
        user_id: user!.id, input_type: tab,
        input_content: tab === "image" ? "[Image]" : content.slice(0, 500),
        platform, tone, length, generated_comments: generated,
      });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to generate comments");
    } finally {
      setLoading(false);
    }
  }, [tab, url, text, imageFile, imagePreview, tone, length, platform, language, includeEmoji, includeHashtags, includeCTA, commentCount, user]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loading) { e.preventDefault(); handleGenerate(); }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "C" && comments.length > 0) {
        e.preventDefault(); navigator.clipboard.writeText(comments[0]); toast.success("First comment copied!");
      }
      if (e.key === "Escape" && comments.length > 0 && editingIdx === null) setComments([]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleGenerate, loading, comments, editingIdx]);

  const handleRegenerate = async (idx: number) => {
    setRegeneratingIdx(idx);
    try {
      const content = getInputContent();
      const generated = await generateComments({
        content: tab === "image" ? "" : content,
        image_base64: tab === "image" ? imagePreview ?? undefined : undefined,
        input_type: tab as "url" | "text" | "image",
        tone, length, platform, language,
        include_emoji: includeEmoji, include_hashtags: includeHashtags, include_cta: includeCTA,
        single: true, variation_number: idx + 1,
      });
      if (generated[0]) {
        setComments((prev) => prev.map((c, i) => (i === idx ? generated[0] : c)));
        toast.success("Comment regenerated!");
      }
    } catch { toast.error("Failed to regenerate"); }
    finally { setRegeneratingIdx(null); }
  };

  const handleCopy = async (comment: string, idx: number) => {
    await navigator.clipboard.writeText(comment);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = async () => {
    const all = comments.map((c, i) => `--- ${i + 1} ---\n${c}`).join("\n\n");
    await navigator.clipboard.writeText(all);
    toast.success("All comments copied!");
  };

  const handleEditSave = (idx: number, value: string) => {
    setComments((prev) => prev.map((c, i) => (i === idx ? value : c)));
    setEditingIdx(null);
    toast.success("Updated");
  };

  const handleSaveAsTemplate = async (comment: string) => {
    try {
      await supabase.from("comment_templates").insert({
        user_id: user!.id, category: "Appreciation",
        title: comment.slice(0, 50) + (comment.length > 50 ? "..." : ""), content: comment,
      });
      toast.success("Saved as template!");
    } catch { toast.error("Failed to save"); }
  };

  const handleAddToQueue = async (comment: string) => {
    try {
      await supabase.from("comment_queue").insert({ user_id: user!.id, comment_text: comment, platform, tone });
      toast.success("Added to queue!");
    } catch { toast.error("Failed to add"); }
  };

  const handleShare = async () => {
    try {
      const content = getInputContent();
      const { data, error } = await supabase.from("shared_comments").insert({
        user_id: user!.id, post_summary: content.slice(0, 500) || null,
        comments, tone, platform,
      }).select("share_slug").single();
      if (error) throw error;
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.share_slug}`);
      toast.success("Share link copied!");
    } catch { toast.error("Failed to create share link"); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 w-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-foreground">Comment Generator</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate AI-powered comments for any post</p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="hidden md:flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
              <Command className="h-3 w-3" />+Enter
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs"><strong>⌘+Enter</strong> Generate · <strong>⌘+⇧+C</strong> Copy first · <strong>Esc</strong> Clear</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Input */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="url" className="gap-1.5 text-xs"><Link className="h-3.5 w-3.5" /> URL</TabsTrigger>
            <TabsTrigger value="text" className="gap-1.5 text-xs"><Type className="h-3.5 w-3.5" /> Text</TabsTrigger>
            <TabsTrigger value="image" className="gap-1.5 text-xs"><ImageIcon className="h-3.5 w-3.5" /> Image</TabsTrigger>
          </TabsList>
          <TabsContent value="url"><Input placeholder="https://linkedin.com/posts/..." value={url} onChange={(e) => setUrl(e.target.value)} /></TabsContent>
          <TabsContent value="text"><Textarea placeholder="Paste the post content here..." value={text} onChange={(e) => setText(e.target.value)} rows={4} /></TabsContent>
          <TabsContent value="image">
            <div className="space-y-2">
              <Input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-md max-h-40 object-contain border border-border" />}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        {/* Tone */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Tone</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {tones.map((t) => (
              <button
                key={t.label}
                onClick={() => setTone(t.label)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-2 rounded-xl text-xs sm:text-sm border",
                  tone === t.label
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-accent"
                )}
              >
                <t.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Length</label>
          <div className="flex flex-wrap gap-1.5">
            {lengths.map((l) => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm border",
                  length === l
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-accent"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Platform & Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1">
              <Languages className="h-3.5 w-3.5 text-muted-foreground" /> Language
            </label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Variations */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            Variations: <span className="text-primary">{commentCount}</span>
          </label>
          <Slider value={[commentCount]} onValueChange={(v) => setCommentCount(v[0])} min={1} max={5} step={1} className="w-full" />
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch id="emoji" checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
            <Label htmlFor="emoji" className="flex items-center gap-1 text-sm cursor-pointer"><SmilePlus className="h-3.5 w-3.5 text-muted-foreground" /> Emojis</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="hashtags" checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
            <Label htmlFor="hashtags" className="flex items-center gap-1 text-sm cursor-pointer"><Hash className="h-3.5 w-3.5 text-muted-foreground" /> Hashtags</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cta" checked={includeCTA} onCheckedChange={setIncludeCTA} />
            <Label htmlFor="cta" className="flex items-center gap-1 text-sm cursor-pointer"><MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" /> CTA</Label>
          </div>
        </div>
      </div>

      {/* Generate */}
      <Button
        className="w-full gap-2 bg-blue-600 text-white rounded-xl font-medium shadow-sm"
        size="lg"
        onClick={handleGenerate}
        disabled={loading}
      >
        <Sparkles className="h-4 w-4" />
        {loading ? "Generating..." : `Generate ${commentCount} comment${commentCount > 1 ? "s" : ""}`}
      </Button>

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: commentCount }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && comments.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-foreground">Results</h2>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="gap-1 rounded-xl" onClick={handleCopyAll}><CopyPlus className="h-3 w-3" /> Copy all</Button>
              <Button variant="outline" size="sm" className="gap-1 rounded-xl" onClick={handleShare}><Share2 className="h-3 w-3" /> Share</Button>
            </div>
          </div>
          {comments.map((comment, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-600">#{idx + 1}</span>
                <span className="text-xs text-muted-foreground">{comment.length} chars</span>
              </div>

              {editingIdx === idx ? (
                <div className="space-y-2">
                  <Textarea defaultValue={comment} rows={3} className="text-sm" id={`edit-${idx}`} />
                  <div className="flex gap-1.5">
                    <Button size="sm" onClick={() => { const el = document.getElementById(`edit-${idx}`) as HTMLTextAreaElement; if (el) handleEditSave(idx, el.value); }}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment}</p>
              )}

              {editingIdx !== idx && (
                <div className="flex items-center gap-0.5 mt-3 pt-3 border-t border-border flex-wrap gap-y-1">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 text-xs px-2" onClick={() => setEditingIdx(idx)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 text-xs px-2" onClick={() => handleRegenerate(idx)} disabled={regeneratingIdx === idx}>
                    <RefreshCw className={cn("h-3 w-3", regeneratingIdx === idx && "animate-spin")} />
                    {regeneratingIdx === idx ? "..." : "Redo"}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 text-xs px-2" onClick={() => handleSaveAsTemplate(comment)}>
                    <BookmarkPlus className="h-3 w-3" /> Save
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 text-xs px-2" onClick={() => handleAddToQueue(comment)}>
                    <CalendarPlus className="h-3 w-3" /> Queue
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7 text-xs px-2 ml-auto" onClick={() => handleCopy(comment, idx)}>
                    {copiedIdx === idx ? <><Check className="h-3 w-3 text-primary" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentGenerator;
