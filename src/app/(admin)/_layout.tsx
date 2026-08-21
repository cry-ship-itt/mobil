import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Admin Paneli',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
