import { Stack } from "@/layouts/Stack";
import { stackNavigatorScreenOptions } from "@/utils/screenOptions";

export default function TrackLayout() {
  return (
    <Stack screenOptions={stackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
