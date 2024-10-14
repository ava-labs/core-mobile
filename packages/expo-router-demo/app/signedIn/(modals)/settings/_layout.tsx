import { Stack } from '@/layouts/Stack'
import { modalFirstScreenOptions, modalStackNavigatorScreenOptions } from '@/utils/screenOptions'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index"
        options={modalFirstScreenOptions} />
      <Stack.Screen name="account" />
    </Stack>
  )
}
