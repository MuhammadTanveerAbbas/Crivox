import { useState, useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import {
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./ScrollReveal";

const platformData = [
  { name: "LinkedIn", value: 38, fill: "hsl(221 83% 58%)" },
  { name: "Twitter/X", value: 24, fill: "hsl(213 93% 65%)" },
  { name: "Instagram", value: 18, fill: "hsl(221 83% 72%)" },
  { name: "Reddit", value: 12, fill: "hsl(213 93% 80%)" },
  { name: "Facebook", value: 8, fill: "hsl(221 83% 85%)" },
];

const toneData = [
  { name: "Professional", value: 85, fill: "hsl(221 83% 58%)" },
  { name: "Casual", value: 72, fill: "hsl(213 93% 65%)" },
  { name: "Witty", value: 60, fill: "hsl(221 83% 72%)" },
  { name: "Empathetic", value: 55, fill: "hsl(213 93% 80%)" },
];

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value}% of usage</p>
    </div>
  );
};

const CustomRadialTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-foreground">{payload[0].payload.name}</p>
      <p className="text-muted-foreground">Satisfaction: {payload[0].value}%</p>
    </div>
  );
};

export const PlatformInsights = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (inView) setAnimated(true);
  }, [inView]);

  return (
    <section ref={ref} className="px-4 sm:px-6 py-16 sm:py-24 bg-background">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 py-1 text-xs font-medium mb-4">
            <BarChart2 className="h-3 w-3" />
            Platform breakdown
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
            Works where you work
          </h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
            From LinkedIn thought leadership to Reddit threads  see how Crivox usage breaks down across platforms and tones.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie chart  platform distribution */}
          <ScrollReveal direction="left">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Platform distribution</p>
              <p className="text-xs text-muted-foreground mb-4">Share of comments generated per platform</p>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="value"
                        isAnimationActive={animated}
                        animationBegin={0}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      >
                        {platformData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {platformData.map((p) => (
                    <div key={p.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.fill }} />
                      <span className="text-xs text-foreground truncate flex-1">{p.name}</span>
                      <span className="text-xs font-medium text-muted-foreground">{p.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Radial bar chart  tone satisfaction */}
          <ScrollReveal direction="right">
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
              <p className="text-sm font-medium text-foreground mb-1">Tone satisfaction</p>
              <p className="text-xs text-muted-foreground mb-4">User satisfaction score by tone style</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={80}
                  barSize={12}
                  data={toneData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={6}
                    background={{ fill: "hsl(var(--muted))" }}
                    isAnimationActive={animated}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Tooltip content={<CustomRadialTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              <StaggerContainer className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                {toneData.map((t) => (
                  <StaggerItem key={t.name}>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: t.fill }} />
                      <span className="text-xs text-muted-foreground">{t.name}</span>
                      <span className="text-xs font-medium text-foreground ml-auto">{t.value}%</span>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
