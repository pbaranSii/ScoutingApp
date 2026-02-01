import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { useAuth } from "@/features/auth/useAuth";
import { useCacheData } from "@/features/offline/hooks/useCacheData";
import { LoginPage } from "@/pages/LoginPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { SetNewPasswordPage } from "@/pages/SetNewPasswordPage";
import { AcceptInvitePage } from "@/pages/AcceptInvitePage";
import { DashboardPage } from "@/pages/DashboardPage";
import { PlayersPage } from "@/pages/PlayersPage";
import { PlayerDetailPage } from "@/pages/PlayerDetailPage";
import { ObservationsPage } from "@/pages/ObservationsPage";
import { NewObservationPage } from "@/pages/NewObservationPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { SettingsPage } from "@/pages/SettingsPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  useAuth();
  useCacheData();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/set-new-password" element={<SetNewPasswordPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/observations/new" element={<NewObservationPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
