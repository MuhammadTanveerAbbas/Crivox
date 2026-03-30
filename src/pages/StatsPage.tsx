import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare, BarChart3, TrendingUp, Zap } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from "recharts";
import { format, subDays } from "date-fns";

interface HistoryItem {
  id: string;
  input_type: string;
  platform: string;
  tone: string;
  created_at: string;
}

const CHART_COLORS = [
  "#2563EB", "#7C3AED", "#0D9488", "#EA580C", "#DB2777", "#16A34A", "#CA8A04",
];

const StatsPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("comment_history")
        .select("id, input_type, platform, tone, created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      setItems((data ?? []).map((d: any) => ({ id: d.id, input_type: d.input_type, platform: d.platform, tone: d.tone, created_at: d.created_at })));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalAll = items.length;

  const thisMonth = useMemo(() => {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    return items.filter((i) => new Date(i.created_at) >= start).length;
  }, [items]);

  const mostUsedTone = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.tone] = (counts[i.tone] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }, [items]);

  const mostUsedPlatform = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.platform] = (counts[i.platform] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  }, [items]);

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) { days[format(subDays(new Date(), i), "MMM dd")] = 0; }
    items.forEach((item) => { const key = format(new Date(item.created_at), "MMM dd"); if (key in days) days[key]++; });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [items]);

  const toneData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.tone] = (counts[i.tone] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [items]);

  const platformData = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => { counts[i.platform] = (counts[i.platform] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const statCards = [
    { label: "Total Generated", value: totalAll, icon: MessageSquare },
    { label: "This Month", value: thisMonth, icon: TrendingUp },
    { label: "Favorite Tone", value: mostUsedTone, icon: Zap },
    { label: "Top Platform", value: mostUsedPlatform, icon: BarChart3 },
  ];

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "0.5rem",
    fontSize: 12,
    color: "hsl(var(--foreground))",
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Stats</h1>
          <p className="text-muted-foreground text-sm mt-1">Your comment generation analytics</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                <Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {statCards.map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                  <s.icon className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="text-xl sm:text-2xl font-bold text-foreground truncate">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Generations (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Tone Distribution</h3>
                {toneData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={toneData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                        {toneData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {toneData.map((t, i) => (
                    <span key={t.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Platform Breakdown</h3>
                {platformData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={platformData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" tickLine={false} axisLine={false} width={75} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StatsPage;
