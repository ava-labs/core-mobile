import React from 'react'
import { Stack } from 'common/components/Stack'
import {
  modalFirstScreenOptions,
  modalStackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useTheme } from '@avalabs/k2-alpine'
import { CollectiblesProvider } from 'features/portfolio/collectibles/CollectiblesContext'

export default function CollectibleManagementLayout(): JSX.Element {
  const {
    theme: { colors }
  } = useTheme()
  return (
    <CollectiblesProvider>
      <Stack
        screenOptions={{
          ...modalStackNavigatorScreenOptions,
          headerStyle: {
            backgroundColor: colors.$surfacePrimary
          }
        }}>
        <Stack.Screen name="index" options={modalFirstScreenOptions} />
      </Stack>
    </CollectiblesProvider>
  )
}
