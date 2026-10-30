import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import BlogIndex from "./pages/BlogIndex";
import BlogArticulo from "./pages/BlogArticulo";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import Formularios from "./pages/admin/Formularios";
import FormularioDetalle from "./pages/admin/FormularioDetalle";
import Importar from "./pages/admin/Importar";
import Configuracion from "./pages/admin/Configuracion";
import GenerarCotizacion from "./pages/admin/GenerarCotizacion";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/blog" element={<BlogIndex />} />
            <Route path="/blog/:slug" element={<BlogArticulo />} />

            {/* Protected admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/formularios"
              element={
                <ProtectedRoute>
                  <Formularios />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/formularios/:id"
              element={
                <ProtectedRoute>
                  <FormularioDetalle />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/formularios/:id/cotizar"
              element={
                <ProtectedRoute>
                  <GenerarCotizacion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/cotizar"
              element={
                <ProtectedRoute>
                  <GenerarCotizacion />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/importar"
              element={
                <ProtectedRoute>
                  <Importar />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/configuracion"
              element={
                <ProtectedRoute>
                  <Configuracion />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
