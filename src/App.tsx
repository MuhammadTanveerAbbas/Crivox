import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ProtectedRoute from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import HistoryPage from "./pages/HistoryPage";
import StatsPage from "./pages/StatsPage";
import TemplatesPage from "./pages/TemplatesPage";
import BulkGeneratePage from "./pages/BulkGeneratePage";
import QueuePage from "./pages/QueuePage";
import SharePage from "./pages/SharePage";
import SettingsPage from "./pages/SettingsPage";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status >= 400 && error?.status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              {/* Public routes — redirect to /dashboard if already logged in */}
              <Route element={<PublicRoute />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Share page — public, no auth redirect */}
              <Route path="/share/:slug" element={<SharePage />} />
              <Route path="/pricing" element={<PricingPage />} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/dashboard/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
              <Route path="/dashboard/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
              <Route path="/dashboard/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/dashboard/bulk" element={<ProtectedRoute><BulkGeneratePage /></ProtectedRoute>} />
              <Route path="/dashboard/queue" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
              <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
