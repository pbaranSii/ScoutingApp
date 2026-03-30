import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canAccessSettings } from "@/features/users/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

/** Blocks scout role from accessing Settings and all /settings/* routes. */
export function SettingsRoute() {
  const location = useLocation();
  const { data: currentUser, isLoading } = useCurrentUserProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!canAccessSettings(currentUser.business_role)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
