import { PageHeader } from "@/components/common/PageHeader";
import { UserManagement } from "@/features/users/components/UserManagement";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";

export function SettingsPage() {
  const { data: currentUser } = useCurrentUserProfile();
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ustawienia"
        subtitle="Zarzadzaj uzytkownikami."
      />
      {isAdmin && <UserManagement />}
    </div>
  );
}
