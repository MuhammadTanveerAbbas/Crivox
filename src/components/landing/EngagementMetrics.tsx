import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, MessageCircle, ThumbsUp } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const weeklyData = [
  { day: "Mon", comments: 12, likes: 34 },
  { day: "Tue", comments: 19, likes: 52 },
  { day: "Wed", comments: 15, likes: 41 },
  { day: "Thu", comments: 28, likes: 78 },
  { day: "Fri", comments: 35, likes: 95 },
  { day: "Sat", comments: 42, likes: 110 },
  { day: "Sun", comments: 38, likes: 110 },
  { day: "Sun", comments: 38, likes: 102 },
];

const growthData = [
  { month: "Jan", engagement: 18 },
  { month: "Feb", engagement: 32 },
  { month: "Mar", engagement: 27 },
  { month: "Apr", engagement: 48 },
  { month: "May", engagement: 61 },
  { month: "Jun", engagement: 74 },
  { month: "Jul", engagement: 89 },
];

const metrics = [
  { icon: TrendingUp, label: "Avg. engagement lift", value: "3.8×", color: "text-blue-600" },
  { icon: MessageCircle, label: "Comments generated", value: "50K+", color: "text-blue-500" },
  { icon: ThumbsUp, label: "Positive reactions", value: "94%", color: "text-blue-400" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export const EngagementMetrics = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (inView) setAnimated(true);
  }, [inView]);

  return (
    <section ref={ref} className="px-4 sm:px-6 py-16 sm:py-24 bg-muted/20">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium mb-4">
            <TrendingUp className="h-3 w-3" />
            Real engagement data
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Comments that actually perform
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Users who comment with Crivox see measurably higher engagement  more replies, more likes, more reach.
          </p>
        </ScrollReveal>

        {/* Metric pills */}
        <StaggerContainer className="grid grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12">
          {metrics.map(({ icon: Icon, label, value, color }) => (
            <StaggerItem key={label}>
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 text-center shadow-sm">
                <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
                <div className={`font-display text-2xl sm:text-3xl font-medium ${color} tracking-tight`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Charts grid */}
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Bar chart */}
          <ScrollReveal direction="left">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Weekly activity</p>
              <p className="text-xs text-muted-foreground mb-5">Comments & likes generated per day</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklyData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", radius: 4 }} />
                  {animated && (
                    <>
                      <Bar dataKey="comments" name="Comments" fill="hsl(221 83% 58%)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                      <Bar dataKey="likes" name="Likes" fill="hsl(213 93% 80%)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={150} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" /> Comments
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-200 inline-block" /> Likes
                </span>
              </div>
            </div>
          </ScrollReveal>

          {/* Area chart */}
          <ScrollReveal direction="right">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Engagement growth</p>
              <p className="text-xs text-muted-foreground mb-5">Monthly engagement score over time</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={growthData}>
                  <defs>
                    <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221 83% 58%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(221 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  {animated && (
                    <Area
                      type="monotone"
                      dataKey="engagement"
                      name="Score"
                      stroke="hsl(221 83% 58%)"
                      strokeWidth={2.5}
                      fill="url(#engGradient)"
                      dot={{ r: 3.5, fill: "hsl(221 83% 58%)", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "hsl(221 83% 58%)" }}
                      isAnimationActive
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                <span className="text-xs text-muted-foreground">Engagement score</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
