import CrivoxIcon from "@/components/CrivoxIcon";
import { ExternalLink } from "lucide-react";

const links = {
  Product: ["Features", "Pricing"],
  Resources: ["Docs", "Support"],
  Legal: ["Privacy", "Terms"],
};

export const Footer = () => (
  <footer className="border-t border-border bg-gradient-to-b from-card to-muted/50">
    <div className="max-w-6xl mx-auto px-4 sm:px-6">
      {/* Main grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10 py-10 sm:py-14">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <CrivoxIcon size={24} />
            <span className="font-display text-base text-foreground">Crivox</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
            AI-powered comments that sound like you. For every platform.
          </p>
          <p className="text-xs text-muted-foreground mt-4">&copy; 2026 Crivox. All rights reserved.</p>
        </div>

        {/* Link columns */}
        {Object.entries(links).map(([heading, items]) => (
          <div key={heading}>
            <h4 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">{heading}</h4>
            <ul className="space-y-2.5">
              {items.map((item) => (
                <li key={item}>
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border py-5">
        <p className="text-xs text-muted-foreground">
          Made by{" "}
          <a
            href="https://themvpguy.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            The MVP Guy
          </a>
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://themvpguy.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            themvpguy.vercel.app
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);
