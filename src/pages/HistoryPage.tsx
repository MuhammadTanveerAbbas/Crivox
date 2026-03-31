import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Check, ChevronDown, Trash2, Download, Search, Star, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  id: string;
  input_type: string;
  input_content: string | null;
  platform: string;
  tone: string;
  length: string;
  generated_comments: string[];
  created_at: string;
  is_favorite: boolean;
}

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTone, setFilterTone] = useState("all");
  const [filterPlatform, setFilterPlatform] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      const { data, error } = await supabase
        .from("comment_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) { toast.error("Failed to load history"); }
      else {
        setItems((data ?? []).map((d: any) => ({
          ...d,
          generated_comments: Array.isArray(d.generated_comments) ? d.generated_comments : [],
          is_favorite: d.is_favorite ?? false,
        })));
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const filtered = useMemo(() => items.filter((item) => {
    if (showFavoritesOnly && !item.is_favorite) return false;
    if (filterTone !== "all" && item.tone !== filterTone) return false;
    if (filterPlatform !== "all" && item.platform !== filterPlatform) return false;
    if (search && !item.input_content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [items, filterTone, filterPlatform, search, showFavoritesOnly]);

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comment_history").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setItems((prev) => prev.filter((i) => i.id !== id)); toast.success("Deleted"); }
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    const { error } = await supabase.from("comment_history").update({ is_favorite: !current }).eq("id", id);
    if (error) toast.error("Failed to update");
    else setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_favorite: !current } : i));
  };

  const handleRegenerate = (item: HistoryItem) => {
    const params = new URLSearchParams({
      tone: item.tone,
      platform: item.platform,
      length: item.length,
      input_type: item.input_type,
      content: item.input_content || "",
    });
    navigate(`/dashboard?${params.toString()}`);
    toast.success("Settings loaded  ready to generate!");
  };

  const exportCSV = () => {
    const headers = ["Date", "Platform", "Tone", "Length", "Input Type", "Input Content", "Favorite", "Comment 1", "Comment 2", "Comment 3"];
    const rows = filtered.map((item) => [
      format(new Date(item.created_at), "yyyy-MM-dd HH:mm"), item.platform, item.tone, item.length, item.input_type,
      (item.input_content ?? "").replace(/"/g, '""'), item.is_favorite ? "Yes" : "No",
      ...item.generated_comments.map((c) => c.replace(/"/g, '""')),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `crivox-history-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("History exported!");
  };

  const uniqueTones = [...new Set(items.map((i) => i.tone))];
  const uniquePlatforms = [...new Set(items.map((i) => i.platform))];
  const favCount = items.filter((i) => i.is_favorite).length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">History</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {filtered.length} past generation{filtered.length !== 1 ? "s" : ""}
              {showFavoritesOnly && ` (${favCount} favorited)`}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              size="sm"
              className={cn("gap-1.5", showFavoritesOnly && "bg-blue-600 text-white border-blue-600")}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className={cn("h-3.5 w-3.5", showFavoritesOnly && "fill-current")} />
              Favorites
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCSV} disabled={filtered.length === 0}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search content..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterTone} onValueChange={setFilterTone}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Tone" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tones</SelectItem>
              {uniqueTones.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPlatform} onValueChange={setFilterPlatform}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Platform" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              {uniquePlatforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-sm p-4">
                <Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center text-muted-foreground">
            {items.length === 0 ? "No history yet. Generate your first comment!" : "No results match your filters."}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-2">

            {filtered.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-4 sm:px-5 py-3 text-left"
                  onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                >
                  {item.is_favorite && <Star className="h-3.5 w-3.5 text-blue-600 fill-blue-600 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground line-clamp-1">{item.input_content || "No content"}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <p className="text-xs text-muted-foreground">{format(new Date(item.created_at), "MMM d, yyyy · h:mm a")}</p>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.platform}</span>
                      <span className="text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{item.tone}</span>
                    </div>
                  </div>
                  <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", expanded === item.id && "rotate-180")} />
                </button>

                {expanded === item.id && (
                  <div className="px-5 pb-4 space-y-2 border-t border-border pt-3">
                    {item.generated_comments.map((c, idx) => (
                      <div key={idx} className="flex items-start gap-2 bg-accent rounded-lg p-3">
                        <span className="text-xs font-semibold text-blue-600 shrink-0 mt-0.5">#{idx + 1}</span>
                        <p className="flex-1 text-sm text-foreground whitespace-pre-wrap leading-relaxed">{c}</p>
                        <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); handleCopy(c, `${item.id}-${idx}`); }}>
                          {copiedId === `${item.id}-${idx}` ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-1 pt-1 flex-wrap">
                      <Button variant="ghost" size="sm"
                        className={cn("gap-1.5", item.is_favorite ? "text-blue-600" : "text-muted-foreground")}
                        onClick={() => handleToggleFavorite(item.id, item.is_favorite)}>
                        <Star className={cn("h-3.5 w-3.5", item.is_favorite && "fill-current")} />
                        {item.is_favorite ? "Favorited" : "Favorite"}
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => handleRegenerate(item)}>
                        <RefreshCw className="h-3.5 w-3.5" /> Re-generate
                      </Button>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-red-500 ml-auto" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;
