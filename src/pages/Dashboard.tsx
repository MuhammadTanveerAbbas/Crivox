import DashboardLayout from "@/components/DashboardLayout";
import CommentGenerator from "@/components/CommentGenerator";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const appliedRef = useRef(false);

  const hasPrefill = searchParams.size > 0;
  const prefill = hasPrefill ? {
    tone: searchParams.get("tone") ?? undefined,
    platform: searchParams.get("platform") ?? undefined,
    length: searchParams.get("length") ?? undefined,
    inputType: searchParams.get("input_type") ?? undefined,
    content: searchParams.get("content") ?? undefined,
  } : undefined;

  // Clean up URL params after first render so back-navigation doesn't re-apply
  useEffect(() => {
    if (hasPrefill && !appliedRef.current) {
      appliedRef.current = true;
      navigate("/dashboard", { replace: true });
    }
  }, [hasPrefill, navigate]);

  return (
    <DashboardLayout>
      <CommentGenerator prefill={prefill} />
    </DashboardLayout>
  );
};

export default Dashboard;
