import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageSquare, BarChart3, TrendingUp, Zap, Copy, Check,
  Sparkles, LayoutGrid, BookOpen, ArrowRight, Clock,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  input_type: string;
  platform: string;
  tone: string;
  created_at: string;
  generated_comments: string[];
}

const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: 12,
  color: "hsl(var(--foreground))",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("comment_history")
      .select("id, input_type, platform, tone, created_at, generated_comments")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1000);
    setItems((data || []).map((d: Record<string, unknown>) => ({
      id: d.id, input_type: d.input_type, platform: d.platform,
      tone: d.tone, created_at: d.created_at,
      generated_comments: d.generated_comments || [],
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, location.key]);

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") fetchHistory(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [fetchHistory]);

  const totalAll = items.length;
  const thisMonth = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    return items.filter((i) => new Date(i.created_at) >= start).length;
  }, [items]);

  const mostUsedTone = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.tone] = (counts[i.tone] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [items]);

  const mostUsedPlatform = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.platform] = (counts[i.platform] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [items]);

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) { days[format(subDays(new Date(), i), "MMM dd")] = 0; }
    items.forEach((item) => {
      const key = format(new Date(item.created_at), "MMM dd");
      if (key in days) days[key] = (days[key] ?? 0) + 1;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [items]);

  const recentItems = items.slice(0, 5);

  const hasData = totalAll > 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Your activity at a glance</p>
          </div>
          <Button
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm"
            onClick={() => navigate("/dashboard/generate")}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            New Comment
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 sm:p-5">
                  <Skeleton className="h-5 w-5 rounded-lg mb-3" />
                  <Skeleton className="h-7 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <Skeleton className="h-4 w-36 mb-4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        ) : !hasData ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">No comments yet</h2>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Generate your first AI-powered comment and watch your stats grow.
            </p>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-sm"
              onClick={() => navigate("/dashboard/generate")}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Generate your first comment
            </Button>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Total Generated", value: totalAll, icon: MessageSquare, trend: "all time" },
                { label: "This Month", value: thisMonth, icon: TrendingUp, trend: `${thisMonth > 0 ? "+" : ""}${thisMonth} this month` },
                { label: "Favorite Tone", value: mostUsedTone, icon: Zap, trend: "most used" },
                { label: "Top Platform", value: mostUsedPlatform, icon: BarChart3, trend: "most used" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-foreground truncate">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* 7-day chart + Quick actions */}
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">This Week</h3>
                <div className="h-[160px]">
                  {dailyData.some((d) => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} width={20} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={{ r: 3, fill: "#2563EB" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                      No activity this week
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate("/dashboard/generate")}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">Generate</div>
                      <div className="text-xs text-muted-foreground">Single comment</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/bulk")}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <LayoutGrid className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">Bulk</div>
                      <div className="text-xs text-muted-foreground">Up to 5 at once</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                  <button
                    onClick={() => navigate("/dashboard/templates")}
                    className="flex items-center gap-3 w-full p-3 rounded-xl bg-accent/50 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">Templates</div>
                      <div className="text-xs text-muted-foreground">Starter comments</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-card border border-border rounded-2xl shadow-sm">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
                <button
                  onClick={() => navigate("/dashboard/history")}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  View all
                </button>
              </div>
              {recentItems.length > 0 ? (
                <div className="divide-y divide-border">
                  {recentItems.map((item) => {
                    const firstComment = item.generated_comments?.[0] || "";
                    return (
                      <div key={item.id} className="flex items-start gap-3 p-4 sm:p-5 hover:bg-accent/30 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">{item.platform || "Unknown"}</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground">{item.tone}</span>
                            <span className="text-muted-foreground/30">·</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.created_at), "MMM d")}
                            </span>
                          </div>
                          {firstComment && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{firstComment}</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(firstComment);
                            setCopiedId(item.id);
                            toast.success("Copied to clipboard");
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center shrink-0 transition-colors"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No recent activity
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
