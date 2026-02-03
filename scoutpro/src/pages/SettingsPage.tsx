import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "@/features/auth/InviteForm";
import { PageHeader } from "@/components/common/PageHeader";

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Ustawienia"
        subtitle="Zarzadzaj uzytkownikami i zaproszeniami."
      />
      <Card>
        <CardHeader>
          <CardTitle>Zaproszenia</CardTitle>
        </CardHeader>
        <CardContent>
          <InviteForm />
        </CardContent>
      </Card>
    </div>
  );
}
