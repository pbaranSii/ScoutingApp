import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export function AdminRoute() {
  const location = useLocation();
  const { data: currentUser, isLoading } = useCurrentUserProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-4 text-center">
        <p className="text-muted-foreground">Brak dostępu. Tylko Administrator może przeglądać tę sekcję.</p>
      </div>
    );
  }

  return <Outlet />;
}
