import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { MoreHorizontal, Pencil, Key, Trash2, UserX } from "lucide-react";
import { BUSINESS_ROLE_LABELS, type BusinessRole, type UserProfile } from "../types";
import {
  useCreateUser,
  useSetUserPassword,
  useUpdateUser,
  useUpdateUserStatus,
  useUsers,
} from "../hooks/useUsers";
import { UserForm, type UserFormValues } from "./UserForm";

const splitFullName = (fullName?: string | null) => {
  if (!fullName) return { first_name: "", last_name: "" };
  const parts = fullName.trim().split(/\s+/);
  const first_name = parts.shift() ?? "";
  const last_name = parts.join(" ");
  return { first_name, last_name };
};

export function UserManagement() {
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateUserStatus = useUpdateUserStatus();
  const setPassword = useSetUserPassword();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [passwordUser, setPasswordUser] = useState<UserProfile | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const roleOptions = useMemo(
    () => Object.keys(BUSINESS_ROLE_LABELS).filter((r) => r !== "suspended") as BusinessRole[],
    []
  );

  const handleCreate = async (values: UserFormValues) => {
    try {
      await createUser.mutateAsync({
        email: values.email,
        password: values.password ?? "",
        first_name: values.first_name,
        last_name: values.last_name,
        business_role: values.business_role,
      });
      toast({ title: "Utworzono uzytkownika" });
      setIsCreateOpen(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie utworzyc uzytkownika";
      toast({ variant: "destructive", title: "Blad", description: message });
    }
  };

  const handleUpdate = async (userId: string, values: UserFormValues) => {
    try {
      await updateUser.mutateAsync({
        user_id: userId,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        business_role: values.business_role,
      });
      toast({ title: "Zaktualizowano uzytkownika" });
      setEditUser(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie zapisac zmian";
      toast({ variant: "destructive", title: "Blad", description: message });
    }
  };

  const handleToggleAccess = async (user: UserProfile) => {
    const shouldSuspend = user.business_role !== "suspended" && user.is_active !== false;
    const confirmed = window.confirm(
      shouldSuspend
        ? `Zawiesic dostep dla ${user.full_name ?? user.email}?`
        : `Przywrocic dostep dla ${user.full_name ?? user.email}?`
    );
    if (!confirmed) return;
    try {
      await updateUserStatus.mutateAsync({
        userId: user.id,
        business_role: shouldSuspend ? "suspended" : "scout",
        is_active: !shouldSuspend,
      });
      toast({
        title: shouldSuspend ? "Dostep zawieszony" : "Dostep przywrocony",
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie zmienic dostepu";
      toast({ variant: "destructive", title: "Blad", description: message });
    }
  };

  const handleDeleteAccount = async (user: UserProfile) => {
    const confirmed = window.confirm(
      `Konto zostanie trwale dezaktywowane (usuniete z aplikacji). Uzytkownik ${user.full_name ?? user.email} nie bedzie mogl sie logowac. Dane pozostaja w systemie.\n\nKontynuowac?`
    );
    if (!confirmed) return;
    try {
      await updateUserStatus.mutateAsync({
        userId: user.id,
        business_role: "suspended",
        is_active: false,
      });
      toast({ title: "Konto uzytkownika usuniete (dezaktywowane)" });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie usunac konta";
      toast({ variant: "destructive", title: "Blad", description: message });
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordUser) return;
    try {
      await setPassword.mutateAsync({ user_id: passwordUser.id, password: passwordValue });
      toast({ title: "Haslo zostalo zmienione" });
      setPasswordValue("");
      setPasswordUser(null);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Nie udalo sie zmienic hasla";
      toast({ variant: "destructive", title: "Blad", description: message });
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Ladowanie uzytkownikow...</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Uzytkownicy</CardTitle>
          <p className="text-sm text-slate-500">Zarzadzaj dostepem i danymi uzytkownikow.</p>
        </div>
        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
          Dodaj uzytkownika
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {users?.length ? (
          users.map((user) => {
            const businessRole = user.business_role as BusinessRole;
            const roleMeta = BUSINESS_ROLE_LABELS[businessRole];
            const isSuspended = businessRole === "suspended" || !user.is_active;
            return (
              <div
                key={user.id}
                className="rounded-lg border border-slate-200 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-slate-900">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-sm text-slate-500">{user.email}</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full bg-slate-100 px-2 text-xs text-slate-700 hover:bg-slate-100">
                        {roleMeta?.label ?? businessRole}
                      </Badge>
                      <Badge
                        className={
                          isSuspended
                            ? "rounded-full bg-rose-100 px-2 text-xs text-rose-700 hover:bg-rose-100"
                            : "rounded-full bg-emerald-100 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
                        }
                      >
                        {isSuspended ? "Brak dostepu" : "Aktywny"}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" aria-label="Akcje">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="min-w-[10rem] rounded-md border border-slate-200 bg-white p-1 text-slate-900 shadow-lg"
                    >
                      <DropdownMenuItem
                        onSelect={() => setEditUser(user)}
                        className="cursor-pointer rounded-sm py-2 pl-3 pr-3 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setPasswordUser(user);
                          setPasswordValue("");
                        }}
                        className="cursor-pointer rounded-sm py-2 pl-3 pr-3 text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Zmien haslo
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={
                          isSuspended
                            ? "cursor-pointer rounded-sm py-2 pl-3 pr-3 text-sm text-emerald-600 hover:bg-slate-100 focus:bg-slate-100"
                            : "cursor-pointer rounded-sm py-2 pl-3 pr-3 text-sm text-rose-600 hover:bg-slate-100 focus:bg-slate-100"
                        }
                        onSelect={() => handleToggleAccess(user)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        {isSuspended ? "Przywroc dostep" : "Zawies"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-sm py-2 pl-3 pr-3 text-sm text-rose-600 hover:bg-slate-100 focus:bg-slate-100"
                        onSelect={() => handleDeleteAccount(user)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usun konto
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-slate-500">Brak uzytkownikow do wyswietlenia.</p>
        )}
      </CardContent>

      {typeof document !== "undefined" &&
        isCreateOpen &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsCreateOpen(false)}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">Dodaj uzytkownika</h2>
              <p className="mt-1 text-sm text-slate-600">
                Utworz nowe konto z haslem. Rola jest zapisywana w celach informacyjnych (domyslnie Scout).
              </p>
              <div className="mt-4">
                <UserForm
                  defaultValues={{
                    first_name: "",
                    last_name: "",
                    email: "",
                    business_role: "scout",
                    password: "",
                  }}
                  includePassword
                  submitLabel="Dodaj"
                  isSubmitting={createUser.isPending}
                  onSubmit={handleCreate}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {typeof document !== "undefined" &&
        editUser &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setEditUser(null)}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">Edytuj uzytkownika</h2>
              <p className="mt-1 text-sm text-slate-600">
                Aktualizuj dane i role (informacyjna: Scout, Trener, Administrator itd.).
              </p>
              <div className="mt-4">
                <UserForm
                  key={editUser.id}
                  defaultValues={{
                    ...splitFullName(editUser.full_name),
                    email: editUser.email,
                    business_role: roleOptions.includes(editUser.business_role as BusinessRole)
                      ? (editUser.business_role as BusinessRole)
                      : "scout",
                    password: "",
                  }}
                  submitLabel="Zapisz zmiany"
                  isSubmitting={updateUser.isPending}
                  onSubmit={(values) => handleUpdate(editUser.id, values)}
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {typeof document !== "undefined" &&
        passwordUser &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setPasswordUser(null)}
              aria-hidden
            />
            <div
              className="relative z-[81] w-[min(520px,92vw)] rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <h2 className="text-lg font-semibold text-slate-900">Zmien haslo</h2>
              <p className="mt-1 text-sm text-slate-600">
                Ustaw nowe haslo dla {passwordUser.full_name ?? passwordUser.email}.
              </p>
              <div className="mt-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                <Input
                  type="password"
                  placeholder="Nowe haslo (min. 8 znakow)"
                  value={passwordValue}
                  onChange={(event) => setPasswordValue(event.target.value)}
                  aria-label="Nowe haslo"
                />
                <Button
                  type="button"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePasswordReset();
                  }}
                  disabled={setPassword.isPending || passwordValue.length < 8}
                >
                  {setPassword.isPending ? "Zapisywanie..." : "Zmień haslo"}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </Card>
  );
}
