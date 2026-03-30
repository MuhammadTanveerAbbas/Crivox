import { Check, X, Minus } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const features = [
  { feature: "AI-generated comments", us: "yes", manual: "no", generic: "partial" },
  { feature: "Tone & platform matching", us: "yes", manual: "no", generic: "no" },
  { feature: "Screenshot-to-comment", us: "yes", manual: "no", generic: "no" },
  { feature: "Bulk generation", us: "yes", manual: "no", generic: "partial" },
  { feature: "Time per comment", us: "~5 sec", manual: "2–5 min", generic: "~15 sec" },
  { feature: "Sounds like you", us: "yes", manual: "yes", generic: "no" },
  { feature: "Queue & scheduling", us: "yes", manual: "no", generic: "no" },
  { feature: "Free tier", us: "yes", manual: "yes", generic: "partial" },
];

const renderCell = (value: string) => {
  if (value === "yes") return <Check className="h-4 w-4 text-green-500 mx-auto" />;
  if (value === "no") return <X className="h-4 w-4 text-muted-foreground mx-auto" />;
  if (value === "partial") return <Minus className="h-4 w-4 text-muted-foreground mx-auto" />;
  return <span className="text-sm text-foreground">{value}</span>;
};

export const ComparisonTable = () => (
  <section className="px-4 sm:px-6 py-16 sm:py-24 max-w-4xl mx-auto">
    <ScrollReveal className="text-center mb-10 sm:mb-12">
      <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground mb-4">
        How we compare
      </h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
        An honest look at Crivox vs. doing it yourself or using generic AI tools.
      </p>
    </ScrollReveal>

    <ScrollReveal>
      <div className="border border-border rounded-2xl overflow-x-auto shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="text-foreground font-medium text-xs min-w-[140px] py-4">Feature</TableHead>
              <TableHead className="text-center text-xs font-semibold text-white bg-blue-600 py-4 min-w-[80px]">Crivox</TableHead>
              <TableHead className="text-center text-xs font-medium text-muted-foreground py-4 min-w-[80px]">Manual</TableHead>
              <TableHead className="text-center text-xs font-medium text-muted-foreground py-4 min-w-[90px]">Generic AI</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {features.map((row, i) => (
              <TableRow key={row.feature} className={i % 2 === 0 ? "bg-card hover:bg-accent/50" : "bg-muted/30 hover:bg-accent/50"}>
                <TableCell className="text-xs sm:text-sm text-foreground font-medium py-3.5">{row.feature}</TableCell>
                <TableCell className="text-center py-3.5 bg-blue-50/10 dark:bg-blue-900/10">{renderCell(row.us)}</TableCell>
                <TableCell className="text-center py-3.5">{renderCell(row.manual)}</TableCell>
                <TableCell className="text-center py-3.5">{renderCell(row.generic)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollReveal>
  </section>
);
