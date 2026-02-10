import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";

export function ProtectedRoute() {
  const location = useLocation();
  const { isLoading, session, logout } = useAuthStore();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUserProfile();
  const hasLoggedOut = useRef(false);

  if (isLoading || (session && isUserLoading)) {
    return <LoadingSpinner />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (session && !isUserLoading && currentUser === null) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-4 text-center">
        <p className="text-muted-foreground">
          Brak rekordu uzytkownika w systemie. Skontaktuj sie z administratorem.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="text-primary underline"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  if (currentUser && !currentUser.is_active) {
    if (!hasLoggedOut.current) {
      hasLoggedOut.current = true;
      void logout();
    }
    return <Navigate to="/login" replace state={{ from: location, suspended: true }} />;
  }

  return <Outlet />;
}
