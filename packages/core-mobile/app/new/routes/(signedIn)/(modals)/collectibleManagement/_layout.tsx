import { useTheme } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import React from 'react'

export default function CollectibleManagementLayout(): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <Stack
      screenOptions={{
        ...modalStackNavigatorScreenOptions,
        headerStyle: {
          backgroundColor: colors.$surfacePrimary
        }
      }}>
      <Stack.Screen name="index" options={modalFirstScreenOptions} />
    </Stack>
  )
}
