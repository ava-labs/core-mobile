import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { LogoModal } from 'common/components/LogoModal'
import { useColorScheme } from 'common/contexts/ColorSchemeProvider'
import React from 'react'
import { hideModal, showModal } from 'utils/modal'

export const useLogoModal = (): {
  showLogoModal: () => void
  hideLogoModal: () => void
} => {
  const { colorScheme } = useColorScheme()

  const showLogoModal = (): void => {
    showModal(
      <K2AlpineThemeProvider colorScheme={colorScheme}>
        <LogoModal />
      </K2AlpineThemeProvider>
    )
  }

  const hideLogoModal = (): void => {
    hideModal()
  }

  return { showLogoModal, hideLogoModal }
}
