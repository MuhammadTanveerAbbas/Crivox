import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Link, Type, ImageIcon, Copy, Sparkles, RefreshCw, Pencil, Share2, BookmarkPlus,
  Hash, SmilePlus, MousePointerClick, Languages, Command, CopyPlus, CalendarPlus,
  User, Settings2, Trash2, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { generateComments } from "@/lib/groq";
import type { GenerateResult } from "@/lib/groq";
import { cn } from "@/lib/utils";
import { TONES as tones, LENGTHS as lengths, PLATFORMS as platforms, LANGUAGES as languages } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

let messageIdCounter = 1;

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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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

      await supabase.from("comment_history").insert({
        user_id: user!.id, input_type: tab,
        input_content: tab === "image" ? "[Image]" : resolvedContent.slice(0, 500),
        platform, tone, length, generated_comments: result.comments,
      }).catch(() => {});
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
      if (e.key === "Escape" && editingIdx === null) setShowSettings(false);
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
    setShowSettings(false);
    setEditingIdx(null);
    setRegeneratingIdx(null);
  };

  const handleRetry = () => {
    genRef.current();
  };

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
  const lastErrorMsg = [...messages].reverse().find((m) => m.role === "error");

  const settingsPanel = (
    <>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">Tone</p>
        <div className="grid grid-cols-2 gap-1.5">
          {tones.map((t) => (
            <button
              key={t.label}
              onClick={() => setTone(t.label)}
              className={cn(
                "flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs border transition-all",
                tone === t.label
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-foreground border-border hover:bg-accent"
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Options</p>
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">Length</label>
          <div className="flex flex-wrap gap-1.5">
            {lengths.map((l) => (
              <button
                key={l}
                onClick={() => setLength(l)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs border transition-all",
                  length === l
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-accent"
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-foreground mb-1.5 block">
            Variations: <span className="text-primary">{commentCount}</span>
          </label>
          <Slider value={[commentCount]} onValueChange={(v) => { const next = v[0]; if (next !== undefined) setCommentCount(next); }} min={1} max={5} step={1} className="w-full" />
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <Switch id="emoji" checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
            <Label htmlFor="emoji" className="flex items-center gap-1 text-xs cursor-pointer"><SmilePlus className="h-3 w-3 text-muted-foreground" /> Emojis</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="hashtags" checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
            <Label htmlFor="hashtags" className="flex items-center gap-1 text-xs cursor-pointer"><Hash className="h-3 w-3 text-muted-foreground" /> Hashtags</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cta" checked={includeCTA} onCheckedChange={setIncludeCTA} />
            <Label htmlFor="cta" className="flex items-center gap-1 text-xs cursor-pointer"><MousePointerClick className="h-3 w-3 text-muted-foreground" /> CTA</Label>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] px-4 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Comment Generator</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Generate AI-powered comments for any post</p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewChat}
              className="gap-1.5 rounded-xl text-xs min-h-[44px] sm:min-h-0 text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden md:flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                <Command className="h-3 w-3" />+Enter
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs"><strong>Cmd+Enter</strong> Generate &middot; <strong>Esc</strong> Close controls</p>
            </TooltipContent>
          </Tooltip>

          {/* Desktop settings toggle */}
          <div className="hidden lg:block">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "gap-1.5 rounded-xl text-xs min-h-[44px] sm:min-h-0",
                showSettings && "bg-accent text-foreground"
              )}
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Controls</span>
            </Button>
          </div>

          {/* Mobile settings sheet */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-xl text-xs min-h-[44px] sm:min-h-0"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Controls</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-sm">Controls</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-4">
                  {settingsPanel}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Main chat area */}
        <div className={cn("flex-1 flex flex-col min-w-0", showSettings && "hidden")}>
          {/* Chat thread - scrollable */}
          <div className={cn("flex-1 space-y-4 pr-1", messages.length > 0 || loading ? "overflow-y-auto" : "overflow-hidden")}>
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Ready to generate</p>
                <p className="text-xs text-muted-foreground max-w-[220px]">
                  Paste a post below, choose your tone and platform, then hit Generate
                </p>
              </div>
            )}

            {messages.map((msg) => {
              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground">You</span>
                        <span className="text-[10px] text-muted-foreground">
                          {msg.settings?.platform || platform}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap line-clamp-3">
                        {msg.content}
                      </p>
                      {msg.settings && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" />{msg.settings.tone}</span>
                          <span>&middot;</span>
                          <span>{msg.settings.length}</span>
                          <span>&middot;</span>
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
                    <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-red-200/60 bg-gradient-to-br from-red-50 to-red-50/50 dark:border-red-800/40 dark:from-red-950/20 dark:to-red-950/10 px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        </div>
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{msg.error}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 rounded-xl text-xs h-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={handleRetry}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Try again
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }

              if (msg.role === "assistant" && msg.comments) {
                return (
                  <div key={msg.id} className="flex justify-start">
                    <div className="max-w-[85%] w-full space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs font-medium text-foreground">Crivox AI</span>
                        <span className="text-[10px] text-muted-foreground">{msg.comments.length} comments</span>
                      </div>

                      {msg.assessment && (
                        <div className="rounded-2xl rounded-tl-md border border-amber-200/60 bg-gradient-to-br from-amber-50 to-amber-50/50 dark:border-amber-800/40 dark:from-amber-950/20 dark:to-amber-950/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 shadow-sm">
                          {msg.assessment.includes("thin") || msg.assessment.includes("light on specifics") || msg.assessment.includes("engagement bait") || msg.assessment.includes("no real content") ? (
                            <p>This post is light on specifics. Here are a few options, but consider whether a comment adds real value here.</p>
                          ) : (
                            <p>{msg.assessment}</p>
                          )}
                        </div>
                      )}

                      {msg.comments.map((comment, idx) => (
                        <div key={`${msg.id}-${idx}`} className="rounded-2xl rounded-tl-md bg-gradient-to-br from-card to-muted/30 border border-border p-4 hover:shadow-md transition-all duration-200 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-[10px] font-semibold text-primary">#{idx + 1}</span>
                            <span className="text-[10px] text-muted-foreground">{comment.length} chars</span>
                          </div>
                          {editingIdx === idx && lastAssistantMsg?.id === msg.id ? (
                            <div className="space-y-2">
                              <Textarea defaultValue={comment} rows={3} className="text-sm resize-none" id={`edit-${msg.id}-${idx}`} />
                              <div className="flex gap-1.5">
                                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => { const el = document.getElementById(`edit-${msg.id}-${idx}`) as HTMLTextAreaElement; if (el) handleEditSave(msg.id, idx, el.value); }}>Save</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingIdx(null)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment}</p>
                          )}
                          {editingIdx !== idx && (
                            <div className="flex items-center gap-0.5 mt-3 pt-2.5 border-t border-border flex-wrap">
                              <ChatAction icon={Copy} label={copiedIdx === `${msg.id}-${idx}` ? "Copied" : "Copy"} onClick={() => handleCopy(comment, `${msg.id}-${idx}`)} active={copiedIdx === `${msg.id}-${idx}`} />
                              <ChatAction icon={Pencil} label="Edit" onClick={() => setEditingIdx(idx)} />
                              <ChatAction icon={RefreshCw} label={regeneratingIdx === idx ? "..." : "Redo"} onClick={() => handleRegenerate(msg.id, idx)} disabled={regeneratingIdx === idx} spinning={regeneratingIdx === idx} />
                              <ChatAction icon={BookmarkPlus} label="Save" onClick={() => handleSaveAsTemplate(comment)} />
                              <ChatAction icon={CalendarPlus} label="Queue" onClick={() => handleAddToQueue(comment)} />
                            </div>
                          )}
                        </div>
                      ))}

                      <div className="flex items-center gap-1.5 pt-1">
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-10 sm:h-8" onClick={() => handleCopyAll(msg.comments!)}><CopyPlus className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> Copy all</Button>
                        <Button variant="outline" size="sm" className="gap-1.5 rounded-xl text-xs h-10 sm:h-8" onClick={() => handleShare(msg.comments!)}><Share2 className="h-3.5 w-3.5 sm:h-3 sm:w-3" /> Share</Button>
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input bar - fixed */}
          <div className="shrink-0 mt-4 rounded-2xl bg-gradient-to-b from-card to-muted/50 border border-border shadow-sm">
            {/* Tabs */}
            <div className="flex items-center gap-0.5 px-4 pt-3">
              {[
                { id: "url" as const, icon: Link, label: "URL" },
                { id: "text" as const, icon: Type, label: "Text" },
                { id: "image" as const, icon: ImageIcon, label: "Image" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-4 sm:px-3.5 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-t-lg text-xs font-medium transition-all relative",
                    tab === t.id
                      ? "bg-background text-foreground shadow-sm border border-b-0 border-border -mb-px"
                      : "text-muted-foreground hover:text-foreground bg-transparent border border-transparent"
                  )}
                >
                  <t.icon className={cn("h-3 w-3", tab === t.id && "text-primary")} />
                  {t.label}
                </button>
              ))}
            </div>
            {/* Input */}
            <div className="p-4 pt-3 bg-background rounded-b-2xl border-t border-border">
              {tab === "url" && (
                <div className="flex gap-2">
                  <Input placeholder="https://linkedin.com/posts/..." value={url} onChange={(e) => setUrl(e.target.value)} className="h-10 text-sm flex-1 bg-muted/30 border-border focus-visible:bg-background" />
                </div>
              )}
              {tab === "text" && (
                <Textarea placeholder="Paste the post content here..." value={text} onChange={(e) => setText(e.target.value)} rows={3} className="resize-none text-sm bg-muted/30 border-border focus-visible:bg-background" />
              )}
              {tab === "image" && (
                <div className="space-y-2">
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="text-sm bg-muted/30 border-border" />
                  {imagePreview && <img src={imagePreview} alt="Preview" className="rounded-lg max-h-32 object-contain border border-border" />}
                </div>
              )}
              {/* Quick controls row */}
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-10 sm:h-8 text-xs w-auto min-w-[100px] gap-1 bg-muted/30 border-border"><Sparkles className="h-3 w-3 text-primary" /><SelectValue /></SelectTrigger>
                  <SelectContent>{tones.map((t) => <SelectItem key={t.label} value={t.label}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="h-10 sm:h-8 text-xs w-auto min-w-[80px] bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{lengths.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="h-10 sm:h-8 text-xs w-auto min-w-[110px] bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-10 sm:h-8 text-xs w-auto min-w-[80px] gap-1 bg-muted/30 border-border"><Languages className="h-3 w-3 text-muted-foreground" /><SelectValue /></SelectTrigger>
                  <SelectContent>{languages.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex-1" />
                <Button
                  className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 sm:h-8 text-xs shadow-sm"
                  onClick={handleGenerate}
                  disabled={loading}
                >
                  <Sparkles className="h-3 w-3" />
                  {loading ? "Generating..." : "Generate"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings panel - desktop slide-out */}
        {showSettings && (
          <div className="hidden lg:block w-[300px] shrink-0 space-y-4 overflow-y-auto">
            {settingsPanel}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentGenerator;
