import { Stack } from "@/layouts/Stack";
import { stackNavigatorScreenOptions } from "@/utils/screenOptions";

export default function BrowserLayout() {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
