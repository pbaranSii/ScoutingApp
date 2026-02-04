import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthState = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setAuth: (session: Session | null) => void;
  subscribeToAuthChanges: () => () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  setAuth: (session) =>
    set({
      session,
      user: session?.user ?? null,
      error: null,
    }),
  initialize: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }
    set({
      session: data.session,
      user: data.session?.user ?? null,
      isLoading: false,
      error: null,
    });
  },
  login: async (email, password, _remember) => {
    void _remember;
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
    set({
      session: data.session,
      user: data.user ?? null,
      isLoading: false,
      error: null,
    });
  },
  logout: async () => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
    set({ user: null, session: null, isLoading: false, error: null });
  },
  subscribeToAuthChanges: () => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, isLoading: false });
    });
    return () => subscription.unsubscribe();
  },
}));
