import { MessageSquare } from "lucide-react";

const links = {
  Product: ["Features", "Pricing", "Changelog"],
  Resources: ["Documentation", "Blog", "Support"],
  Legal: ["Privacy", "Terms", "Contact"],
};

export const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-10">
        {/* Brand */}
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-display text-base text-foreground">Crivox</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
            AI-powered comments that sound like you. For every platform.
          </p>
          <p className="text-xs text-muted-foreground mt-4">© 2026 Crivox. All rights reserved.</p>
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
    </div>
  </footer>
);
