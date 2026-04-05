import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Copy, Check, ArrowRight } from "lucide-react";
import CrivoxIcon from "@/components/CrivoxIcon";
import { toast } from "sonner";

interface SharedData {
  post_summary: string | null;
  comments: string[];
  tone: string;
  platform: string;
}

const SharePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!slug) return;
    const fetch = async () => {
      const { data: row, error } = await supabase
        .from("shared_comments")
        .select("post_summary, comments, tone, platform")
        .eq("share_slug", slug)
        .single();

      if (error || !row) {
        setNotFound(true);
      } else {
        setData({
          post_summary: row.post_summary,
          comments: Array.isArray(row.comments) ? (row.comments as string[]) : [],
          tone: row.tone,
          platform: row.platform,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [slug]);

  const handleCopy = async (text: string, idx: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    toast.success("Copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Not Found</h1>
        <p className="text-muted-foreground mb-6">This shared comment link doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="orb absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="orb-delayed absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <nav className="flex items-center gap-2 px-4 sm:px-6 py-4 max-w-3xl mx-auto">
        <CrivoxIcon size={24} />
        <span className="font-display text-base text-foreground">Crivox</span>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
            {data?.platform}
          </span>
          <span className="text-xs font-medium bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full">
            {data?.tone}
          </span>
        </div>

        {data?.post_summary && (
          <div className="glass rounded-2xl p-5">
            <span className="text-xs font-medium text-muted-foreground mb-2 block">Original Post Summary</span>
            <p className="text-sm text-foreground">{data.post_summary}</p>
          </div>
        )}

        <h2 className="text-lg font-semibold text-foreground">Generated Comments</h2>

        <div className="space-y-3">
          {data?.comments.map((comment, idx) => (
            <div key={idx} className="glass rounded-2xl p-5 hover-lift">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold gradient-text">Variation {idx + 1}</span>
                <span className="text-xs text-muted-foreground">{comment.length} chars</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap font-mono-code leading-relaxed">{comment}</p>
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy(comment, idx)}
                >
                  {copiedIdx === idx ? (
                    <><Check className="h-3.5 w-3.5 text-primary" /> Copied!</>
                  ) : (
                    <><Copy className="h-3.5 w-3.5" /> Copy</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 text-center mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Try Crivox</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Generate perfect comments for any social post  free.
          </p>
          <Button onClick={() => navigate("/login")}>
            Get Started <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SharePage;
