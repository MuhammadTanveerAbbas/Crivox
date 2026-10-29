import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Link, Type, Copy, Sparkles, RefreshCw, Pencil, Share2, BookmarkPlus,
  Hash, SmilePlus, MousePointerClick, Command, CopyPlus, CalendarPlus,
  User, Settings2, Trash2, AlertCircle, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateComments } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { TONES as tones, LENGTHS as lengths, LANGUAGES as languages } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface PrefillProps {
  tone?: string;
  platform?: string;
  length?: string;
  inputType?: string;
  content?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "error";
  content?: string;
  comments?: string[];
  assessment?: string;
  error?: string;
  settings?: {
    tone: string;
    length: string;
    platform: string;
    language: string;
  };
  timestamp: number;
}

const ChatAction = ({ icon: Icon, label, onClick, disabled, active, spinning }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; disabled?: boolean; active?: boolean; spinning?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center justify-center gap-1 text-[10px] rounded-md transition-colors",
      "min-h-[36px] sm:min-h-6 min-w-[36px] sm:min-w-0 sm:h-6 sm:px-1.5",
      active
        ? "text-green-500"
        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    )}
  >
    <Icon className={cn("h-3.5 w-3.5 sm:h-3 sm:w-3", spinning && "animate-spin")} />
    <span className="sm:inline">{label}</span>
  </button>
);

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-accent px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <Sparkles className="h-3 w-3 text-primary" />
        </div>
        <span className="text-xs font-medium text-foreground">Crivox AI</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.15s]" />
        <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.3s]" />
      </div>
    </div>
  </div>
);

const PERSIST_KEY = "crivox_control_settings";

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${PERSIST_KEY}_${key}`);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}
function persist<T>(key: string, value: T) {
  try { localStorage.setItem(`${PERSIST_KEY}_${key}`, JSON.stringify(value)); } catch { void 0; }
}

let messageIdCounter = 1;

const CommentGenerator = ({ prefill }: { prefill?: PrefillProps }) => {
  const { user } = useAuth();
  const [tab, setTab] = useState(prefill?.inputType ?? "text");
  const [url, setUrl] = useState(prefill?.inputType === "url" ? (prefill?.content ?? "") : "");
  const [text, setText] = useState(prefill?.inputType !== "url" ? (prefill?.content ?? "") : "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [tone, setTone] = useState<string>(prefill?.tone ?? loadPersisted("tone", "Professional"));
  const [length, setLength] = useState<string>(prefill?.length ?? loadPersisted("length", "Medium"));
  const [platform, setPlatform] = useState<string>(prefill?.platform ?? loadPersisted("platform", "LinkedIn"));
  const [language, setLanguage] = useState<string>(loadPersisted("language", "en"));
  const [includeEmoji, setIncludeEmoji] = useState(loadPersisted("includeEmoji", false));
  const [includeHashtags, setIncludeHashtags] = useState(loadPersisted("includeHashtags", false));
  const [includeCTA, setIncludeCTA] = useState(loadPersisted("includeCTA", false));
  const [commentCount, setCommentCount] = useState(loadPersisted("commentCount", 3));

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const genRef = useRef<() => Promise<void>>(async () => {});
  const loadingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    persist("tone", tone);
    persist("length", length);
    persist("platform", platform);
    persist("language", language);
    persist("includeEmoji", includeEmoji);
    persist("includeHashtags", includeHashtags);
    persist("includeCTA", includeCTA);
    persist("commentCount", commentCount);
  }, [tone, length, platform, language, includeEmoji, includeHashtags, includeCTA, commentCount]);

  useEffect(() => {
    if (!user || prefill) return;
    supabase.from("profiles").select("default_tone, default_platform, default_language, default_length, default_comment_count, default_include_emoji, default_include_hashtags, default_include_cta")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.default_tone) setTone(data.default_tone);
          if (data.default_platform) setPlatform(data.default_platform);
          if (data.default_language) setLanguage(data.default_language);
          if (data.default_length) setLength(data.default_length);
          if (data.default_comment_count) setCommentCount(data.default_comment_count);
          if (data.default_include_emoji != null) setIncludeEmoji(data.default_include_emoji);
          if (data.default_include_hashtags != null) setIncludeHashtags(data.default_include_hashtags);
          if (data.default_include_cta != null) setIncludeCTA(data.default_include_cta);
        }
      });
  }, [user, prefill]);

  const handleGenerate = useCallback(async () => {
    const resolvedContent = tab === "url" ? url : tab === "text" ? text : imageFile ? "[Image uploaded]" : "";
    if (!resolvedContent && tab !== "image") { toast.error("Please provide some content first"); return; }
    if (tab === "image" && !imageFile) { toast.error("Please upload an image first"); return; }

    setLoading(true);

    const userMsg: ChatMessage = {
      id: `msg-${messageIdCounter++}`,
      role: "user",
      content: resolvedContent || (tab === "image" ? "[Uploaded image]" : ""),
      settings: { tone, length, platform, language },
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await generateComments({
        content: tab === "image" ? "" : resolvedContent,
        image_base64: tab === "image" ? imagePreview ?? undefined : undefined,
        input_type: tab as "url" | "text" | "image",
        tone, length, platform, language,
        include_emoji: includeEmoji, include_hashtags: includeHashtags,
        include_cta: includeCTA, count: commentCount,
        userId: user?.id,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${messageIdCounter++}`,
        role: "assistant",
        comments: result.comments,
        assessment: result.assessment,
        settings: { tone, length, platform, language },
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const historyData = {
        user_id: user!.id, input_type: tab,
        input_content: tab === "image" ? "[Image]" : resolvedContent.slice(0, 500),
        platform, tone, length, generated_comments: result.comments,
      };
      supabase.from("comment_history").insert(historyData).then(() => {});
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to generate comments";
      const errorMsg: ChatMessage = {
        id: `msg-${messageIdCounter++}`,
        role: "error",
        error: message,
        settings: { tone, length, platform, language },
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }, [tab, url, text, imageFile, imagePreview, tone, length, platform, language, includeEmoji, includeHashtags, includeCTA, commentCount, user]);

  useEffect(() => { genRef.current = handleGenerate; }, [handleGenerate]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !loadingRef.current) { e.preventDefault(); genRef.current(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingIdx]);

  const handleRegenerate = async (msgId: string, idx: number) => {
    setRegeneratingIdx(idx);
    const resolvedContent = tab === "url" ? url : tab === "text" ? text : "";
    try {
      const result = await generateComments({
        content: tab === "image" ? "" : resolvedContent,
        image_base64: tab === "image" ? imagePreview ?? undefined : undefined,
        input_type: tab as "url" | "text" | "image",
        tone, length, platform, language,
        include_emoji: includeEmoji, include_hashtags: includeHashtags, include_cta: includeCTA,
        single: true, variation_number: idx + 1, userId: user?.id,
      });
      const replacement = result.comments[0];
      if (replacement) {
        setMessages((prev) => prev.map((m) => {
          if (m.id === msgId && m.comments) {
            return { ...m, comments: m.comments.map((c, i) => (i === idx ? replacement : c)) };
          }
          return m;
        }));
        toast.success("Comment regenerated!");
      }
    } catch {
      toast.error("Failed to regenerate");
    }
    finally { setRegeneratingIdx(null); }
  };

  const handleCopy = async (comment: string, id: string) => {
    await navigator.clipboard.writeText(comment);
    setCopiedIdx(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = async (allComments: string[]) => {
    const all = allComments.map((c, i) => `--- ${i + 1} ---\n${c}`).join("\n\n");
    await navigator.clipboard.writeText(all);
    toast.success("All comments copied!");
  };

  const handleEditSave = (msgId: string, idx: number, value: string) => {
    setMessages((prev) => prev.map((m) => {
      if (m.id === msgId && m.comments) {
        return { ...m, comments: m.comments.map((c, i) => (i === idx ? value : c)) };
      }
      return m;
    }));
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

  const handleShare = async (allComments: string[]) => {
    try {
      const resolvedContent = tab === "url" ? url : tab === "text" ? text : tab === "image" ? "[Image]" : "";
      const { data, error } = await supabase.from("shared_comments").insert({
        user_id: user!.id, post_summary: resolvedContent.slice(0, 500) || null,
        comments: allComments, tone, platform,
      }).select("share_slug").single();
      if (error) throw error;
      await navigator.clipboard.writeText(`${window.location.origin}/share/${data.share_slug}`);
      toast.success("Share link copied!");
    } catch { toast.error("Failed to create share link"); }
  };

  const handleNewChat = () => {
    setMessages([]);
    setEditingIdx(null);
    setRegeneratingIdx(null);
  };

  const handleRetry = () => {
    genRef.current();
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastErrorMsg = [...messages].reverse().find((m) => m.role === "error");

  const handleSaveSettings = async () => {
    // Always persist to localStorage
    persist("tone", tone);
    persist("length", length);
    persist("platform", platform);
    persist("language", language);
    persist("includeEmoji", includeEmoji);
    persist("includeHashtags", includeHashtags);
    persist("includeCTA", includeCTA);
    persist("commentCount", commentCount);
    // Also save all settings to Supabase profile
    if (user) {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        default_tone: tone,
        default_platform: platform,
        default_language: language,
        default_length: length,
        default_comment_count: commentCount,
        default_include_emoji: includeEmoji,
        default_include_hashtags: includeHashtags,
        default_include_cta: includeCTA,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }
    toast.success("Settings saved!");
  };

  // Compact popover panel all settings in one tight card
  const controlsPopover = (
    <div className="w-[360px] p-4 space-y-4">
      {/* Tone */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tone</p>
        <div className="grid grid-cols-4 gap-1">
          {tones.map((t) => (
            <button
              key={t.label}
              onClick={() => setTone(t.label)}
              title={t.label}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2 rounded-lg text-[10px] font-medium border transition-all",
                tone === t.label
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate w-full text-center leading-none">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Length + Variations stacked */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Length</p>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {lengths.map((l) => (
            <button
              key={l}
              onClick={() => setLength(l)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center",
                length === l
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Variations</p>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md leading-none">{commentCount}</span>
        </div>
        <div className="px-0.5">
          <Slider
            value={[commentCount]}
            onValueChange={(v) => { const next = v[0]; if (next !== undefined) setCommentCount(next); }}
            min={1} max={5} step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Toggles */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Add-ons</p>
        <div className="space-y-2">
          {[
            { id: "emoji", icon: SmilePlus, label: "Emojis", checked: includeEmoji, onChange: setIncludeEmoji },
            { id: "hashtags", icon: Hash, label: "Hashtags", checked: includeHashtags, onChange: setIncludeHashtags },
            { id: "cta", icon: MousePointerClick, label: "Call to Action", checked: includeCTA, onChange: setIncludeCTA },
          ].map(({ id, icon: Icon, label, checked, onChange }) => (
            <div key={id} className="flex items-center justify-between">
              <Label htmlFor={id} className="flex items-center gap-2 text-xs cursor-pointer text-foreground">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                {label}
              </Label>
              <Switch id={id} checked={checked} onCheckedChange={onChange} />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Save */}
      <Button
        onClick={handleSaveSettings}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-8 text-xs rounded-lg gap-1.5"
      >
        <Check className="h-3.5 w-3.5" /> Save Settings
      </Button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col max-w-5xl mx-auto px-4 sm:px-5 md:px-6 pt-4 sm:pt-5 pb-20 md:pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0 gap-2">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground leading-tight">Comment Generator</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 hidden sm:block">Generate AI-powered comments for any post</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewChat}
              className="gap-1.5 rounded-xl text-xs h-8 text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground select-none">
                <Command className="h-3 w-3" /><span>+Enter</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs"><strong>Cmd+Enter</strong> Generate · <strong>Esc</strong> Close controls</p>
            </TooltipContent>
          </Tooltip>

          {/* Controls single Popover for all screen sizes */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 rounded-xl text-xs h-8"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Controls</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="p-0 rounded-2xl border border-border shadow-lg w-[360px] max-h-[80vh] overflow-y-auto scrollbar-none"
            >
              {controlsPopover}
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Body: grows, side-by-side with settings panel on lg */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* Chat column flex column, fixed input at bottom */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">

          {/* ── Outputs scrollable ── */}
          <div className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2",
            messages.length === 0 && !loading && "flex items-center justify-center"
          )}>
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center text-center px-4">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Ready to generate</p>
                <p className="text-xs text-muted-foreground max-w-[200px] leading-relaxed">
                  Type or paste a post below, pick your tone, then hit Generate
                </p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[80%] sm:max-w-[72%] rounded-2xl rounded-br-md bg-muted border border-border p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="h-4 w-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <User className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <span className="text-[11px] font-medium text-foreground">You</span>
                          <span className="text-[10px] text-muted-foreground">{msg.settings?.platform || platform}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-4">
                          {msg.content}
                        </p>
                        {msg.settings && (
                          <div className="flex flex-wrap items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                            <span>{msg.settings.tone}</span>
                            <span>·</span>
                            <span>{msg.settings.length}</span>
                            <span>·</span>
                            <span>{languages.find((l) => l.value === msg.settings?.language)?.label}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                if (msg.role === "error") {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-red-200/70 bg-red-50/70 dark:border-red-800/40 dark:bg-red-950/20 px-4 py-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                          <span className="text-xs font-medium text-red-700 dark:text-red-400">Error</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{msg.error}</p>
                        <Button size="sm" variant="outline" className="gap-1.5 mt-3 text-xs h-7 border-red-200 dark:border-red-800 text-red-600" onClick={handleRetry}>
                          <RefreshCw className="h-3 w-3" /> Try again
                        </Button>
                      </div>
                    </div>
                  );
                }

                if (msg.role === "assistant" && msg.comments) {
                  return (
                    <div key={msg.id} className="flex justify-start">
                      <div className="max-w-[90%] w-full space-y-2">
                        {/* AI header */}
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_1px_3px_rgba(14,165,233,0.2)]">
                            <Sparkles className="h-2.5 w-2.5 text-sky-500" />
                          </div>
                          <span className="text-xs font-medium text-foreground">Crivox AI</span>
                          <span className="text-[10px] text-muted-foreground">{msg.comments.length} variation{msg.comments.length !== 1 ? "s" : ""}</span>
                        </div>

                        {msg.assessment && (
                          <div className="rounded-xl border border-amber-200/60 bg-amber-50/80 dark:border-amber-800/40 dark:bg-amber-950/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                            {msg.assessment.includes("thin") || msg.assessment.includes("light on specifics") || msg.assessment.includes("engagement bait") || msg.assessment.includes("no real content") ? (
                              <span>This post is light on specifics comments generated but consider if they add real value.</span>
                            ) : (
                              <span>{msg.assessment}</span>
                            )}
                          </div>
                        )}

                        {msg.comments.map((comment, idx) => (
                          <div key={`${msg.id}-${idx}`} className="rounded-xl bg-card border border-border overflow-hidden">
                            {/* Comment header */}
                            <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-muted/30">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold text-primary">#{idx + 1}</span>
                                <span className="text-[10px] text-muted-foreground">{comment.length} chars</span>
                              </div>
                              {/* Quick copy on header */}
                              <button
                                onClick={() => handleCopy(comment, `${msg.id}-${idx}`)}
                                className={cn(
                                  "h-6 w-6 rounded-md flex items-center justify-center transition-colors",
                                  copiedIdx === `${msg.id}-${idx}`
                                    ? "text-green-500"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                              >
                                {copiedIdx === `${msg.id}-${idx}`
                                  ? <Copy className="h-3 w-3" />
                                  : <Copy className="h-3 w-3" />}
                              </button>
                            </div>

                            {/* Comment body */}
                            <div className="px-3.5 py-3">
                              {editingIdx === idx && lastAssistantMsg?.id === msg.id ? (
                                <div className="space-y-2">
                                  <Textarea defaultValue={comment} rows={3} className="text-sm resize-none" id={`edit-${msg.id}-${idx}`} />
                                  <div className="flex gap-1.5">
                                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-7 text-xs" onClick={() => { const el = document.getElementById(`edit-${msg.id}-${idx}`) as HTMLTextAreaElement; if (el) handleEditSave(msg.id, idx, el.value); }}>Save</Button>
                                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingIdx(null)}>Cancel</Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment}</p>
                              )}
                            </div>

                            {/* Action row */}
                            {editingIdx !== idx && (
                              <div className="flex items-center gap-0.5 px-2.5 py-1.5 border-t border-border/60 bg-muted/20 flex-wrap">
                                <ChatAction icon={Copy} label={copiedIdx === `${msg.id}-${idx}` ? "Copied" : "Copy"} onClick={() => handleCopy(comment, `${msg.id}-${idx}`)} active={copiedIdx === `${msg.id}-${idx}`} />
                                <ChatAction icon={Pencil} label="Edit" onClick={() => setEditingIdx(idx)} />
                                <ChatAction icon={RefreshCw} label={regeneratingIdx === idx ? "..." : "Redo"} onClick={() => handleRegenerate(msg.id, idx)} disabled={regeneratingIdx === idx} spinning={regeneratingIdx === idx} />
                                <ChatAction icon={BookmarkPlus} label="Save" onClick={() => handleSaveAsTemplate(comment)} />
                                <ChatAction icon={CalendarPlus} label="Queue" onClick={() => handleAddToQueue(comment)} />
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Batch actions */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => handleCopyAll(msg.comments!)}>
                            <CopyPlus className="h-3 w-3" /> Copy all
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => handleShare(msg.comments!)}>
                            <Share2 className="h-3 w-3" /> Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}

              {loading && <TypingIndicator />}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar pinned at bottom ── */}
          <div className="shrink-0 mt-2 rounded-2xl bg-card border border-border overflow-hidden">
            {/* Input type tabs */}
            <div className="flex items-center gap-0.5 px-3 pt-2.5 bg-muted/30 border-b border-border">
              {[
                { id: "url" as const, icon: Link, label: "URL" },
                { id: "text" as const, icon: Type, label: "Text" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-medium transition-all",
                    tab === t.id
                      ? "bg-background text-foreground border border-b-0 border-border -mb-px"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <t.icon className={cn("h-3 w-3", tab === t.id && "text-primary")} />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Input field + controls */}
            <div className="p-3 sm:p-4 bg-background">
              {tab === "url" && (
                <Input
                  placeholder="https://linkedin.com/posts/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="h-9 text-sm bg-muted/30 border-border focus-visible:bg-background"
                />
              )}
              {tab === "text" && (
                <Textarea
                  placeholder="Paste the post content here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={3}
                  className="resize-none text-sm bg-muted/30 border-border focus-visible:bg-background min-h-[72px]"
                />
              )}

              {/* Controls row Generate button only */}
              <div className="flex justify-end mt-2.5">
                <Button
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-8 text-xs px-5 w-full sm:w-32"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <Sparkles className="h-3 w-3" />
                  {loading ? "Generating…" : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* No desktop side panel controls live in the Popover */}
      </div>
    </div>
  );
};

export default CommentGenerator;
