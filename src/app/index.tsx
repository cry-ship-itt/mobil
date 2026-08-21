import { useEffect } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore, AuthState } from '../store/authStore';
import { colors } from '../constants/theme';

export default function Index() {
  const user = useAuthStore((s: AuthState) => s.user);

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login');
    } else if (user.role === 'admin') {
      router.replace('/(admin)');
    } else if (user.role === 'amiri') {
      router.replace('/(amiri)');
    } else if (user.role === 'bakimci') {
      router.replace('/(bakimci)');
    }
  }, [user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}