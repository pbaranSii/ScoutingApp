import { Navigate, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { canAccessPipeline } from "@/features/users/types";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

type PipelineRouteProps = {
  children: React.ReactNode;
};

/** Blocks scout role from accessing Pipeline. */
export function PipelineRoute({ children }: PipelineRouteProps) {
  const location = useLocation();
  const { data: currentUser, isLoading } = useCurrentUserProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!canAccessPipeline(currentUser.business_role)) {
    return <Navigate to="/dashboard" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
