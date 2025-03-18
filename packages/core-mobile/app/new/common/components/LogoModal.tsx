import {
  K2AlpineThemeProvider,
  Logos,
  View,
  useTheme
} from '@avalabs/k2-alpine'
import React from 'react'
import { Appearance } from 'react-native'
import { hideModal, showModal } from 'utils/modal'

export const LogoModal = (): JSX.Element => {
  const { theme } = useTheme()

  return (
    <View
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.$surfacePrimary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute'
      }}>
      <Logos.AppIcons.Core color={theme.colors.$textPrimary} />
    </View>
  )
}

export const showLogoModal = (): void => {
  const colorScheme = Appearance.getColorScheme()

  showModal(
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <LogoModal />
    </K2AlpineThemeProvider>
  )
}

export const hideLogoModal = (): void => {
  hideModal()
}
