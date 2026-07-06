import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { Loader2 } from "lucide-react";

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const StatsPage = lazy(() => import("./pages/StatsPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const BulkGeneratePage = lazy(() => import("./pages/BulkGeneratePage"));
const QueuePage = lazy(() => import("./pages/QueuePage"));
const SharePage = lazy(() => import("./pages/SharePage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const err = error as { status?: number };
        if (err?.status && err.status >= 400 && err.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
                <Routes>
                  <Route element={<PublicRoute />}>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={<Login />} />
                  </Route>

                  <Route path="/share/:slug" element={<SharePage />} />
                  <Route path="/pricing" element={<PricingPage />} />

                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/dashboard/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                  <Route path="/dashboard/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
                  <Route path="/dashboard/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
                  <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkGeneratePage /></ProtectedRoute>} />
                  <Route path="/dashboard/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
                  <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
