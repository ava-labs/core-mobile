import { modalScreensOptions } from "@/utils/screenOptions";
import { Stack } from "expo-router";

export default function SignedInLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(modals)/settings" options={modalScreensOptions} />
      <Stack.Screen name="(modals)/receive" options={modalScreensOptions} />
      <Stack.Screen name="(modals)/notifications" options={modalScreensOptions} />
    </Stack>
  );
}