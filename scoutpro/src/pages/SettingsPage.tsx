import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { UserManagement } from "@/features/users/components/UserManagement";
import { useCurrentUserProfile } from "@/features/users/hooks/useUsers";
import { BookOpen } from "lucide-react";

export function SettingsPage() {
  const { data: currentUser } = useCurrentUserProfile();
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ustawienia"
        subtitle="Zarzadzaj uzytkownikami i slownikami aplikacji."
      />
      {isAdmin && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/settings/dictionaries">
              <Button variant="outline">
                <BookOpen className="mr-2 h-4 w-4" />
                Slowniki
              </Button>
            </Link>
          </div>
          <UserManagement />
        </>
      )}
    </div>
  );
}
