import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const PageTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <div
      key={location.pathname}
      className={cn(
        "animate-in fade-in slide-in-from-bottom-2 duration-300"
      )}
    >
      {children}
    </div>
  );
};

export default PageTransition;
