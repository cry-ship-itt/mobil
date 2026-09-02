import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types';

export function AuthGuard({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role !== role) return <Redirect href="/(auth)/login" />;

  return <>{children}</>;
}