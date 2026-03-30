import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import {
  adminSetUserPassword,
  createUserDirect,
  fetchUserProfile,
  fetchScouts,
  fetchUsers,
  updateUserAsAdmin,
  updateUserStatus,
} from "../api/users.api";
import type { AreaAccess, BusinessRole } from "../types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
}

export function useScouts(areaAccess?: AreaAccess) {
  return useQuery({
    queryKey: ["scouts", areaAccess ?? "ALL"],
    queryFn: () => fetchScouts(areaAccess),
    enabled: areaAccess != null,
  });
}

export function useCurrentUserProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: () => fetchUserProfile(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      first_name?: string | null;
      last_name?: string | null;
      business_role?: BusinessRole;
      area_access?: AreaAccess;
    }) => createUserDirect(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      user_id: string;
      email?: string | null;
      first_name?: string | null;
      last_name?: string | null;
      business_role?: BusinessRole;
      area_access?: AreaAccess;
      is_active?: boolean | null;
    }) =>
      updateUserAsAdmin({
        user_id: input.user_id,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        business_role: input.business_role,
        area_access: input.area_access,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (variables.user_id) {
        queryClient.invalidateQueries({ queryKey: ["user-profile", variables.user_id] });
      }
    },
  });
}

export function useSetUserPassword() {
  return useMutation({
    mutationFn: (input: { user_id: string; password: string }) => adminSetUserPassword(input),
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      business_role,
      is_active,
    }: {
      userId: string;
      business_role?: BusinessRole;
      is_active?: boolean;
    }) => updateUserStatus(userId, { business_role, is_active }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      if (variables.userId) {
        queryClient.invalidateQueries({ queryKey: ["user-profile", variables.userId] });
      }
    },
  });
}
