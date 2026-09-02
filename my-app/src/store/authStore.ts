import { create } from 'zustand';
import { MaintenanceType, User, UserRole } from '../types';
import { supabase } from '../utils/supabase';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  inviteCodes: Map<string, { role: UserRole; companyId: string; createdAt: number }>;
  register: (
    name: string,
    title: string,
    phone: string,
    companyName: string,
    email: string,
    password: string
  ) => Promise<{ userId: string; companyId: string }>;
  adminLogin: (email: string, password: string) => Promise<void>;
  passwordLogin: (email: string, password: string, role: UserRole) => Promise<void>;
  login: (inviteCode: string, name: string, role: UserRole, email: string, password: string) => Promise<void>;
  generateInviteCode: (
    role: UserRole,
    departmentId?: string,
    maintenanceType?: MaintenanceType,
    authorityLevel?: 'seviye_1' | 'seviye_2'
  ) => Promise<string>;
  logout: () => void;
}

const PROFILE_SELECT = 'id, name, company_id, role, department_id, authority_level, maintenance_type, title, phone';

const getSessionUser = async (): Promise<string> => {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) throw error ?? new Error('Oturum oluşturulamadı.');
  return data.user.id;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  hydrate: async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;
    if (!sessionUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .eq('id', sessionUser.id)
      .maybeSingle();
    if (profile) {
      set({
        user: {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          companyId: profile.company_id,
          departmentId: profile.department_id ?? undefined,
          authorityLevel: profile.authority_level ?? undefined,
          maintenanceType: profile.maintenance_type ?? undefined,
          title: profile.title ?? undefined,
          phone: profile.phone ?? undefined,
        },
      });
    }
  },
  inviteCodes: new Map(),

  register: async (name, title, phone, companyName, email, password) => {
    set({ isLoading: true });
    try {
      const userId = await getSessionUser();
      const { error: accountError } = await supabase.auth.updateUser({ email, password });
      if (accountError) throw accountError;
      const { data, error } = await supabase.rpc('create_company', {
        company_name: companyName,
        admin_name: name,
        admin_title: title || null,
        admin_phone: phone || null,
      });
      if (error) throw error;
      const result = data as { company_id: string };
      set({
        user: {
          id: userId,
          name,
          role: 'admin',
          companyId: result.company_id,
          title: title || undefined,
          phone: phone || undefined,
        },
      });
      return { userId, companyId: result.company_id };
    } finally {
      set({ isLoading: false });
    }
  },

  adminLogin: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error ?? new Error('Admin oturumu oluşturulamadı.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', data.user.id)
        .single();
      if (profileError || !profile) throw profileError ?? new Error('Admin profili bulunamadı.');
      if (profile.role !== 'admin') throw new Error('Bu hesap işletme sahibi hesabı değil.');

      set({
        user: {
          id: profile.id,
          name: profile.name,
          role: 'admin',
          companyId: profile.company_id,
          departmentId: profile.department_id ?? undefined,
          authorityLevel: profile.authority_level ?? undefined,
          maintenanceType: profile.maintenance_type ?? undefined,
          title: profile.title ?? undefined,
          phone: profile.phone ?? undefined,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  passwordLogin: async (email, password, role) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw error ?? new Error('Oturum oluşturulamadı.');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(PROFILE_SELECT)
        .eq('id', data.user.id)
        .single();
      if (profileError || !profile) throw profileError ?? new Error('Profil bulunamadı.');
      if (profile.role !== role) throw new Error('Bu hesap seçilen role ait değil.');
      set({
        user: {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          companyId: profile.company_id,
          departmentId: profile.department_id ?? undefined,
          authorityLevel: profile.authority_level ?? undefined,
          maintenanceType: profile.maintenance_type ?? undefined,
          title: profile.title ?? undefined,
          phone: profile.phone ?? undefined,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  generateInviteCode: async (role, departmentId, maintenanceType, authorityLevel) => {
    const { data, error } = await supabase.rpc('create_invite', {
      invite_role: role,
      target_department_id: departmentId ?? null,
      invite_maintenance_type: maintenanceType ?? 'genel',
      invite_authority_level: authorityLevel ?? null,
    });
    if (error) throw error;
    return data as string;
  },

  login: async (inviteCode, name, role, email, password) => {
    set({ isLoading: true });
    try {
      const userId = await getSessionUser();
      const { error: accountError } = await supabase.auth.updateUser({ email, password });
      if (accountError) throw accountError;
      const { data, error } = await supabase.rpc('redeem_invite', {
        invite_code: inviteCode,
        member_name: name,
      });
      if (error) throw error;
      const result = data as {
        company_id: string;
        role: UserRole;
        department_id?: string;
        authority_level?: 'seviye_1' | 'seviye_2';
        maintenance_type?: MaintenanceType;
      };
      if (result.role !== role) throw new Error('Davet kodu bu rol için oluşturulmamış.');
      set({
        user: {
          id: userId,
          name,
          role: result.role,
          companyId: result.company_id,
          departmentId: result.department_id,
          authorityLevel: result.authority_level,
          maintenanceType: result.maintenance_type,
        },
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    void supabase.auth.signOut();
    set({ user: null });
  },
}));