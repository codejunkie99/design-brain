import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/layout/AppShell";
import { useInitialize } from "@/hooks/useInitialize";
import { DashboardPage } from "@/components/dashboard/DashboardPage";
import { CapturePage } from "@/components/capture/CapturePage";
import { KnowledgeGraphPage } from "@/components/knowledge/KnowledgeGraphPage";
import { TokensPage } from "@/components/tokens/TokensPage";
import { MoodboardPage } from "@/components/moodboard/MoodboardPage";
import { SearchPage } from "@/components/search/SearchPage";
import { SettingsPage } from "@/components/settings/SettingsPage";

export default function App() {
  useInitialize();

  return (
    <ThemeProvider defaultTheme="light" storageKey="design-brain-theme">
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="capture" element={<CapturePage />} />
              <Route path="knowledge" element={<KnowledgeGraphPage />} />
              <Route path="tokens" element={<TokensPage />} />
              <Route path="moodboard" element={<MoodboardPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
