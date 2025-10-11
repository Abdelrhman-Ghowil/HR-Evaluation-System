
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import BackToTop from "./components/common/BackToTop";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/employees" element={<Index />} />
            <Route path="/evaluations" element={<Index />} />
            <Route path="/companies" element={<Index />} />
            <Route path="/departments" element={<Index />} />
            <Route path="/sub-departments" element={<Index />} />
            <Route path="/sections" element={<Index />} />
            <Route path="/sub-sections" element={<Index />} />
            <Route path="/replacements" element={<Index />} />
            <Route path="/employee-profile" element={<Index />} />
            <Route path="/profile" element={<Index />} />
            <Route path="/admin" element={<Index />} />
            <Route path="/admin/weights-configuration" element={<Index />} />
            <Route path="/admin/user-management" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BackToTop />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
