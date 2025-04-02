import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { LogoModal } from 'common/components/LogoModal'
import { useColorScheme } from 'common/hooks/useColorScheme'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { hideModal, showModal } from 'utils/modal'

export const useLogoModal = (): {
  showLogoModal: () => void
  hideLogoModal: () => void
} => {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const colorScheme = useColorScheme()

  const showLogoModal = (): void => {
    showModal(
      <K2AlpineThemeProvider
        colorScheme={isDeveloperMode ? 'dark' : colorScheme}>
        <LogoModal />
      </K2AlpineThemeProvider>
    )
  }

  const hideLogoModal = (): void => {
    hideModal()
  }

  return { showLogoModal, hideLogoModal }
}
