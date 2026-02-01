import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteForm } from "@/features/auth/InviteForm";

export function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Ustawienia</h1>
        <p className="text-sm text-slate-600">
          Zarzadzaj uzytkownikami i zaproszeniami.
        </p>
      </div>
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
