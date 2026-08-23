import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Shop from "./pages/Shop";
import About, { InfoPage } from "./pages/About";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderSummary from "./pages/OrderSummary";
import Admin from "./pages/Admin";
import AdminLogin, { ADMIN_AUTH_KEY } from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import { StoreLayout } from "./components/store/StoreLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <StoreLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/shipping" element={<InfoPage type="shipping" />} />
          <Route path="/contact" element={<InfoPage type="contact" />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-summary/:id" element={<OrderSummary />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={sessionStorage.getItem(ADMIN_AUTH_KEY) === "true" ? <Admin /> : <Navigate to="/admin/login" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </StoreLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

const rootElement = document.getElementById("root")!;
if (!rootElement.dataset.reactMounted) {
  rootElement.dataset.reactMounted = "true";
  createRoot(rootElement).render(<App />);
}
