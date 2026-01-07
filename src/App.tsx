import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Topics from "./pages/Topics";
import Drafts from "./pages/Drafts";
import Assets from "./pages/Assets";
import Schedule from "./pages/Schedule";
import Published from "./pages/Published";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/topics" element={<ProtectedRoute><Topics /></ProtectedRoute>} />
              <Route path="/drafts" element={<ProtectedRoute><Drafts /></ProtectedRoute>} />
              <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
              <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
              <Route path="/published" element={<ProtectedRoute><Published /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
