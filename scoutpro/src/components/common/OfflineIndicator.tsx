import { AlertCircle, RefreshCw, WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSync } from "@/features/offline/hooks/useSync";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingCount, isSyncing, syncProgress, syncPendingObservations } =
    useSync();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  const label = !isOnline
    ? "Tryb offline"
    : isSyncing
      ? `Synchronizacja... ${syncProgress.current}/${syncProgress.total}`
      : `${pendingCount} oczekujacych na synchronizacje`;

  return (
    <div
      className={[
        "fixed left-0 right-0 top-0 z-50 px-4 py-2 text-sm font-medium",
        isOnline ? "bg-blue-600 text-white" : "bg-yellow-400 text-yellow-900",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <WifiOff className="h-4 w-4" />
          ) : isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{label}</span>
        </div>
        {isOnline && pendingCount > 0 && !isSyncing && (
          <button
            className="text-xs underline"
            onClick={syncPendingObservations}
          >
            Synchronizuj teraz
          </button>
        )}
      </div>
    </div>
  );
}
