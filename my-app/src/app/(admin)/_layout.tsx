import { Stack } from 'expo-router';
import { AuthGuard } from '../../components/AuthGuard';

export default function AdminLayout() {
  return (
    <AuthGuard role="admin">
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Admin Paneli', headerShown: false }} />
        <Stack.Screen name="departments/index" options={{ title: 'Departmanlar' }} />
        <Stack.Screen name="departments/[id]" options={{ title: 'Departman Detayı' }} />
        <Stack.Screen name="monitoring" options={{ title: 'Arıza Süreci' }} />
      </Stack>
    </AuthGuard>
  );
}