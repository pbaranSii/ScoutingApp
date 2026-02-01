import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function ProtectedRoute() {
  const location = useLocation();
  const { isLoading, session } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
