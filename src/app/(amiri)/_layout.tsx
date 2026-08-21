import { Stack } from 'expo-router';
import { colors } from '../../constants/theme';

export default function AmiriLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Yeni Arıza Kaydı' }} />
    </Stack>
  );
}