import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const { initialize, subscribeToAuthChanges } = useAuthStore();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    initialize().then(() => {
      unsubscribe = subscribeToAuthChanges();
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [initialize, subscribeToAuthChanges]);

  return useAuthStore();
}
