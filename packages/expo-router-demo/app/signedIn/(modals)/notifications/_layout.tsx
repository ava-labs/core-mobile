import { Stack } from '@/layouts/Stack'
import { modalStackNavigatorScreenOptions } from '@/utils/screenOptions'

export default function NotificationsLayout() {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
