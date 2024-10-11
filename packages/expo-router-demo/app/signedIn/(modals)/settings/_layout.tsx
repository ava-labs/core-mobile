import { modalStackNavigatorScreenOptions } from '@/utils/screenOptions'
import { Stack } from 'expo-router'

export default function SettingsLayout() {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
    </Stack>
  )
}
