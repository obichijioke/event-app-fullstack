import { Stack } from 'expo-router';

export default function EventsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/checkout" />
      <Stack.Screen name="[id]/payment" />
      <Stack.Screen name="[id]/agenda" />
      <Stack.Screen name="[id]/speakers" />
      <Stack.Screen name="[id]/faqs" />
      <Stack.Screen name="[id]/announcements" />
      <Stack.Screen name="[id]/reviews" />
    </Stack>
  );
}
