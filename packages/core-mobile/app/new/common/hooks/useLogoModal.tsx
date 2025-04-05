import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { LogoModal } from 'common/components/LogoModal'
import React from 'react'
import { useSelector } from 'react-redux'
import { selectSelectedColorScheme } from 'store/settings/appearance'
import { hideModal, showModal } from 'utils/modal'

export const useLogoModal = (): {
  showLogoModal: () => void
  hideLogoModal: () => void
} => {
  const colorScheme = useSelector(selectSelectedColorScheme)

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
