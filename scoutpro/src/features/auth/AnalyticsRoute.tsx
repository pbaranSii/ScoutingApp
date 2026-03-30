import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canViewAnalytics } from "@/features/users/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function AnalyticsRoute() {
  const location = useLocation();
  const { data: currentUser, isLoading } = useCurrentUserProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!canViewAnalytics(currentUser.business_role)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-muted-foreground">Nie masz dostępu do modułu Analytics.</p>
      </div>
    );
  }

  return <Outlet />;
}

