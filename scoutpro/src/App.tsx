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
import { UsageStatisticsPage } from "@/pages/UsageStatisticsPage";
import { AdminSurveyResultsPage } from "@/pages/AdminSurveyResultsPage";
import { SurveySatisfactionPage } from "@/pages/SurveySatisfactionPage";
import { SurveyThankYouPage } from "@/pages/SurveyThankYouPage";

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
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/settings/users" element={<SettingsUsersPage />} />
            <Route path="/settings/admin/usage-statistics" element={<UsageStatisticsPage />} />
            <Route path="/settings/admin/user-satisfaction" element={<AdminSurveyResultsPage />} />
          </Route>
          <Route path="/survey/satisfaction" element={<SurveySatisfactionPage />} />
          <Route path="/survey/thank-you" element={<SurveyThankYouPage />} />
          <Route path="/admin/settings/analytics" element={<AdminAnalyticsSettingsPage />} />
          <Route path="/settings/dictionaries" element={<DictionaryListPage />} />
          <Route path="/settings/dictionaries/:route" element={<DictionaryDetailPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
