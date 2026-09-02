import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';
import { AuthGuard } from '../../components/AuthGuard';

export default function AmiriLayout() {
  return (
    <AuthGuard role="amiri">
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="scan-machine" options={{ title: 'QR ile Arıza Bildir' }} />
        <Stack.Screen name="report-ticket" options={{ title: 'Arıza Detayı' }} />
        <Stack.Screen name="ticket-detail" options={{ title: 'Arıza Detayı' }} />
      </Stack>
    </AuthGuard>
  );
}