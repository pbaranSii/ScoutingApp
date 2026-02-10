import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { InviteForm } from "@/features/auth/InviteForm";
import { UserManagement } from "@/features/users/components/UserManagement";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";

export function SettingsPage() {
  const { data: currentUser } = useCurrentUserProfile();
  const isAdmin = currentUser?.role === "admin";
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const canUseDom = typeof document !== "undefined";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ustawienia"
        subtitle="Zarzadzaj uzytkownikami i zaproszeniami."
      />
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsInviteOpen(true)}>Dodaj uzytkownika</Button>
        </div>
      )}
      {isAdmin && <UserManagement />}

      {canUseDom &&
        isInviteOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsInviteOpen(false)}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="invite-dialog-title"
            >
              <h2 id="invite-dialog-title" className="text-lg font-semibold text-slate-900">
                Zaproszenia
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Wyslij zaproszenie e-mailem. Uzytkownik ustawi haslo po wejsciu w link.
              </p>
              <div className="mt-4">
                <InviteForm onSuccess={() => setIsInviteOpen(false)} />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
