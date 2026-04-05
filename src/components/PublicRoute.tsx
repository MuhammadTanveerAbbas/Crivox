import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Blocks access to public pages (landing, login) when user is already logged in
export function PublicRoute() {
  const { session, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  // Already logged in → skip landing/auth, go straight to dashboard
  if (session) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
