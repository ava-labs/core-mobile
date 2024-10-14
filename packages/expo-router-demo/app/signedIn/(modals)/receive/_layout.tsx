import { Stack } from '@/layouts/Stack'
import { modalStackNavigatorScreenOptions } from '@/utils/screenOptions'

export default function ReceiveLayout() {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
