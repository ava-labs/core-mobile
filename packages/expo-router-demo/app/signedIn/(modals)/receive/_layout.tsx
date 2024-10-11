import { modalStackNavigatorScreenOptions } from '@/utils/screenOptions'
import { Stack } from 'expo-router'

export default function ReceiveLayout() {
  return (
    <Stack screenOptions={modalStackNavigatorScreenOptions}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
