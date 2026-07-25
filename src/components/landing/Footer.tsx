import CrivoxIcon from "@/components/CrivoxIcon";
import { ExternalLink, Github, Twitter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const linkGroups = [
  {
    heading: "Product",
    items: [
      { label: "Features", id: "features" },
      { label: "Pricing", route: "/pricing" },
    ],
  },
  {
    heading: "Resources",
    items: [
      { label: "Docs", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    heading: "Legal",
    items: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
    ],
  },
];

export const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 sm:gap-10 py-12 sm:py-16">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2">
            <div
              className="inline-flex items-center gap-2.5 cursor-pointer group mb-4"
              onClick={() => navigate("/")}
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <CrivoxIcon size={22} />
              </div>
              <span className="font-display text-lg text-foreground">Crivox</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-powered comments that sound like you. For every platform.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://themvpguy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
              >
                <Twitter className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
              <a
                href="https://themvpguy.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors"
              >
                <Github className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {linkGroups.map((group) => (
            <div key={group.heading}>
              <h4 className="text-xs font-semibold text-foreground mb-4 uppercase tracking-wider">{group.heading}</h4>
              <ul className="space-y-3">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <span
                      onClick={() => {
                        const link = item as any;
                        if (link.route) navigate(link.route);
                        else if (link.id) {
                          navigate("/");
                          setTimeout(() => document.getElementById(link.id)?.scrollIntoView({ behavior: "smooth" }), 100);
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    >
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border py-5">
          <p className="text-sm text-muted-foreground">
            &copy; 2026 Crivox. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-muted-foreground">
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
            <span className="text-muted-foreground/30">|</span>
            <a
              href="https://themvpguy.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              themvpguy.vercel.app
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
