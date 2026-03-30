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
import { MatchObservationNewPage } from "@/pages/MatchObservationNewPage";
import { MatchObservationNewLayout } from "@/pages/MatchObservationNewLayout";
import { MatchObservationPlayerFormPage } from "@/pages/MatchObservationPlayerFormPage";
import { MatchObservationEditPage } from "@/pages/MatchObservationEditPage";
import { MatchObservationAddPlayerPage } from "@/pages/MatchObservationAddPlayerPage";
import { IndividualObservationNewPage } from "@/pages/IndividualObservationNewPage";
import { ObservationDetailPage } from "@/pages/ObservationDetailPage";
import { EditObservationPage } from "@/pages/EditObservationPage";
import { PipelinePage } from "@/pages/PipelinePage";
import { RecruitmentAnalyticsPage } from "@/pages/RecruitmentAnalyticsPage";
import { TasksPage } from "@/pages/TasksPage";
import { NewTaskPage } from "@/pages/NewTaskPage";
import { EditTaskPage } from "@/pages/EditTaskPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SettingsUsersPage } from "@/pages/SettingsUsersPage";
import { AdminAnalyticsSettingsPage } from "@/pages/AdminAnalyticsSettingsPage";
import { DictionaryListPage } from "@/pages/DictionaryListPage";
import { DictionaryDetailPage } from "@/pages/DictionaryDetailPage";
import { FavoriteListsPage } from "@/pages/FavoriteListsPage";
import { FavoriteListDetailPage } from "@/pages/FavoriteListDetailPage";
import { DemandsPage } from "@/pages/DemandsPage";
import { DemandDetailPage } from "@/pages/DemandDetailPage";
import { NewDemandPage } from "@/pages/NewDemandPage";
import { EditDemandPage } from "@/pages/EditDemandPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { AnalyticsRoute } from "@/features/auth/AnalyticsRoute";
import { AdminRoute } from "@/features/auth/AdminRoute";
import { SettingsRoute } from "@/features/auth/SettingsRoute";
import { PipelineRoute } from "@/features/auth/PipelineRoute";
import { UsageStatisticsPage } from "@/pages/UsageStatisticsPage";
import { AdminSurveyResultsPage } from "@/pages/AdminSurveyResultsPage";
import { SurveySatisfactionPage } from "@/pages/SurveySatisfactionPage";
import { SurveyThankYouPage } from "@/pages/SurveyThankYouPage";
import { TacticalFormationsListPage } from "@/pages/TacticalFormationsListPage";
import { TacticalPositionDictionaryPage } from "@/pages/TacticalPositionDictionaryPage";
import { FormTemplatesPage } from "@/pages/FormTemplatesPage";
import { FormationEditorPage } from "@/pages/FormationEditorPage";
import { AdminDataTransferPage } from "@/pages/AdminDataTransferPage";

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
            <Route path="match">
              <Route path="new" element={<MatchObservationNewLayout />}>
                <Route index element={<MatchObservationNewPage />} />
                <Route path="player" element={<MatchObservationPlayerFormPage />} />
                <Route path="player/:slotId" element={<MatchObservationPlayerFormPage />} />
              </Route>
              <Route path=":matchId/edit" element={<MatchObservationEditPage />} />
              <Route path=":matchId/player/new" element={<MatchObservationAddPlayerPage />} />
            </Route>
            <Route path="individual/new" element={<IndividualObservationNewPage />} />
            <Route path=":id" element={<ObservationDetailPage />} />
            <Route path=":id/edit" element={<EditObservationPage />} />
          </Route>
          <Route path="/pipeline" element={<PipelineRoute><PipelinePage /></PipelineRoute>} />
          <Route element={<AnalyticsRoute />}>
            <Route
              path="/analytics/recruitment-pipeline"
              element={<RecruitmentAnalyticsPage />}
            />
          </Route>
          <Route path="/tasks">
            <Route index element={<TasksPage />} />
            <Route path="new" element={<NewTaskPage />} />
            <Route path=":id/edit" element={<EditTaskPage />} />
          </Route>
          <Route path="/favorites" element={<FavoriteListsPage />} />
          <Route path="/favorites/:id" element={<FavoriteListDetailPage />} />
          <Route path="/demands" element={<DemandsPage />} />
          <Route path="/demands/new" element={<NewDemandPage />} />
          <Route path="/demands/:id" element={<DemandDetailPage />} />
          <Route path="/demands/:id/edit" element={<EditDemandPage />} />
          <Route path="/settings" element={<SettingsRoute />}>
            <Route index element={<SettingsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="users" element={<SettingsUsersPage />} />
              <Route path="admin/usage-statistics" element={<UsageStatisticsPage />} />
              <Route path="admin/user-satisfaction" element={<AdminSurveyResultsPage />} />
              <Route path="admin/data-transfer" element={<AdminDataTransferPage />} />
              <Route path="tactical/formations" element={<TacticalFormationsListPage />} />
              <Route path="tactical/formations/new" element={<FormationEditorPage />} />
              <Route path="tactical/formations/:id" element={<FormationEditorPage />} />
              <Route path="tactical/positions" element={<TacticalPositionDictionaryPage />} />
              {/* Nowy, bardziej intuicyjny adres dla Wzorów formularzy */}
              <Route path="form-templates" element={<FormTemplatesPage />} />
              {/* Zachowanie starej ścieżki dla kompatybilności */}
              <Route path="tactical/form-templates" element={<FormTemplatesPage />} />
            </Route>
            <Route path="dictionaries" element={<DictionaryListPage />} />
            <Route path="dictionaries/:route" element={<DictionaryDetailPage />} />
          </Route>
          <Route path="/survey/satisfaction" element={<SurveySatisfactionPage />} />
          <Route path="/survey/thank-you" element={<SurveyThankYouPage />} />
          <Route path="/admin/settings/analytics" element={<AdminAnalyticsSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
