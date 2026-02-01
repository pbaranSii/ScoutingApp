import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SetNewPasswordForm } from "@/features/auth/SetNewPasswordForm";

export function SetNewPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">ScoutPro</div>
          <p className="mt-1 text-sm text-slate-600">Ustaw nowe haslo</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nowe haslo</CardTitle>
          </CardHeader>
          <CardContent>
            <SetNewPasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
