import { Stack } from "@/layouts/Stack";

export default function SignedOutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
