import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, Trash2, ArrowRight, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Appreciation", "Question", "Insight", "Disagreement", "Encouragement", "Promotional"] as const;

const PRESETS: { category: string; title: string; content: string }[] = [
  { category: "Appreciation", title: "Thoughtful Praise", content: "This is incredibly well-written. I especially appreciate how you broke down [topic]  it makes a complex subject much more accessible." },
  { category: "Appreciation", title: "Value Recognition", content: "Thank you for sharing this! It's rare to see such a thoughtful take on [topic]. Bookmarking this for future reference." },
  { category: "Question", title: "Curious Follow-up", content: "Great post! I'm curious  how do you see [topic] evolving over the next few years? Would love to hear your thoughts." },
  { category: "Question", title: "Deeper Dive", content: "Fascinating perspective. Have you considered [alternative angle]? I'd love to see you explore that in a follow-up post." },
  { category: "Insight", title: "Add Context", content: "Building on your point about [topic], I've found that [related insight]. It really reinforces what you're saying here." },
  { category: "Insight", title: "Industry Connection", content: "This resonates deeply. In my experience with [industry/field], we've seen similar patterns. The key takeaway for me is [insight]." },
  { category: "Disagreement", title: "Respectful Challenge", content: "Interesting take, though I'd push back slightly on [specific point]. From what I've observed, [counter-argument]. What are your thoughts?" },
  { category: "Encouragement", title: "Motivational Support", content: "This is exactly the kind of content we need more of. Keep sharing your insights  they're making a real difference in the community!" },
  { category: "Encouragement", title: "Journey Recognition", content: "Love seeing your progress on this! The growth from [earlier point] to where you are now is truly inspiring. Keep going!" },
  { category: "Promotional", title: "Soft Plug", content: "Great insights! We've been working on something similar at [company/project]. Would love to connect and share notes on this." },
  { category: "Promotional", title: "Resource Share", content: "This is spot on. We actually wrote about a related topic recently  [brief description]. Happy to share the link if you're interested!" },
];

interface Template {
  id: string;
  category: string;
  title: string;
  content: string;
  is_preset: boolean;
}

const TemplatesPage = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Appreciation");

  useEffect(() => {
    if (!user) return;
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from("comment_templates")
        .select("id, category, title, content, is_preset")
        .order("created_at", { ascending: false });

      const userTemplates: Template[] = (data ?? []).map((d: any) => ({
        id: d.id, category: d.category, title: d.title, content: d.content, is_preset: d.is_preset,
      }));

      const userTitles = new Set(userTemplates.map((t) => t.title));
      const presetItems: Template[] = PRESETS
        .filter((p) => !userTitles.has(p.title))
        .map((p, i) => ({ id: `preset-${i}`, category: p.category, title: p.title, content: p.content, is_preset: true }));

      setTemplates([...userTemplates, ...presetItems]);
      setLoading(false);
    };
    fetchTemplates();
  }, [user]);

  const filtered = templates.filter((t) => {
    if (activeCategory !== "all" && t.category !== activeCategory) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleSaveNew = async () => {
    if (!newTitle.trim() || !newContent.trim()) { toast.error("Title and content are required"); return; }
    const { data, error } = await supabase.from("comment_templates")
      .insert({ user_id: user!.id, category: newCategory, title: newTitle, content: newContent })
      .select("id, category, title, content, is_preset").single();
    if (error) toast.error("Failed to save template");
    else {
      setTemplates((prev) => [{ ...data, is_preset: data.is_preset ?? false } as Template, ...prev]);
      setNewTitle(""); setNewContent(""); setDialogOpen(false);
      toast.success("Template saved!");
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("preset-")) { toast.error("Can't delete built-in templates"); return; }
    const { error } = await supabase.from("comment_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setTemplates((prev) => prev.filter((t) => t.id !== id)); toast.success("Deleted"); }
  };

  const handleUseTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("Template copied! Paste it in the generator.");
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Templates</h1>
            <p className="text-muted-foreground text-sm mt-1">Pre-built comment templates to speed up your workflow</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-blue-600 text-white self-start">
                <Plus className="h-3.5 w-3.5" /> New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border">
              <DialogHeader><DialogTitle className="text-foreground">Create Template</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Input placeholder="Template title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Template content..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={4} className="text-sm" />
                <Button onClick={handleSaveNew} className="w-full bg-blue-600 text-white">Save Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory("all")}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium", activeCategory === "all" ? "bg-blue-600 text-white" : "bg-accent text-muted-foreground")}
            >All</button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-medium", activeCategory === c ? "bg-blue-600 text-white" : "bg-accent text-muted-foreground")}
              >{c}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-sm p-5">
                <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-4 w-full mb-1" /><Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-2xl shadow-sm p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category}</span>
                  {t.id.startsWith("preset-") && <span className="text-xs text-muted-foreground">Built-in</span>}
                </div>
                <h3 className="font-semibold text-foreground text-sm mb-1">{t.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-3">{t.content}</p>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="ghost" className="gap-1.5 text-blue-600" onClick={() => handleUseTemplate(t.content)}>
                    <ArrowRight className="h-3.5 w-3.5" /> Use
                  </Button>
                  {!t.id.startsWith("preset-") && (
                    <Button size="sm" variant="ghost" className="gap-1.5 text-red-500 ml-auto" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full bg-card border border-border rounded-2xl shadow-sm p-8 text-center text-muted-foreground">
                No templates found.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TemplatesPage;
