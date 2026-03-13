import { Link, Navigate } from "react-router-dom";
import { LoginForm } from "@/features/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import scoutProLogo from "@/assets/scoutpro-logo.png";

export function LoginPage() {
  const { session, isLoading } = useAuthStore();

  if (!isLoading && session) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="text-center">
          <img
            src={scoutProLogo}
            alt="ScoutPro"
            className="mx-auto mb-4 h-[180px] w-[180px] object-contain"
            width={180}
            height={180}
            loading="eager"
            decoding="async"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Zaloguj sie</CardTitle>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <div className="mt-4 text-center text-sm text-slate-500">
              <Link className="text-blue-600 hover:underline" to="/reset-password">
                Zapomniales hasla?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
