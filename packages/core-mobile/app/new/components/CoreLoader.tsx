import {
  K2AlpineThemeProvider,
  Logos,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import React from 'react'
import { StyleSheet } from 'react-native'
import { hideModal, showModal } from 'utils/modal'

export const CoreLoader = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      sx={{
        ...StyleSheet.absoluteFillObject,
        height: '100',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '$surfacePrimary'
      }}>
      <Logos.Core color={theme.colors.$textPrimary} />
    </View>
  )
}

export const showCoreLogoModal = (): void => {
  showModal(
    <K2AlpineThemeProvider>
      <CoreLoader />
    </K2AlpineThemeProvider>
  )
}

export const hideCoreLogoModal = (): void => {
  hideModal()
}
