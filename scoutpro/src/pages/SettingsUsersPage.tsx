import { Link } from "react-router-dom";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { UserManagement } from "@/features/users/components/UserManagement";

export function SettingsUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link to="/settings">
          <Button variant="ghost" size="sm" className="-ml-2 mb-2">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Wstecz
          </Button>
        </Link>
        <PageHeader
          title="Użytkownicy"
          subtitle="Zarządzaj dostępem i danymi użytkowników aplikacji."
        />
      </div>
      <UserManagement />
    </div>
  );
}
