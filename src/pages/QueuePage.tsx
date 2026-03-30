import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle2, Circle, Trash2, Plus, Copy, Check, CalendarDays, StickyNote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface QueueItem {
  id: string;
  comment_text: string;
  platform: string;
  tone: string;
  notes: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
}

const platforms = ["LinkedIn", "Twitter/X", "Instagram", "Facebook", "Reddit", "Blog/Website", "Other"] as const;

const QueuePage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newPlatform, setNewPlatform] = useState("LinkedIn");
  const [newNotes, setNewNotes] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchQueue = async () => {
      const { data, error } = await supabase.from("comment_queue").select("*")
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) toast.error("Failed to load queue");
      else setItems((data ?? []) as QueueItem[]);
      setLoading(false);
    };
    fetchQueue();
  }, [user]);

  const filtered = useMemo(() => filterStatus === "all" ? items : items.filter((i) => i.status === filterStatus), [items, filterStatus]);
  const pendingCount = items.filter((i) => i.status === "pending").length;
  const postedCount = items.filter((i) => i.status === "posted").length;

  const grouped = useMemo(() => {
    const groups: Record<string, QueueItem[]> = {};
    filtered.forEach((item) => {
      const key = item.scheduled_date ? format(new Date(item.scheduled_date), "EEEE, MMM d, yyyy") : "Unscheduled";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filtered]);

  const handleAdd = async () => {
    if (!newComment.trim()) { toast.error("Comment text is required"); return; }
    const { data, error } = await supabase.from("comment_queue").insert({
      user_id: user!.id, comment_text: newComment, platform: newPlatform, tone: "Professional",
      notes: newNotes || null, scheduled_date: newDate || null, scheduled_time: newTime || null,
    }).select().single();
    if (error) toast.error("Failed to add to queue");
    else {
      setItems((prev) => [data as QueueItem, ...prev]);
      setNewComment(""); setNewNotes(""); setNewDate(""); setNewTime("");
      setDialogOpen(false); toast.success("Added to queue!");
    }
  };

  const handleToggleStatus = async (item: QueueItem) => {
    const newStatus = item.status === "pending" ? "posted" : "pending";
    const { error } = await supabase.from("comment_queue").update({
      status: newStatus, completed_at: newStatus === "posted" ? new Date().toISOString() : null,
    }).eq("id", item.id);
    if (error) toast.error("Failed to update");
    else {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: newStatus, completed_at: newStatus === "posted" ? new Date().toISOString() : null } : i));
      toast.success(newStatus === "posted" ? "Marked as posted!" : "Moved back to pending");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("comment_queue").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { setItems((prev) => prev.filter((i) => i.id !== id)); toast.success("Removed from queue"); }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id); toast.success("Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filterBtns = [
    { value: "all", label: "All" },
    { value: "pending", label: `Pending (${pendingCount})` },
    { value: "posted", label: `Posted (${postedCount})` },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Queue</h1>
            <p className="text-muted-foreground text-sm mt-1">{pendingCount} pending · {postedCount} posted</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-blue-600 text-white self-start">
                <Plus className="h-3.5 w-3.5" /> Add to Queue
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border border-border">
              <DialogHeader><DialogTitle className="text-foreground">Add to Queue</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <Textarea placeholder="Paste your comment here..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={4} className="text-sm" />
                <Select value={newPlatform} onValueChange={setNewPlatform}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Notes (optional)" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3 text-muted-foreground" /> Date</label>
                    <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" /> Time</label>
                    <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full bg-blue-600 text-white">Add to Queue</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterBtns.map((f) => (
            <button key={f.value} onClick={() => setFilterStatus(f.value)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap", filterStatus === f.value ? "bg-blue-600 text-white" : "bg-accent text-muted-foreground")}
            >{f.label}</button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-sm p-5">
                <Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-10 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">{items.length === 0 ? "Your queue is empty" : "No items match this filter"}</p>
            <p className="text-sm text-muted-foreground mt-1">Add comments from the generator or click "Add to Queue" above</p>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([dateLabel, groupItems]) => (
          <div key={dateLabel} className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5" />{dateLabel}
            </h3>
            {groupItems.map((item) => (
              <div key={item.id} className={cn("bg-card border border-border rounded-xl shadow-sm p-4", item.status === "posted" && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <button onClick={() => handleToggleStatus(item)} className="mt-0.5 shrink-0">
                    {item.status === "posted"
                      ? <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      : <Circle className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm text-foreground whitespace-pre-wrap leading-relaxed", item.status === "posted" && "line-through text-muted-foreground")}>
                      {item.comment_text}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">{item.platform}</span>
                      {item.scheduled_time && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{item.scheduled_time.slice(0, 5)}</span>
                      )}
                      {item.notes && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><StickyNote className="h-3 w-3" />{item.notes}</span>
                      )}
                      {item.status === "posted" && item.completed_at && (
                        <span className="text-xs text-muted-foreground">Posted {format(new Date(item.completed_at), "MMM d 'at' h:mm a")}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(item.comment_text, item.id)}>
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-blue-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default QueuePage;
