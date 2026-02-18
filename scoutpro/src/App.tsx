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
import { NewPlayerPage } from "@/pages/NewPlayerPage";
import { PlayerDetailPage } from "@/pages/PlayerDetailPage";
import { EditPlayerPage } from "@/pages/EditPlayerPage";
import { ObservationsPage } from "@/pages/ObservationsPage";
import { NewObservationPage } from "@/pages/NewObservationPage";
import { ObservationDetailPage } from "@/pages/ObservationDetailPage";
import { EditObservationPage } from "@/pages/EditObservationPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { TasksPage } from "@/pages/TasksPage";
import { NewTaskPage } from "@/pages/NewTaskPage";
import { EditTaskPage } from "@/pages/EditTaskPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { DictionaryListPage } from "@/pages/DictionaryListPage";
import { DictionaryDetailPage } from "@/pages/DictionaryDetailPage";
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
          <Route path="/players/new" element={<NewPlayerPage />} />
          <Route path="/players/:id" element={<PlayerDetailPage />} />
          <Route path="/players/:id/edit" element={<EditPlayerPage />} />
          <Route path="/observations">
            <Route index element={<ObservationsPage />} />
            <Route path="new" element={<NewObservationPage />} />
            <Route path=":id" element={<ObservationDetailPage />} />
            <Route path=":id/edit" element={<EditObservationPage />} />
          </Route>
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/tasks">
            <Route index element={<TasksPage />} />
            <Route path="new" element={<NewTaskPage />} />
            <Route path=":id/edit" element={<EditTaskPage />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/dictionaries" element={<DictionaryListPage />} />
          <Route path="/settings/dictionaries/:route" element={<DictionaryDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
