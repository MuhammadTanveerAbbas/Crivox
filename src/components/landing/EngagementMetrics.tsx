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
import { Clock, Layers, Globe } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

/** Illustrative sample data — not real user metrics */
const sampleWeeklyData = [
  { day: "Mon", drafts: 2, finalized: 1 },
  { day: "Tue", drafts: 3, finalized: 2 },
  { day: "Wed", drafts: 2, finalized: 2 },
  { day: "Thu", drafts: 4, finalized: 3 },
  { day: "Fri", drafts: 5, finalized: 4 },
  { day: "Sat", drafts: 3, finalized: 3 },
  { day: "Sun", drafts: 2, finalized: 2 },
];

/** Illustrative sample data — not real user metrics */
const sampleWorkflowData = [
  { step: "Paste", time: 10 },
  { step: "Configure", time: 15 },
  { step: "Generate", time: 5 },
  { step: "Copy", time: 5 },
];

const capabilities = [
  { icon: Clock, label: "Typical generation time", value: "~5 sec", color: "text-primary" },
  { icon: Layers, label: "Variations per run", value: "Up to 5", color: "text-blue-500" },
  { icon: Globe, label: "Languages on Pro", value: "9", color: "text-blue-400" },
];

interface TooltipPayloadItem {
  name: string;
  value: string | number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
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
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Built for a faster workflow
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            Real product limits below. Charts show an example workflow, not live usage data.
          </p>
        </ScrollReveal>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-10 sm:mb-12">
          {capabilities.map(({ icon: Icon, label, value, color }) => (
            <StaggerItem key={label}>
              <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 text-center shadow-sm">
                <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
                <div className={`font-display text-2xl sm:text-3xl font-medium ${color} tracking-tight`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          <ScrollReveal direction="left">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Example weekly workflow</p>
              <p className="text-xs text-muted-foreground mb-5">Sample drafts vs. finalized comments (illustration only)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={sampleWeeklyData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--accent))", radius: 4 }} />
                  {animated && (
                    <>
                      <Bar dataKey="drafts" name="Drafts" fill="hsl(221 83% 58%)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" />
                      <Bar dataKey="finalized" name="Finalized" fill="hsl(213 93% 80%)" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={900} animationEasing="ease-out" animationBegin={150} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" /> Drafts
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-blue-200 inline-block" /> Finalized
                </span>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Example time breakdown</p>
              <p className="text-xs text-muted-foreground mb-5">Rough seconds per step for one comment (illustration only)</p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={sampleWorkflowData}>
                  <defs>
                    <linearGradient id="workflowGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(221 83% 58%)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(221 83% 58%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="step" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  {animated && (
                    <Area
                      type="monotone"
                      dataKey="time"
                      name="Seconds"
                      stroke="hsl(221 83% 58%)"
                      strokeWidth={2.5}
                      fill="url(#workflowGradient)"
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
                <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                <span className="text-xs text-muted-foreground">Estimated seconds per step</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
