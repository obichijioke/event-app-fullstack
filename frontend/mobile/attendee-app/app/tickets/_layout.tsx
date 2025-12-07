import { Stack } from 'expo-router';

export default function TicketsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/transfer" />
      <Stack.Screen name="[id]/qr" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
