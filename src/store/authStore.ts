import { create } from 'zustand';
import { User, UserRole } from '../types';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  inviteCodes: Map<string, { role: UserRole; companyId: string; createdAt: number }>;
  register: (name: string, companyName: string) => Promise<{ userId: string; companyId: string }>;
  login: (inviteCode: string, name: string, role: UserRole) => Promise<void>;
  generateInviteCode: (role: UserRole) => string;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set: (state: Partial<AuthState>) => void) => {
  const inviteCodes = new Map<string, { role: UserRole; companyId: string; createdAt: number }>();

  return {
    user: null,
    isLoading: false,
    inviteCodes,

    // Admin register - işletme kuruluşu
    register: async (name: string, companyName: string) => {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const userId = 'admin-' + Date.now();
      const companyId = 'company-' + Date.now();

      set({
        user: {
          id: userId,
          name,
          role: 'admin',
          companyId,
        },
        isLoading: false,
      });

      return { userId, companyId };
    },

    // Davet kodu oluştur
    generateInviteCode: (role: UserRole) => {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const user = useAuthStore.getState().user;
      
      if (user && user.role === 'admin') {
        inviteCodes.set(code, {
          role,
          companyId: user.companyId,
          createdAt: Date.now(),
        });
      }
      return code;
    },

    // Davet kodu ile giriş
    login: async (inviteCode: string, name: string, role: UserRole) => {
      set({ isLoading: true });
      await new Promise((resolve) => setTimeout(resolve, 500));

      const codeData = inviteCodes.get(inviteCode);
      const companyId = codeData?.companyId || 'company-' + inviteCode;

      set({
        user: {
          id: role + '-' + Date.now(),
          name,
          role,
          companyId,
        },
        isLoading: false,
      });
    },

    logout: () => set({ user: null }),
  };
});