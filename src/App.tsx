import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"

import AdminPanel from "./pages/AdminPanel"
import NotFound from "./pages/NotFound"
import StrangerHero from "./components/StrangerHero"


const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* HOMEPAGE */}
            <Route
              path="/"
              element={
                <main className="bg-black text-white overflow-hidden">
                  <StrangerHero />
                </main>
              }
            />

            {/* ADMIN */}
            <Route path="/admin" element={<AdminPanel />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}
